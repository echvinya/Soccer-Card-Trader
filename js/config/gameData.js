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
        { 
            id: 'tree_city_cards', 
            name: 'Tree City Cards', 
            description: 'A local favorite for all types of trading cards. Best source for rookie cards.', 
            priceBias: 1.0, 
            availabilityBias: 1.0,
            specialization: 'rookies',
            boosterPrice: 300
        },
        { 
            id: 'cards_r_us', 
            name: 'Cards\'R\'us', 
            description: 'Large inventory, volume dealer. Buy 5+ of any card for 10% discount.', 
            priceBias: 1.05, 
            availabilityBias: 1.1,
            specialization: 'volume',
            boosterPrice: GameConfig.boosterPack.basePrice
        },
        { 
            id: 'all_cards', 
            name: 'All Cards', 
            description: 'Massive inventory (5-50 of each card) but 2 days from everywhere.', 
            priceBias: 0.9, 
            availabilityBias: 1.15,
            specialization: 'bulk',
            boosterPrice: GameConfig.boosterPack.basePrice
        },
        { 
            id: 'klpa_emporium', 
            name: 'KLPA Emporium', 
            description: 'A massive emporium with mystery packs containing guaranteed rares.', 
            priceBias: 1.1, 
            availabilityBias: 1.05,
            specialization: 'mystery',
            boosterPrice: 400
        },
        { 
            id: 'mom_and_pops', 
            name: 'Mom and Pop\'s', 
            description: 'A cozy shop with trade-in service: 25 commons for 1 random better card.', 
            priceBias: 0.95, 
            availabilityBias: 0.95,
            specialization: 'trade_in',
            boosterPrice: GameConfig.boosterPack.basePrice
        },
    ],
    
    travelDurations: {
        'toots_and_rips':  { 'tree_city_cards': 1, 'cards_r_us': 2, 'all_cards': 2, 'klpa_emporium': 2, 'mom_and_pops': 1 },
        'tree_city_cards': { 'toots_and_rips': 1, 'cards_r_us': 1, 'all_cards': 2, 'klpa_emporium': 2, 'mom_and_pops': 1 },
        'cards_r_us':      { 'toots_and_rips': 2, 'tree_city_cards': 1, 'all_cards': 2, 'klpa_emporium': 3, 'mom_and_pops': 2 },
        'all_cards':       { 'toots_and_rips': 2, 'tree_city_cards': 2, 'cards_r_us': 2, 'klpa_emporium': 2, 'mom_and_pops': 2 },
        'klpa_emporium':   { 'toots_and_rips': 2, 'tree_city_cards': 2, 'cards_r_us': 3, 'all_cards': 2, 'mom_and_pops': 1 },
        'mom_and_pops':    { 'toots_and_rips': 1, 'tree_city_cards': 1, 'cards_r_us': 2, 'all_cards': 2, 'klpa_emporium': 1 }
    },

    cards: [
        { id: 'autographed_jersey', name: 'Autographed Jersey Card', basePrice: 650, description: 'Features a piece of player-worn jersey and a signature.' },
        { id: 'numbered_rookie_auto', name: 'Numbered Rookie Auto', basePrice: 500, description: 'A rookie card with a signature, serial numbered to 99.' },
        { id: 'holo_legend', name: 'Holo Legend Card', basePrice: 220, description: 'A holographic card of an iconic player from the past.' },
        { id: 'numbered_legend', name: 'Numbered Legend', basePrice: 420, description: 'A card of a legendary player numbered to 25.' },
        { id: 'game_worn_relic', name: 'Game-Worn Relic', basePrice: 180, description: 'Contains a piece of a game-used, jesery, ball, net or cleat.' },
        { id: 'prized_rookie_card', name: 'Prized Rookie Card', basePrice: 120, description: 'A highly sought-after rookie card of a top prospect.' },
        { id: 'favorite_player', name: 'Favorite Player Card', basePrice: 75, description: 'A standard card of a fan-favorite player.' },
        { id: 'autographed_common', name: 'Autographed Common Card', basePrice: 95, description: 'A common card, now with a valuable signature.' },
        { id: 'common_single', name: 'Common Single', basePrice: 5, description: 'A single common card.' },
        { id: 'booster_pack', name: 'Booster Pack', basePrice: GameConfig.boosterPack.basePrice, special: true },
    ],

    get tradableCards() {
        return this.cards.filter(card => !card.special);
    }
};
