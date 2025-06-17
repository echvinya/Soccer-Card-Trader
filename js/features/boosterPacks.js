import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';
import { Cabinet } from './cabinet.js';

/**
 * BoosterPacks Module
 * Handles the functionality related to buying and opening booster packs.
 * This includes checking purchase eligibility, determining pack contents based on location,
 * and revealing the pulled cards to the player sequentially.
 */
export const BoosterPacks = {
    /**
     * Handles the purchase of a booster pack.
     * @param {number} [locationPrice=GameConfig.boosterPack.basePrice] - The price of the pack at the current location.
     * Logic:
     * 1. Validates if the player can buy a pack (enough cash, under daily limit, pack available at location).
     * 2. Deducts cash, increments `boosterPacksPurchasedToday`.
     * 3. Determines pack size (randomly 3-5 cards).
     * 4. Pulls cards based on location specialization:
     *    - 'rookies': Higher chance for rookie cards.
     *    - 'mystery': Guarantees one rare card, others random.
     *    - Default: Uses weighted loot tables, favoring common singles for some initial slots.
     * 5. Calls `revealCardsSequentially` to display the pulled cards.
     */
    buyBoosterPack(locationPrice = GameConfig.boosterPack.basePrice) {
        // Validate purchase conditions
        if (GameState.current.cash < locationPrice) {
            GameLogger.addLogMessage(`Not enough cash. Need $${locationPrice}.`);
            return;
        }
        if (GameState.current.boosterPacksPurchasedToday >= GameConfig.boosterPack.dailyLimit) {
            GameLogger.addLogMessage(`Daily pack limit reached.`);
            return;
        }
        // Check if the current location's market has booster packs available.
        if (!GameState.market[GameState.current.currentLocationId]?.boosterAvailable) {
            GameLogger.addLogMessage(`Boosters sold out today.`);
            return;
        }
        // Prevent opening multiple pack modals if one is already active.
        if (!UIElements.boosterPackModal.classList.contains('hidden')) {
            return;
        }
        
        GameState.current.cash -= locationPrice;
        GameState.current.boosterPacksPurchasedToday++;
        
        UIRenderer.renderAll(); // Update UI to reflect cash and purchase count change.

        const location = GameState.getCurrentLocation();
        const packSize = Math.floor(Math.random() * 3) + 3; // Pack size: 3, 4, or 5 cards.
        const pulledCards = []; // Array to store the cards pulled from the pack.
        
        // --- Card Pulling Logic based on Location Specialization ---
        if (location && location.specialization === 'rookies') {
            // 'Rookies' location: Increased chance of pulling rookie cards.
            const rookieCards = GameData.tradableCards.filter(c => c.id.includes('rookie'));
            const otherCards = GameData.tradableCards.filter(c => !c.id.includes('rookie'));
            
            // First card: 50% chance for a rookie if available.
            if (Math.random() < 0.5 && rookieCards.length > 0) {
                pulledCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
            } else if (otherCards.length > 0) {
                pulledCards.push(otherCards[Math.floor(Math.random() * otherCards.length)]);
            } else if (rookieCards.length > 0) { // Fallback if otherCards is empty
                pulledCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
            }
            
            // Subsequent cards: 30% chance for a rookie if available.
            for (let i = 1; i < packSize; i++) {
                if (Math.random() < 0.3 && rookieCards.length > 0) {
                    pulledCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
                } else {
                    // Fallback to any tradable card if rookie not pulled or not available.
                    pulledCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
                }
            }
        } else if (location && location.specialization === 'mystery') {
            // 'Mystery' location: Guarantees one rare card.
            const rareCards = GameData.tradableCards.filter(c => c.basePrice > (GameConfig.rareCardThreshold ?? 100));
            const otherCards = GameData.tradableCards.filter(c => c.basePrice <= (GameConfig.rareCardThreshold ?? 100));
            
            // First card is guaranteed to be rare (if any exist).
            if (rareCards.length > 0) {
                pulledCards.push(rareCards[Math.floor(Math.random() * rareCards.length)]);
            } else if (otherCards.length > 0) { // Fallback if no rare cards
                 pulledCards.push(otherCards[Math.floor(Math.random() * otherCards.length)]);
            } else { // Fallback if no rare or other cards (highly unlikely)
                 pulledCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
            }
            
            // Other cards are completely random.
            for (let i = 1; i < packSize; i++) {
                pulledCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
            }
        } else {
            // Default pack logic: uses weighted loot tables.
            // Favors common_single for the first few slots.
            const lowValueCards = GameData.tradableCards.filter(c => c.basePrice <= 250);
            const lowValueLootTable = []; // Weighted towards common_single.
            lowValueCards.forEach(card => {
                const weight = (card.id === 'common_single') ? 6 : 1;
                for (let i = 0; i < weight; i++) lowValueLootTable.push(card);
            });

            const fullLootTable = []; // Also weighted, but less aggressively for common_single.
            GameData.tradableCards.forEach(card => {
                let weight = 1;
                if (card.id === 'common_single') weight = 4;
                for (let i = 0; i < weight; i++) fullLootTable.push(card);
            });

            // Fill pack: first few slots from lowValueLootTable, rest from fullLootTable.
            for (let i = 0; i < Math.min(3, packSize); i++) {
                if (lowValueLootTable.length > 0) {
                    pulledCards.push(lowValueLootTable[Math.floor(Math.random() * lowValueLootTable.length)]);
                } else if (fullLootTable.length > 0) { // Fallback if low value table is empty
                    pulledCards.push(fullLootTable[Math.floor(Math.random() * fullLootTable.length)]);
                }
            }
            if (packSize > 3) {
                for (let i = 3; i < packSize; i++) {
                     if (fullLootTable.length > 0) {
                        pulledCards.push(fullLootTable[Math.floor(Math.random() * fullLootTable.length)]);
                    }
                }
            }
        }
        
        // Ensure the pack is filled if any loot table was empty or logic didn't fill it completely.
        while(pulledCards.length < packSize && GameData.tradableCards.length > 0) {
            pulledCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
        }

        this.revealCardsSequentially(pulledCards);
    },

    /**
     * Reveals cards from a booster pack one by one with a slight delay.
     * Adds each card to the player's inventory and updates the UI.
     * @param {Array<Object>} cards - An array of card objects pulled from the pack.
     */
    revealCardsSequentially(cards) {
        if (!UIElements.packSummaryArea || !UIElements.closePackModalBtn || !UIElements.boosterPackModal) {
            console.error("Booster pack modal UI elements not found for revealing cards.");
            // Attempt to add cards to inventory directly if UI fails, to ensure game state is correct.
            cards.forEach(card => {
                 if (card && card.id) { // Basic card validation
                     let inventoryItem = GameState.current.inventory.find(item => item.cardId === card.id);
                     if (inventoryItem) inventoryItem.quantity++;
                     else GameState.current.inventory.push({ cardId: card.id, quantity: 1, totalCost: 0 });
                 }
            });
            UIRenderer.renderAll(); // Refresh UI even if modal part fails.
            return;
        }

        UIElements.packSummaryArea.innerHTML = ''; // Clear previous pack contents.
        UIElements.closePackModalBtn.style.display = 'none'; // Hide close button during reveal.
        UIElements.boosterPackModal.classList.remove('hidden'); // Show the modal.
        let revealIndex = 0;

        function revealNext() {
            if (revealIndex < cards.length) {
                const card = cards[revealIndex];
                if (!card || !card.id) { // Safety check for invalid card object
                    console.warn("Invalid card data in pack, skipping:", card);
                    revealIndex++;
                    setTimeout(revealNext, 100); // Shorter delay for skipped card
                    return;
                }
                
                // Generate potential special numbering (e.g., serial numbers, parallels).
                const numbering = CardVisuals.generateCardNumbering(card);
                
                // Add card to player's inventory.
                let inventoryItem = GameState.current.inventory.find(item => item.cardId === card.id);
                if (inventoryItem) {
                    inventoryItem.quantity++;
                } else {
                    GameState.current.inventory.push({ cardId: card.id, quantity: 1, totalCost: 0 }); // cost is 0 for pulled cards
                }

                // Create UI elements for the card display.
                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'flex flex-col items-center opacity-0 animate-fade-in w-32'; // Animation class
                
                const cabinetButton = document.createElement('button');
                cabinetButton.className = 'btn btn-secondary btn-sm text-xs mt-2 w-full';
                cabinetButton.textContent = 'To Cabinet';
                // Store card data on the button for when it's added to cabinet.
                cabinetButton.onclick = () => Cabinet.addToDisplayCabinet(card.id, cabinetButton);
                
                // Prepare data for card visual generation.
                const graphicCardTypes = ['favorite_player', 'numbered_legend', 'prized_rookie_card', 'holo_legend', 'numbered_rookie_auto', 'autographed_common', 'common_single', 'autographed_jersey'];
                const tempCabinetItem = { card: card, layers: null, numbering: numbering };

                if (graphicCardTypes.includes(card.id)) {
                    tempCabinetItem.layers = CardVisuals.generateLayerIndices(); // For cards with multiple visual layers.
                    cabinetButton.dataset.layers = JSON.stringify(tempCabinetItem.layers);
                }
                
                if (numbering) {
                    cabinetButton.dataset.numbering = JSON.stringify(numbering); // Store numbering for cabinet.
                }
                
                const cardVisual = CardVisuals.createCardVisual(tempCabinetItem); // Generate the card's visual representation.
                wrapperDiv.appendChild(cardVisual);

                const cardName = document.createElement('div');
                cardName.className = 'text-xs text-gray-300 mt-1 mb-1 text-center font-medium';
                cardName.textContent = card.name || "Unknown Card";
                wrapperDiv.appendChild(cardName);
                
                // Display current market price or base price, potentially adjusted by numbering.
                const currentPrice = GameState.market[GameState.current.currentLocationId]?.[card.id]?.price || card.basePrice || 0;
                const priceDisplay = document.createElement('div');
                priceDisplay.className = 'text-xs text-green-400 font-semibold mb-1';
                
                if (numbering && numbering.multiplier) { // If card has special numbering affecting its value.
                    const adjustedPrice = Math.round(currentPrice * numbering.multiplier);
                    priceDisplay.innerHTML = `$${currentPrice} → <span class="text-yellow-400">$${adjustedPrice}</span>`;
                    
                    const serialInfo = document.createElement('div');
                    serialInfo.className = 'text-xs text-amber-400 font-bold';
                    serialInfo.textContent = `Serial: ${numbering.display}`;
                    if (numbering.multiplier > 5) { // Highlight very rare cards.
                        serialInfo.className += ' animate-pulse';
                    }
                    wrapperDiv.appendChild(serialInfo);
                } else {
                    priceDisplay.textContent = `$${currentPrice}`;
                }
                wrapperDiv.appendChild(priceDisplay);
                
                wrapperDiv.appendChild(cabinetButton);
                UIElements.packSummaryArea.appendChild(wrapperDiv); // Add card to the modal display.

                revealIndex++;
                setTimeout(revealNext, 500); // Reveal next card after a delay.
            } else {
                // All cards revealed.
                UIElements.closePackModalBtn.style.display = 'inline-block'; // Show close button.
                // Log the pack contents.
                const summaryLog = cards.map(c => `<li class="ml-4 list-disc pack-item">${c?.name || 'Unknown Card'}</li>`).join('');
                GameLogger.addLogMessage(`Opened a pack: <ul>${summaryLog}</ul>`);
                UIRenderer.renderAll(); // Full UI refresh to update inventory, stats, etc.
            }
        }
        revealNext(); // Start the reveal sequence.
    }
};
