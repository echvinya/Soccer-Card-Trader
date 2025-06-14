import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';

export const Trading = {
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

    buyItemQty(cardId) {
        const quantity = parseInt(document.getElementById(`buy-qty-${cardId}`).value);
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
        UIRenderer.renderAll();
    },

    buyAllItems(cardId) {
        const marketInfo = GameState.market[GameState.current.currentLocationId]?.[cardId];
        if (!marketInfo || marketInfo.available <= 0) {
            GameLogger.addLogMessage(`None available to buy.`);
            return;
        }
        document.getElementById(`buy-qty-${cardId}`).value = marketInfo.available;
        this.buyItemQty(cardId);
    },

    sellItemQty(cardId) {
        const quantity = parseInt(document.getElementById(`sell-qty-${cardId}`).value);
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
        UIRenderer.renderAll();
    },

    sellAllItems(cardId) {
        const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);
        if (!inventoryItem || inventoryItem.quantity <= 0) {
            GameLogger.addLogMessage(`None to sell.`);
            return;
        }
        document.getElementById(`sell-qty-${cardId}`).value = inventoryItem.quantity;
        this.sellItemQty(cardId);
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
