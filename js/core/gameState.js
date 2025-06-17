import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';

/**
 * GameState
 * Manages the overall state of the game. This includes player status (cash, inventory, current location),
 * market conditions, game progression (days remaining), active events, and more.
 * It provides methods to initialize and access parts of this state.
 */
export const GameState = {
    /**
     * @property {Object} current - Holds the dynamic state of the player and the game world.
     *      @property {number} cash - Player's current cash amount.
     *      @property {number} daysRemaining - Days left in the game.
     *      @property {string|null} currentLocationId - ID of the player's current location. Null if not set.
     *      @property {Array<Object>} inventory - Player's card inventory. Each object typically has cardId, quantity, totalCost.
     *      @property {Array<string>} log - Messages for the game log displayed to the player.
     *      @property {boolean} hasPriceGuide - Whether the player has purchased the price guide.
     *      @property {number} boosterPacksPurchasedToday - Count of booster packs bought on the current day.
     *      @property {boolean} showHelpText - Player's preference for showing help text.
     *      @property {Array<Object>} displayCabinet - Cards selected by the player for their display cabinet. Each object usually has cardId, capturedValue.
     *      @property {Array<Object>} activeEvents - Stores events currently affecting the player or a location (e.g., a market price change at the current location).
     *      @property {Object|null} pendingEvent - Stores an event announced for another location that the player might travel to.
     *      @property {number} storeDiscount - Player-specific discount percentage for the current day at the current store (0 if no discount).
     *      @property {Object|null} tempFoundCard - Temporarily stores a card found via an event, pending player's decision (keep/return).
     */
    current: {},

    /**
     * @property {Object} market - Stores the current market conditions for all locations.
     *      Data is indexed by locationId, then by cardId.
     *      Example: this.market['location_a']['card_x'] = { price: 100, available: 10, eventModified?: true }
     *      `boosterAvailable` (boolean) is also stored per location: this.market['location_a'].boosterAvailable = true
     */
    market: {},

    /**
     * @property {Array<Object>} leaderboardScores - Stores high scores. Each object typically includes 'initials', 'score', 'id', 'cabinet'.
     */
    leaderboardScores: [],

    /**
     * Initializes the game state to its default starting conditions.
     * This includes setting initial cash, days, location, and clearing dynamic arrays like inventory and log.
     * It also attempts to robustly determine the starting location ID from GameData.
     */
    initialize() {
        // Attempt to robustly set initial location.
        let initialLocationId;
        if (GameData && GameData.locations && Array.isArray(GameData.locations) && GameData.locations.length > 0 && GameData.locations[0] && typeof GameData.locations[0].id !== 'undefined') {
            initialLocationId = GameData.locations[0].id;
        } else {
            // Critical error: Cannot determine a starting location.
            console.error("CRITICAL: GameData.locations is missing, not an array, empty, or first item has no id. Cannot initialize game.");
            // In a real scenario, we might throw an error here or try a hardcoded default if makes sense.
            // For now, setting to null and logging. This will likely be caught by GameController's init checks.
            initialLocationId = null;
        }

        this.current = {
            cash: GameConfig && typeof GameConfig.initialCash === 'number' ? GameConfig.initialCash : 0,
            daysRemaining: GameConfig && typeof GameConfig.initialDays === 'number' ? GameConfig.initialDays : 30,
            currentLocationId: initialLocationId,
            inventory: [], // Player's card collection
            log: [],       // History of game messages
            hasPriceGuide: false,
            boosterPacksPurchasedToday: 0,
            showHelpText: true,
            displayCabinet: [], // Cards showcased by the player
            activeEvents: [], // Stores events currently affecting the player or a location
            pendingEvent: null, // Stores an event in another location the player might travel to
            storeDiscount: 0,   // Player-specific discount for the current day
            tempFoundCard: null // Stores a card found by an event, pending player decision
        };
        this.market = {}; // Market data, indexed by locationId, then cardId
        // Example: this.market['location_a']['card_x'] = { price: 100, available: 10 }
        // this.leaderboardScores is intentionally not reset here, as it persists across games unless explicitly cleared.
    },

    /**
     * Retrieves the full location object for the player's current location.
     * @returns {Object|undefined} The current location object, or undefined if not found or state is invalid.
     */
    getCurrentLocation() {
        // Ensure GameData.locations is an array and this.current exists before finding.
        if (!GameData || !Array.isArray(GameData.locations)) {
            console.error("GameState Error: GameData.locations is not an array or GameData is missing.");
            return undefined;
        }
        if (!this.current || typeof this.current.currentLocationId === 'undefined') {
            console.error("GameState Error: GameState.current or currentLocationId is not initialized.");
            return undefined;
        }
        return GameData.locations.find(loc => loc.id === this.current.currentLocationId);
    },

    /**
     * Retrieves the details for a specific card by its ID.
     * @param {string} cardId - The ID of the card to retrieve.
     * @returns {Object|undefined} The card object, or undefined if not found or state is invalid.
     */
    getCardDetails(cardId) {
        // Ensure GameData.cards is an array before finding.
        if (!GameData || !Array.isArray(GameData.cards)) {
            console.error("GameState Error: GameData.cards is not an array or GameData is missing.");
            return undefined;
        }
        if (typeof cardId === 'undefined' || cardId === null) {
            console.warn("GameState Warning: getCardDetails called with undefined or null cardId.");
            return undefined;
        }
        return GameData.cards.find(card => card.id === cardId);
    }
};
