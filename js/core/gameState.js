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
     *      @property {Array<Object>} inventory - Player's card inventory.
     *          Each item can be a stack of non-gradable cards or a unique gradable card instance.
     *          Gradable (typically pack-pulled) card items will have:
     *              - instanceId: {string} A unique ID for this specific card instance (e.g., UUID).
     *              - cardId: {string} The base ID of the card type.
     *              - quantity: {number} Should be 1 for gradable instances.
     *              - totalCost: {number} Acquisition cost if tracked (might be same as packPullValue or different).
     *              - packPullValue: {number} Value of the card (e.g., basePrice) at the moment it was pulled from a pack.
     *              - hiddenUngradedCondition: {string} e.g., 'Pristine', 'VeryGood'. Assigned on pull.
     *              - grade: {Object|null} Null if ungraded. If graded: { score: number, slabImage: string, gradeName: string, multiplier: number }.
     *              - imageCombo: {Object|null} Potentially for unique visual data like layers/numbering, if not derived otherwise. (Currently, `CardVisuals` uses `layers` and `numbering` from cabinet items or generates them for packs).
     *          Non-gradable (typically market-bought) card items will have:
     *              - instanceId: null
     *              - cardId: {string}
     *              - quantity: {number} Can be > 1 for stacks.
     *              - totalCost: {number} Total cost for the stack.
     *              - packPullValue, hiddenUngradedCondition, grade, imageCombo: null or undefined.
     *      @property {Array<string>} log - Messages for the game log displayed to the player.
     *      @property {boolean} hasPriceGuide - Whether the player has purchased the price guide.
     *      @property {number} boosterPacksPurchasedToday - Count of booster packs bought on the current day.
     *      @property {boolean} showHelpText - Player's preference for showing help text.
     *      @property {Array<Object>} displayCabinet - Cards selected by the player for their display cabinet.
     *          Each item represents a single card slot and holds properties for a specific card instance:
     *              - instanceId: {string|null} Unique ID of the gradable card instance, or null if it's a non-unique market card (though typically cabinet is for unique items).
     *              - card: {Object} The full card data object from GameData.cards. (Changed from just cardId for easier access to base details)
     *              - packPullValue: {number|null} Value of the card when pulled, if applicable.
     *              - grade: {Object|null} Grade object: { score, slabImage, gradeName, multiplier }, or null if ungraded.
     *              - layers: {Object|null} Visual layer data for dynamic card art (e.g., for common singles or special pack pulls).
     *              - numbering: {Object|null} Serial numbering details { current, max, display, multiplier }, if applicable.
     *              - capturedValue: {number} The value of the card (including grade/numbering multipliers) when it was added to the cabinet. Used for leaderboard score.
     *              - isAwayForGrading: {boolean} True if the card from this slot is currently being graded. Defaults to false.
     *              - daysUntilGradingComplete: {number} Countdown timer for grading. 0 if not currently grading.
     *              - lockedByGrading: {boolean} True if this cabinet slot is "locked" because its card is away for grading. Defaults to false.
     *      @property {Array<Object>} activeEvents - Stores events currently affecting the player or a location.
     *      @property {Object|null} pendingEvent - Stores an event announced for another location.
     *      @property {number} storeDiscount - Player-specific discount percentage for the current day.
     *      @property {Object|null} tempFoundCard - Temporarily stores a card found via an event.
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
     *      The 'cabinet' property here would be a snapshot of the player's displayCabinet at the time of score submission.
     */
    leaderboardScores: [],

    /**
     * Initializes the game state to its default starting conditions.
     */
    initialize() {
        let initialLocationId;
        if (GameData && GameData.locations && Array.isArray(GameData.locations) && GameData.locations.length > 0 && GameData.locations[0] && typeof GameData.locations[0].id !== 'undefined') {
            initialLocationId = GameData.locations[0].id;
        } else {
            console.error("CRITICAL: GameData.locations is missing, not an array, empty, or first item has no id. Cannot initialize game.");
            initialLocationId = null;
        }

        this.current = {
            cash: GameConfig && typeof GameConfig.initialCash === 'number' ? GameConfig.initialCash : 0,
            daysRemaining: GameConfig && typeof GameConfig.initialDays === 'number' ? GameConfig.initialDays : 30,
            currentLocationId: initialLocationId,
            inventory: [],
            log: [],
            hasPriceGuide: false,
            boosterPacksPurchasedToday: 0,
            showHelpText: true,
            displayCabinet: [], // Initialized as empty. Items added will conform to the new structure.
            activeEvents: [],
            pendingEvent: null,
            storeDiscount: 0,
            tempFoundCard: null,
            pendingGradingReveal: null // For managing the grading reveal modal
        };
        this.market = {};
    },

    /**
     * Retrieves the full location object for the player's current location.
     * @returns {Object|undefined} The current location object, or undefined if not found or state is invalid.
     */
    getCurrentLocation() {
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
     * Retrieves the details for a specific card by its ID from GameData.
     * @param {string} cardId - The ID of the card to retrieve.
     * @returns {Object|undefined} The card object from GameData, or undefined if not found.
     */
    getCardDetails(cardId) {
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
