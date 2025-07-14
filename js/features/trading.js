import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { UIElements } from '../ui/uiElements.js';

export const Trading = {
    openBuyModal(cardId) {
        const card = GameState.getCardDetails(cardId);
        const marketInfo = GameState.market[GameState.current.currentLocationId]?.[cardId];
        if (!marketInfo) return;

        UIElements.buyModalTitle.textContent = `Buy ${card.name}`;
        UIElements.buyModalCardName.textContent = card.name;
        UIElements.buyModalCardPrice.textContent = `Price: $${marketInfo.price.toLocaleString()}`;
        UIElements.buyQuantity.max = marketInfo.available;
        UIElements.buyQuantity.value = 1;

        const updateTotal = () => {
            const quantity = parseInt(UIElements.buyQuantity.value);
            const totalCost = marketInfo.price * quantity;
            UIElements.buyModalTotalPrice.textContent = `Total: $${totalCost.toLocaleString()}`;
        };

        UIElements.buyModalCash.textContent = `Cash: $${GameState.current.cash.toLocaleString()}`;
        updateTotal();

        UIElements.buyQuantity.oninput = updateTotal;
        UIElements.buyPlusBtn.onclick = () => {
            UIElements.buyQuantity.value = parseInt(UIElements.buyQuantity.value) + 1;
            updateTotal();
        };
        UIElements.buyMinusBtn.onclick = () => {
            UIElements.buyQuantity.value = Math.max(1, parseInt(UIElements.buyQuantity.value) - 1);
            updateTotal();
        };

        UIElements.buyConfirmBtn.onclick = () => this.buyItem(cardId);
        UIElements.buyCancelBtn.onclick = () => UIElements.buyModal.classList.add('hidden');
        UIElements.buyAllBtn.onclick = () => {
            UIElements.buyQuantity.value = marketInfo.available;
            updateTotal();
        };

        UIElements.buyModal.classList.remove('hidden');
    },

    openSellModal(cardId) {
        const card = GameState.getCardDetails(cardId);
        const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);
        if (!inventoryItem) return;

        const marketInfo = GameState.market[GameState.current.currentLocationId]?.[cardId];
        const avgBuyPrice = inventoryItem.totalCost / inventoryItem.quantity;
        const currentSellPrice = marketInfo ? marketInfo.price : 0;

        UIElements.sellModalTitle.textContent = `Sell ${card.name}`;
        UIElements.sellModalCardName.textContent = card.name;
        UIElements.sellModalAvgBuyPrice.textContent = `Avg. Buy Price: $${avgBuyPrice.toFixed(2)}`;
        UIElements.sellModalCurrentSellPrice.textContent = `Current Sell Price: $${currentSellPrice.toLocaleString()}`;
        UIElements.sellQuantity.max = inventoryItem.quantity;
        UIElements.sellQuantity.value = 1;

        const updateTotal = () => {
            const quantity = parseInt(UIElements.sellQuantity.value);
            const totalSale = currentSellPrice * quantity;
            UIElements.sellModalTotalPrice.textContent = `Total: $${totalSale.toLocaleString()}`;
        };

        UIElements.sellModalCash.textContent = `Cash: $${GameState.current.cash.toLocaleString()}`;
        updateTotal();

        UIElements.sellQuantity.oninput = updateTotal;
        UIElements.sellPlusBtn.onclick = () => {
            UIElements.sellQuantity.value = parseInt(UIElements.sellQuantity.value) + 1;
            updateTotal();
        };
        UIElements.sellMinusBtn.onclick = () => {
            UIElements.sellQuantity.value = Math.max(1, parseInt(UIElements.sellQuantity.value) - 1);
            updateTotal();
        };

        UIElements.sellConfirmBtn.onclick = () => this.sellItem(cardId);
        UIElements.sellCancelBtn.onclick = () => UIElements.sellModal.classList.add('hidden');
        UIElements.sellAllBtn.onclick = () => {
            UIElements.sellQuantity.value = inventoryItem.quantity;
            updateTotal();
        };

        UIElements.sellModal.classList.remove('hidden');
    },

    buyPriceGuide() {
        if (GameState.current.cash < GameConfig.priceGuideCost) {
            GameLogger.addLogMessage(`Not enough cash.`);
            return;
        }
        GameState.current.cash -= GameConfig.priceGuideCost;
        GameState.current.hasPriceGuide = true;
        GameLogger.addLogMessage(`Purchased Price Guide!`);
        UIRenderer.renderAll();
    },

    buyItem(cardId) {
        const quantity = parseInt(UIElements.buyQuantity.value);
        if (isNaN(quantity) || quantity <= 0) {
            GameLogger.addLogMessage(`Invalid quantity.`);
            return;
        }
        
        const card = GameState.getCardDetails(cardId);
        const marketInfo = GameState.market[GameState.current.currentLocationId]?.[cardId];
        if (!marketInfo || quantity > marketInfo.available) {
            GameLogger.addLogMessage(`Not enough available to buy.`);
            return;
        }

        let totalCost = marketInfo.price * quantity;
        
        const location = GameState.getCurrentLocation();
        if (location.specialization === 'volume' && quantity >= 5) {
            const volumeDiscount = Math.round(totalCost * 0.1);
            totalCost -= volumeDiscount;
            GameLogger.addLogMessage(`Volume discount applied: -$${volumeDiscount} (10% off for 5+ cards)`);
        }
        
        if (GameState.current.storeDiscount > 0) {
            const discountAmount = Math.round(totalCost * (GameState.current.storeDiscount / 100));
            totalCost -= discountAmount;
            GameLogger.addLogMessage(`Store discount applied: -$${discountAmount}`);
        }
        
        if (totalCost > GameState.current.cash) {
            GameLogger.addLogMessage(`Not enough cash. Need $${totalCost.toLocaleString()}.`);
            return;
        }
        
        GameState.current.cash -= totalCost;
        marketInfo.available -= quantity;
        let inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);
        if (inventoryItem) {
            inventoryItem.quantity += quantity;
            inventoryItem.totalCost += totalCost;
        } else {
            GameState.current.inventory.push({ cardId, quantity, totalCost });
        }
        GameLogger.addLogMessage(`Bought ${quantity} ${card.name} for $${totalCost.toLocaleString()}.`);
        UIElements.buyModal.classList.add('hidden');
        UIRenderer.renderAll();
    },

    sellItem(cardId) {
        const quantity = parseInt(UIElements.sellQuantity.value);
        const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);

        if (isNaN(quantity) || quantity <= 0) {
            GameLogger.addLogMessage(`Invalid quantity.`);
            return;
        }
        if (!inventoryItem || quantity > inventoryItem.quantity) {
            GameLogger.addLogMessage(`You don't have that many to sell.`);
            return;
        }

        const card = GameState.getCardDetails(cardId);
        const currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[cardId]?.price;
        if (currentMarketPrice === undefined) {
            GameLogger.addLogMessage(`Cannot determine sell price.`);
            return;
        }

        const totalSaleValue = currentMarketPrice * quantity;
        const costOfSoldItems = (inventoryItem.totalCost / inventoryItem.quantity) * quantity;
        
        GameState.current.cash += totalSaleValue;
        inventoryItem.quantity -= quantity;
        inventoryItem.totalCost -= isNaN(costOfSoldItems) ? 0 : costOfSoldItems;

        if (inventoryItem.quantity <= 0) {
            GameState.current.inventory = GameState.current.inventory.filter(item => item.cardId !== cardId);
        }
        GameLogger.addLogMessage(`Sold ${quantity} ${card.name} for $${totalSaleValue.toLocaleString()}.`);
        UIElements.sellModal.classList.add('hidden');
        UIRenderer.renderAll();
    },

    executeTradeIn() {
        const commonItem = GameState.current.inventory.find(item => item.cardId === 'common_single');
        if (!commonItem || commonItem.quantity < 25) {
            GameLogger.addLogMessage(`Need 25 Common Singles to trade. You have ${commonItem?.quantity || 0}.`);
            return;
        }
        
        commonItem.quantity -= 25;
        commonItem.totalCost = Math.max(0, commonItem.totalCost - (25 * 5));
        if (commonItem.quantity <= 0) {
            GameState.current.inventory = GameState.current.inventory.filter(item => item.cardId !== 'common_single');
        }
        
        const eligibleCards = GameData.tradableCards.filter(c => c.id !== 'common_single' && c.basePrice >= 50);
        const receivedCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
        
        let inventoryItem = GameState.current.inventory.find(item => item.cardId === receivedCard.id);
        if (inventoryItem) {
            inventoryItem.quantity++;
        } else {
            GameState.current.inventory.push({ cardId: receivedCard.id, quantity: 1, totalCost: 0 });
        }
        
        GameLogger.addLogMessage(`Traded 25 Common Singles for a ${receivedCard.name}!`);
        UIRenderer.renderAll();
    }
};
