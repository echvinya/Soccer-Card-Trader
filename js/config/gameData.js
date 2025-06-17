import { GameConfig } from './gameConfig.js';

/**
 * GameData
 * Provides the core data definitions for the game, including locations,
 * travel times between them, and details for all cards. This acts as the
 * game's static database.
 */
export const GameData = {
    /**
     * @property {Array<Object>} locations - Defines all visitable locations in the game.
     *      Each location object has:
     *      - id: {string} Unique identifier for the location.
     *      - name: {string} Display name of the location.
     *      - description: {string} Flavor text describing the location.
     *      - priceBias: {number} Multiplier affecting card prices at this location (e.g., 1.15 means 15% higher prices).
     *      - availabilityBias: {number} Multiplier affecting card availability (e.g., 0.85 means 15% lower availability).
     *      - specialization: {string} Defines special market behavior or actions (e.g., 'high_end', 'rookies', 'trade_in').
     *      - boosterPrice: {number} The price of a booster pack at this specific location.
     */
    locations: [
        { 
            id: 'toots_and_rips', 
            name: 'Toots and Rips', 
            description: 'High-end collectibles and rare finds. Specializes in autographed and jersey cards.', 
            priceBias: 1.15, 
            availabilityBias: 0.85,
            specialization: 'high_end', // Affects availability of certain card types
            boosterPrice: GameConfig.boosterPack.basePrice // Uses default booster price
        },
        { 
            id: 'tree_city_cards', 
            name: 'Tree City Cards', 
            description: 'A local favorite for all types of trading cards. Best source for rookie cards.', 
            priceBias: 1.0, 
            availabilityBias: 1.0,
            specialization: 'rookies',   // Affects availability and booster pack contents
            boosterPrice: 300            // Custom booster price
        },
        { 
            id: 'cards_r_us', 
            name: 'Cards\'R\'us', 
            description: 'Large inventory, volume dealer. Buy 5+ of any card for 10% discount.', 
            priceBias: 1.05, 
            availabilityBias: 1.1,
            specialization: 'volume',    // Enables volume discounts on purchases
            boosterPrice: GameConfig.boosterPack.basePrice
        },
        { 
            id: 'all_cards', 
            name: 'All Cards', 
            description: 'Massive inventory (5-50 of each card) but 2 days from everywhere.', 
            priceBias: 0.9,             // Cheaper prices generally
            availabilityBias: 1.15,     // Higher availability generally
            specialization: 'bulk',      // Affects base availability calculation
            boosterPrice: GameConfig.boosterPack.basePrice
        },
        { 
            id: 'klpa_emporium', 
            name: 'KLPA Emporium', 
            description: 'A massive emporium with mystery packs containing guaranteed rares.', 
            priceBias: 1.1, 
            availabilityBias: 1.05,
            specialization: 'mystery',   // Affects booster pack contents
            boosterPrice: 400            // Custom booster price for mystery packs
        },
        { 
            id: 'mom_and_pops', 
            name: 'Mom and Pop\'s', 
            description: 'A cozy shop with trade-in service: 25 commons for 1 random better card.', 
            priceBias: 0.95, 
            availabilityBias: 0.95,
            specialization: 'trade_in', // Enables the trade-in action
            boosterPrice: GameConfig.boosterPack.basePrice
        },
    ],
    
    /**
     * @property {Object} travelDurations - Defines the number of days it takes to travel between locations.
     * Structure: `travelDurations[fromLocationId][toLocationId] = days`.
     * Example: `travelDurations['toots_and_rips']['tree_city_cards']` would give the days to travel between them.
     */
    travelDurations: {
        'toots_and_rips':  { 'tree_city_cards': 1, 'cards_r_us': 2, 'all_cards': 2, 'klpa_emporium': 2, 'mom_and_pops': 1 },
        'tree_city_cards': { 'toots_and_rips': 1, 'cards_r_us': 1, 'all_cards': 2, 'klpa_emporium': 2, 'mom_and_pops': 1 },
        'cards_r_us':      { 'toots_and_rips': 2, 'tree_city_cards': 1, 'all_cards': 2, 'klpa_emporium': 3, 'mom_and_pops': 2 },
        'all_cards':       { 'toots_and_rips': 2, 'tree_city_cards': 2, 'cards_r_us': 2, 'klpa_emporium': 2, 'mom_and_pops': 2 },
        'klpa_emporium':   { 'toots_and_rips': 2, 'tree_city_cards': 2, 'cards_r_us': 3, 'all_cards': 2, 'mom_and_pops': 1 },
        'mom_and_pops':    { 'toots_and_rips': 1, 'tree_city_cards': 1, 'cards_r_us': 2, 'all_cards': 2, 'klpa_emporium': 1 }
    },

    /**
     * @property {Array<Object>} cards - Defines all types of cards available in the game.
     *      Each card object has:
     *      - id: {string} Unique identifier for the card.
     *      - name: {string} Display name of the card.
     *      - basePrice: {number} The fundamental price of the card before market adjustments.
     *      - description: {string} Flavor text or details about the card.
     *      - special: {boolean} (Optional) If true, this item might not be a standard tradable card (e.g., Booster Pack itself).
     */
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
        // The "Booster Pack" is defined as a card here mainly for consistency if it were ever to be an item,
        // but its purchasing is handled by specific UI and logic in `BoosterPacks.js` and `UIRenderer.js`.
        // It's marked `special` to be filtered out from normal market listings by `tradableCards`.
        { id: 'booster_pack', name: 'Booster Pack', basePrice: GameConfig.boosterPack.basePrice, special: true },
    ],

    /**
     * @getter tradableCards
     * @returns {Array<Object>} A filtered list of cards that are considered "tradable" in the market.
     * Excludes items marked with `special: true` (like the Booster Pack definition itself).
     */
    get tradableCards() {
        return this.cards.filter(card => !card.special);
    }
};
