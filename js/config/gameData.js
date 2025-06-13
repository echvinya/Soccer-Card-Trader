import { GameConfig } from './gameConfig.js';

export const GameData = {
    locations: [
        { 
            id: 'toots_and_rips', 
            name: 'Toots and Rips', 
            description: 'High-end collectibles and rare finds. Specializes in autographed and jersey cards.', 
            priceBias: 1.15, 
            availabilityBias: 0.85,
            specialization: 'high_end',
            boosterPrice: GameConfig.boosterPack.basePrice
        },
        // ... rest of locations
    ],
    
    travelDurations: {
        'toots_and_rips': { 'tree_city_cards': 1, 'cards_r_us': 2, 'all_cards': 2, 'klpa_emporium': 2, 'mom_and_pops': 1 },
        // ... rest of travel durations
    },

    cards: [
        { id: 'autographed_jersey', name: 'Autographed Jersey Card', basePrice: 650, description: 'Features a piece of player-worn jersey and a signature.' },
        // ... rest of cards
    ],

    get tradableCards() {
        return this.cards.filter(card => !card.special);
    }
};
