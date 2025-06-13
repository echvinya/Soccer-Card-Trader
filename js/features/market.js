import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameState } from '../core/gameState.js';

export const Market = {
    generateMarketDataForCard(card, location) {
        const priceFluctuation = Math.random() * (GameConfig.priceMultiplier.max - GameConfig.priceMultiplier.min) + GameConfig.priceMultiplier.min;
        const finalPrice = Math.round(card.basePrice * priceFluctuation * location.priceBias);
        
        let availabilityFluctuation = Math.random();
        let baseAvailability = Math.floor(Math.pow(availabilityFluctuation, 2) * (GameConfig.availability.max - GameConfig.availability.min + 1)) + GameConfig.availability.min;
        
        // Apply location specializations
        if (location.specialization === 'high_end') {
            if (card.id === 'autographed_jersey' || card.id === 'numbered_rookie_auto' || card.id === 'numbered_legend') {
                baseAvailability = Math.max(5, Math.floor(baseAvailability * 2));
            } else if (card.basePrice < 50) {
                baseAvailability = Math.floor(baseAvailability * 0.5);
            }
        } else if (location.specialization === 'rookies') {
            if (card.id === 'prized_rookie_card' || card.id === 'numbered_rookie_auto') {
                baseAvailability = Math.max(5, Math.floor(baseAvailability * 2.5));
            }
        } else if (location.specialization === 'bulk') {
            baseAvailability = Math.floor(Math.random() * 46) + 5; // 5-50
        }
        
        const finalAvailability = Math.max(1, Math.round(baseAvailability * location.availabilityBias));
        return { price: Math.max(1, finalPrice), available: finalAvailability };
    },

    generateAllMarketPrices() {
        GameData.locations.forEach(location => {
            GameState.market[location.id] = {};
            GameState.market[location.id].boosterAvailable = (Math.random() < GameConfig.boosterPack.chancePerDay);
            GameData.tradableCards.forEach(card => {
                GameState.market[location.id][card.id] = this.generateMarketDataForCard(card, location);
            });
        });
    },

    updateMarketForCurrentLocation() {
        const location = GameState.getCurrentLocation();
        const locationMarket = GameState.market[location.id] || {};
        locationMarket.boosterAvailable = (Math.random() < GameConfig.boosterPack.chancePerDay);
        GameData.tradableCards.forEach(card => {
            if (!locationMarket[card.id] || !locationMarket[card.id].eventModified) {
                locationMarket[card.id] = this.generateMarketDataForCard(card, location);
            }
        });
        GameState.market[location.id] = locationMarket;
    }
};
