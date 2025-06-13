import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';

export const GameState = {
    current: {},
    market: {},
    leaderboardScores: [],

    initialize() {
        this.current = {
            cash: GameConfig.initialCash,
            daysRemaining: GameConfig.initialDays,
            currentLocationId: GameData.locations[0].id,
            inventory: [],
            log: [],
            hasPriceGuide: false,
            boosterPacksPurchasedToday: 0,
            showHelpText: true,
            displayCabinet: [],
            activeEvents: [],
            pendingEvent: null,
            storeDiscount: 0,
            tempFoundCard: null
        };
        this.market = {};
    },

    getCurrentLocation() {
        return GameData.locations.find(loc => loc.id === this.current.currentLocationId);
    },

    getCardDetails(cardId) {
        return GameData.cards.find(card => card.id === cardId);
    }
};
