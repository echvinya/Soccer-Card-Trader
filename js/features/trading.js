import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';

/**
 * Trading Module
 * Handles all player trading actions, including buying and selling cards,
 * purchasing the price guide, and executing card trade-ins.
 * It interacts heavily with GameState for inventory and market data,
 * and uses UIRenderer to reflect changes.
 */
export const Trading = {
    /**
     * Handles the purchase of the price guide.
     * Deducts cost from player cash and updates GameState.
     */
    buyPriceGuide() {
        try {
            // Ensure GameState.current and GameConfig are available. Error handling comments from previous pass.
            if (!GameState.current) {
                console.error("Trading Error: GameState.current is not initialized.");
                GameLogger.addLogMessage("Error: Game state not ready for purchasing.");
                return;
            }
            const priceGuideCost = GameConfig?.priceGuideCost ?? 500; // Default cost if not configured
            if (typeof priceGuideCost !== 'number') {
                console.error("Trading Error: GameConfig.priceGuideCost is invalid.");
                GameLogger.addLogMessage("Error: Price guide cost is not configured correctly.");
                return;
            }

            if (GameState.current.cash < priceGuideCost) {
                GameLogger.addLogMessage(`Not enough cash.`);
                return;
            }
            GameState.current.cash -= priceGuideCost;
            GameState.current.hasPriceGuide = true; // Set flag in game state
            GameLogger.addLogMessage(`Purchased Price Guide!`);
            UIRenderer.renderAll(); // Re-render to show price guide effects (e.g., price indicators)
        } catch (error) {
            console.error("Error in buyPriceGuide:", error);
            GameLogger.addLogMessage("An unexpected error occurred while buying the price guide.");
        }
    },

    /**
     * Handles buying a specific quantity of a card from the market.
     * @param {string} cardId - The ID of the card to buy.
     * Logic:
     * 1. Validate game state and inputs (cardId, quantity from DOM).
     * 2. Retrieve card details and current market information for the card.
     * 3. Check if enough quantity is available at a valid price.
     * 4. Calculate total cost, applying volume and store discounts if applicable.
     * 5. Check if player has enough cash.
     * 6. Update GameState: deduct cash, reduce market availability, add card to inventory (or update quantity/totalCost).
     * 7. Log the transaction and re-render UI.
     */
    buyItemQty(cardId) {
        try {
            // Validate GameState readiness. Error handling comments from previous pass.
            if (!GameState.current || !GameState.market || !GameState.current.inventory || !Array.isArray(GameState.current.inventory)) {
                console.error("Trading Error: GameState not fully initialized for buyItemQty.");
                GameLogger.addLogMessage("Error: Game state not ready for buying items.");
                return;
            }
            if (!cardId) {
                console.warn("Trading Warning: buyItemQty called with no cardId.");
                GameLogger.addLogMessage("Error: No card specified for purchase.");
                return;
            }

            // Get quantity from the corresponding input field.
            const quantityElement = document.getElementById(`buy-qty-${cardId}`);
            if (!quantityElement) {
                console.error(`Trading Error: Quantity input element not found for cardId: ${cardId}`);
                GameLogger.addLogMessage("Error: Could not process buy action. UI element missing.");
                return;
            }
            const quantity = parseInt(quantityElement.value);

            if (isNaN(quantity) || quantity <= 0) {
                GameLogger.addLogMessage(`Invalid quantity.`);
                return;
            }

            const card = GameState.getCardDetails(cardId); // Fetch card static data.
            if (!card || !card.name) {
                console.error(`Trading Error: Card details (or card name) not found for cardId: ${cardId}`);
                GameLogger.addLogMessage("Error: Card details not found for purchase.");
                return;
            }

            // Get market data for the card at the current location.
            const currentLocationId = GameState.current.currentLocationId;
            if (!currentLocationId || !GameState.market[currentLocationId]) {
                console.error(`Trading Error: Current location market data not found for locationId: ${currentLocationId}`);
                GameLogger.addLogMessage("Error: Market data for current location is unavailable.");
                return;
            }
            const marketInfo = GameState.market[currentLocationId][cardId];

            // Validate market availability and price.
            if (!marketInfo || typeof marketInfo.available !== 'number' || quantity > marketInfo.available) {
                GameLogger.addLogMessage(`Not enough available to buy. Only ${marketInfo?.available || 0} left.`);
                return;
            }
            if (typeof marketInfo.price !== 'number') {
                console.error(`Trading Error: Market price for ${card.name} is not a number.`);
                GameLogger.addLogMessage("Error: Invalid market price for this item.");
                return;
            }

            let totalCost = marketInfo.price * quantity;

            // Apply discounts if applicable.
            const location = GameState.getCurrentLocation(); // For location-specific discounts (e.g., volume).
            if (location && location.specialization === 'volume' && quantity >= 5) {
                const volumeDiscount = Math.round(totalCost * 0.1); // 10% volume discount
                totalCost -= volumeDiscount;
                GameLogger.addLogMessage(`Volume discount applied: -$${volumeDiscount} (10% off for 5+ cards)`);
            }

            if (GameState.current.storeDiscount > 0 && typeof GameState.current.storeDiscount === 'number') {
                const discountAmount = Math.round(totalCost * (GameState.current.storeDiscount / 100));
                totalCost -= discountAmount;
                GameLogger.addLogMessage(`Store discount applied: -$${discountAmount}`);
            }

            // Final check for player cash.
            if (totalCost > GameState.current.cash) {
                GameLogger.addLogMessage(`Not enough cash. Need $${totalCost.toLocaleString()}. You have $${GameState.current.cash.toLocaleString()}.`);
                return;
            }

            // Update game state:
            GameState.current.cash -= totalCost;
            marketInfo.available -= quantity; // Reduce available quantity in the market.

            // Add to or update player's inventory.
            let inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);
            if (inventoryItem) {
                inventoryItem.quantity += quantity;
                inventoryItem.totalCost += totalCost; // Add to total cost to maintain average buy price.
            } else {
                GameState.current.inventory.push({ cardId, quantity, totalCost });
            }
            GameLogger.addLogMessage(`Bought ${quantity} ${card.name} for $${totalCost.toLocaleString()}.`);
            UIRenderer.renderAll(); // Refresh UI.
        } catch (error) {
            console.error("Error in buyItemQty:", error);
            GameLogger.addLogMessage("An unexpected error occurred while buying the item.");
        }
    },

    /**
     * Buys all available quantity of a specific card from the market.
     * A convenience function that sets the quantity input to max available and calls buyItemQty.
     * @param {string} cardId - The ID of the card to buy.
     */
    buyAllItems(cardId) {
        try {
            // Validate GameState. Error handling comments from previous pass.
            if (!GameState.current || !GameState.market) {
                console.error("Trading Error: GameState not fully initialized for buyAllItems.");
                GameLogger.addLogMessage("Error: Game state not ready for buying items.");
                return;
            }
            if (!cardId) {
                console.warn("Trading Warning: buyAllItems called with no cardId.");
                GameLogger.addLogMessage("Error: No card specified for purchase.");
                return;
            }

            const currentLocationId = GameState.current.currentLocationId;
            if (!currentLocationId || !GameState.market[currentLocationId]) {
                console.error(`Trading Error: Current location market data not found for buyAllItems, locationId: ${currentLocationId}`);
                GameLogger.addLogMessage("Error: Market data for current location is unavailable.");
                return;
            }
            const marketInfo = GameState.market[currentLocationId][cardId];

            if (!marketInfo || typeof marketInfo.available !== 'number' || marketInfo.available <= 0) {
                GameLogger.addLogMessage(`None available to buy.`);
                return;
            }

            // Set the quantity input field to the max available.
            const quantityElement = document.getElementById(`buy-qty-${cardId}`);
            if (!quantityElement) {
                console.error(`Trading Error: Quantity input element not found for cardId during buyAll: ${cardId}`);
                GameLogger.addLogMessage("Error: Could not process buy all action. UI element missing.");
                return;
            }
            quantityElement.value = marketInfo.available;
            this.buyItemQty(cardId); // Delegate to buyItemQty, which has its own try-catch.
        } catch (error) {
            console.error("Error in buyAllItems:", error);
            GameLogger.addLogMessage("An unexpected error occurred while buying all items.");
        }
    },

    /**
     * Handles selling a specific quantity of a card from the player's inventory.
     * @param {string} cardId - The ID of the card to sell.
     * Logic:
     * 1. Validate game state and inputs (cardId, quantity from DOM).
     * 2. Find the item in player's inventory.
     * 3. Retrieve card details and current market price.
     * 4. Calculate total sale value and the cost of the sold items (for profit tracking, proportionally).
     * 5. Update GameState: increase cash, decrease inventory quantity and totalCost. Remove item if quantity is zero.
     * 6. Log transaction and re-render UI.
     */
    sellItemQty(cardId) {
        try {
            // Validate GameState readiness. Error handling comments from previous pass.
            if (!GameState.current || !GameState.market || !GameState.current.inventory || !Array.isArray(GameState.current.inventory)) {
                console.error("Trading Error: GameState not fully initialized for sellItemQty.");
                GameLogger.addLogMessage("Error: Game state not ready for selling items.");
                return;
            }
             if (!cardId) {
                console.warn("Trading Warning: sellItemQty called with no cardId.");
                GameLogger.addLogMessage("Error: No card specified for selling.");
                return;
            }

            const quantityElement = document.getElementById(`sell-qty-${cardId}`);
            if (!quantityElement) {
                console.error(`Trading Error: Quantity input element not found for cardId: ${cardId}`);
                GameLogger.addLogMessage("Error: Could not process sell action. UI element missing.");
                return;
            }
            const quantity = parseInt(quantityElement.value);
            const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);

            // Validate quantity and inventory item.
            if (isNaN(quantity) || quantity <= 0) {
                GameLogger.addLogMessage(`Invalid quantity.`);
                return;
            }
            if (!inventoryItem || typeof inventoryItem.quantity !== 'number' || quantity > inventoryItem.quantity) {
                GameLogger.addLogMessage(`You don't have that many to sell. You have ${inventoryItem?.quantity || 0}.`);
                return;
            }

            const card = GameState.getCardDetails(cardId); // Fetch card static data.
            if (!card || !card.name) {
                console.error(`Trading Error: Card details (or card name) not found for cardId: ${cardId}`);
                GameLogger.addLogMessage("Error: Card details not found for selling.");
                return;
            }

            // Get current market price for the card.
            const currentLocationId = GameState.current.currentLocationId;
            if (!currentLocationId || !GameState.market[currentLocationId]) {
                console.error(`Trading Error: Current location market data not found for sellItemQty, locationId: ${currentLocationId}`);
                GameLogger.addLogMessage("Error: Market data for current location is unavailable.");
                return;
            }
            const marketCardInfo = GameState.market[currentLocationId][cardId];
            const currentMarketPrice = marketCardInfo?.price;

            if (typeof currentMarketPrice !== 'number') {
                GameLogger.addLogMessage(`Cannot determine sell price for ${card.name}.`);
                console.warn(`Trading Warning: Market price for ${cardId} at ${currentLocationId} is undefined or not a number.`);
                return;
            }

            const totalSaleValue = currentMarketPrice * quantity;
            let costOfSoldItems = 0;
            // Calculate the cost of the items being sold, proportionally to their average buy price.
            // This is important for accurate profit/loss tracking if implemented later.
            if (inventoryItem.quantity !== 0) { // Should be true due to earlier check.
                costOfSoldItems = (inventoryItem.totalCost / inventoryItem.quantity) * quantity;
            }

            // Update game state:
            GameState.current.cash += totalSaleValue;
            inventoryItem.quantity -= quantity;
            // Reduce totalCost proportionally. If costOfSoldItems is NaN (e.g. from 0/0), default to 0.
            inventoryItem.totalCost -= isNaN(costOfSoldItems) ? 0 : costOfSoldItems;

            // If all quantity of this card is sold, remove it from inventory.
            if (inventoryItem.quantity <= 0) {
                GameState.current.inventory = GameState.current.inventory.filter(item => item.cardId !== cardId);
            }
            GameLogger.addLogMessage(`Sold ${quantity} ${card.name} for $${totalSaleValue.toLocaleString()}.`);
            UIRenderer.renderAll(); // Refresh UI.
        } catch (error) {
            console.error("Error in sellItemQty:", error);
            GameLogger.addLogMessage("An unexpected error occurred while selling the item.");
        }
    },

    /**
     * Sells all quantity of a specific card from the player's inventory.
     * A convenience function that sets the quantity input to max owned and calls sellItemQty.
     * @param {string} cardId - The ID of the card to sell.
     */
    sellAllItems(cardId) {
        try {
            // Validate GameState. Error handling comments from previous pass.
            if (!GameState.current || !GameState.current.inventory || !Array.isArray(GameState.current.inventory)) {
                console.error("Trading Error: GameState not fully initialized for sellAllItems.");
                GameLogger.addLogMessage("Error: Game state not ready for selling items.");
                return;
            }
            if (!cardId) {
                console.warn("Trading Warning: sellAllItems called with no cardId.");
                GameLogger.addLogMessage("Error: No card specified for selling.");
                return;
            }

            const cardDetails = GameState.getCardDetails(cardId); // For logging if item not found by name
            const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);

            if (!inventoryItem || inventoryItem.quantity <= 0) {
                GameLogger.addLogMessage(`None of ${cardDetails?.name || 'this item'} to sell.`);
                return;
            }

            const quantityElement = document.getElementById(`sell-qty-${cardId}`);
            if (!quantityElement) {
                console.error(`Trading Error: Quantity input element not found for cardId during sellAll: ${cardId}`);
                GameLogger.addLogMessage("Error: Could not process sell all action. UI element missing.");
                return;
            }
            quantityElement.value = inventoryItem.quantity; // Set input to max owned quantity.
            this.sellItemQty(cardId); // Delegate to sellItemQty, which has its own try-catch.
        } catch (error) {
            console.error("Error in sellAllItems:", error);
            GameLogger.addLogMessage("An unexpected error occurred while selling all items.");
        }
    },

    /**
     * Executes a trade-in: 25 common singles for one random, more valuable card.
     * This is a special action available at certain locations.
     * Logic:
     * 1. Validate game state and check if player has enough common singles.
     * 2. Deduct common singles and adjust their totalCost in inventory.
     * 3. Filter eligible reward cards (not common_single, basePrice >= 50).
     * 4. If no eligible cards, log message and refund the commons.
     * 5. Randomly select a reward card and add it to player's inventory.
     * 6. Log success and re-render UI.
     */
    executeTradeIn() {
        try {
            // Validate GameState and GameData. Error handling comments from previous pass.
            if (!GameState.current || !GameState.current.inventory || !Array.isArray(GameState.current.inventory)) {
                console.error("Trading Error: GameState not fully initialized for executeTradeIn.");
                GameLogger.addLogMessage("Error: Game state not ready for trade-in.");
                return;
            }
            if (!GameData || !Array.isArray(GameData.tradableCards)) {
                console.error("Trading Error: GameData.tradableCards is not an array or missing.");
                GameLogger.addLogMessage("Error: Card data not available for trade-in.");
                return;
            }

            const commonItem = GameState.current.inventory.find(item => item.cardId === 'common_single');
            // Check if player has enough common singles.
            if (!commonItem || commonItem.quantity < 25) {
                GameLogger.addLogMessage(`Need 25 Common Singles to trade. You have ${commonItem?.quantity || 0}.`);
                return;
            }

            // Calculate and adjust cost of common singles being traded.
            const baseCostOfCommon = GameConfig?.cardBasePrices?.common_single ?? 5; // Default if not in config.
            const costToSubtract = 25 * baseCostOfCommon;
            commonItem.totalCost = Math.max(0, (commonItem.totalCost || 0) - costToSubtract);
            commonItem.quantity -= 25; // Deduct common singles.

            // Remove common singles item if quantity is zero.
            if (commonItem.quantity <= 0) {
                GameState.current.inventory = GameState.current.inventory.filter(item => item.cardId !== 'common_single');
            }

            // Determine eligible reward cards.
            const eligibleCards = GameData.tradableCards.filter(c => c.id !== 'common_single' && (c.basePrice ?? 0) >= 50);
            if (eligibleCards.length === 0) {
                console.warn("Trading Warning: No eligible cards found for trade-in reward.");
                GameLogger.addLogMessage("No eligible cards available for trade-in at the moment. Try again later.");
                // Refund the commons if no reward can be given.
                let refundItem = GameState.current.inventory.find(item => item.cardId === 'common_single');
                if(refundItem) {
                    refundItem.quantity += 25;
                    refundItem.totalCost += costToSubtract; // Simplified refund cost.
                } else {
                     // If common_single item was removed, add it back.
                     GameState.current.inventory.push({ cardId: 'common_single', quantity: 25, totalCost: costToSubtract });
                }
                return;
            }
            const receivedCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)]; // Select random reward.

            // Validate the selected reward card.
            if (!receivedCard || !receivedCard.id || !receivedCard.name) {
                console.error("Trading Error: Invalid card selected as trade-in reward.", receivedCard);
                GameLogger.addLogMessage("Error processing trade-in reward. Please try again.");
                 // Refund commons as a safety measure.
                let refundItem = GameState.current.inventory.find(item => item.cardId === 'common_single');
                if(refundItem) {
                    refundItem.quantity += 25;
                    refundItem.totalCost += costToSubtract;
                } else {
                     GameState.current.inventory.push({ cardId: 'common_single', quantity: 25, totalCost: costToSubtract });
                }
                return;
            }

            // Add reward card to inventory.
            let inventoryItem = GameState.current.inventory.find(item => item.cardId === receivedCard.id);
            if (inventoryItem) {
                inventoryItem.quantity++;
                // totalCost for found/rewarded items usually isn't increased, or uses basePrice.
                // For simplicity, let's assume it doesn't add to totalCost here, similar to found cards.
            } else {
                GameState.current.inventory.push({ cardId: receivedCard.id, quantity: 1, totalCost: 0 });
            }

            GameLogger.addLogMessage(`Traded 25 Common Singles for a ${receivedCard.name}!`);
            UIRenderer.renderAll(); // Refresh UI.
        } catch (error) {
            console.error("Error in executeTradeIn:", error);
            GameLogger.addLogMessage("An unexpected error occurred during the trade-in.");
        }
    }
};
