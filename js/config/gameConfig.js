/**
 * GameConfig
 * Centralized configuration for various game parameters and mechanics.
 * Modifying these values can significantly alter the game's difficulty, economy, and features.
 */
export const GameConfig = {
    /**
     * @property {string} appId - A unique identifier for the application.
     * Used for things like local storage key prefixing to avoid conflicts.
     */
    appId: 'sct-global',

    /**
     * @property {number} initialCash - The amount of cash the player starts the game with.
     */
    initialCash: 2000,

    /**
     * @property {number} initialDays - The total number of days the player has to play the game.
     */
    initialDays: 30,

    /**
     * @property {Object} priceMultiplier - Defines the range for random price fluctuations in the market.
     *      @property {number} min - Minimum multiplier for card base prices (e.g., 0.4 means price can be 40% of base).
     *      @property {number} max - Maximum multiplier for card base prices (e.g., 2 means price can be 200% of base).
     */
    priceMultiplier: { min: 0.4, max: 2 },

    /**
     * @property {Object} availability - Defines the base range for card availability in the market.
     *      @property {number} min - Minimum base number of a card available.
     *      @property {number} max - Maximum base number of a card available (before location biases).
     */
    availability: { min: 0, max: 20 },

    /**
     * @property {Object} boosterPack - Configuration for booster packs.
     *      @property {number} basePrice - Default price of a booster pack if not overridden by location.
     *      @property {number} dailyLimit - Maximum number of booster packs a player can purchase per day.
     *      @property {number} chancePerDay - Probability (0-1) that booster packs are available at a location each day.
     */
    boosterPack: {
        basePrice: 250,
        dailyLimit: 3,
        chancePerDay: 0.8
    },

    /**
     * @property {number} priceGuideCost - The cost for the player to purchase the price guide tool.
     */
    priceGuideCost: 1000,

    /**
     * @property {number} rareCardThreshold - The base price threshold above which a card is considered "rare".
     * Used by certain game mechanics, like the 'mystery' booster pack specialization.
     */
    rareCardThreshold: 200,

    /**
     * @property {Object} leaderboard - Configuration for the leaderboard display.
     *      @property {number} size - Total number of scores to store/display on the main leaderboard page.
     *      @property {number} inGameSize - Number of top scores to display on the game over screen.
     */
    leaderboard: {
        size: 10,
        inGameSize: 3
    },

    /**
     * @property {number} displayCabinetLimit - The maximum number of cards a player can showcase in their display cabinet.
     */
    displayCabinetLimit: 3,

    /**
     * @property {number} travelEventChance - Probability (0-1) of a random event occurring when the player travels.
     */
    travelEventChance: 0.3,

    /**
     * @property {Object} commonCardAssets - Configuration for dynamically generating visuals for "Common Single" cards.
     * This allows for varied appearances of common cards without needing unique image assets for each.
     *      @property {string} base_url - The base directory path for common card image layers.
     *      @property {Array<Object>} layers - An array defining the different visual layers (e.g., background, head, shirt).
     *          @property {string} folder - The subfolder name for this layer's image assets.
     *          @property {number} count - The number of different image assets available for this layer.
     */
    commonCardAssets: {
        base_url: 'Images/Common/',
        layers: [
            { folder: 'Background', count: 44 },
            { folder: 'Head', count: 17 },
            { folder: 'Shirt', count: 13 },
            { folder: 'hair', count: 21 },
            { folder: 'Frame', count: 5 }
        ]
    },

    /**
     * @property {Object} grading - Configuration for the card grading feature.
     *      @property {Object} costs - Cost and time for grading a card.
     *          @property {number} cash - Cash amount required to submit a card for grading.
     *          @property {number} days - Number of days the grading process takes.
     *      @property {Array<Object>} scales - Defines the grading scale, scores, and their value multipliers.
     *          @property {number} score - The numerical grade (e.g., 1-10).
     *          @property {string} name - The descriptive name of the grade (e.g., "Gem Mint", "Mint").
     *          @property {number} multiplier - Value multiplier applied to the card's packPullValue based on this grade.
     *          @property {string} slabImage - Path to the image for the graded card's slab.
     *      @property {Array<Object>} ungradedConditions - Defines possible hidden conditions of ungraded cards and their potential grade outcomes.
     *          @property {string} id - Unique identifier for the condition.
     *          @property {string} label - Display label for the condition (e.g., "Pristine", "Very Good").
     *          @property {Array<number>} gradePotential - A [min, max] array indicating the possible grade range for this condition.
     *          @property {number} probability - The chance (0-1) of a newly pulled card having this condition. Sum of probabilities should ideally be 1.
     *      @property {string} defaultPackPullValueSource - Determines how the `packPullValue` of a gradable card is set.
     *                                                    Typically 'basePrice' of the card at the moment it's pulled.
     */
    grading: {
        costs: { cash: 50, days: 5 },
        scales: [
            { score: 10, name: 'Gem Mint', multiplier: 3.0, slabImage: 'Images/slabs/slab_10.png' },
            { score: 9, name: 'Mint', multiplier: 2.0, slabImage: 'Images/slabs/slab_9.png' },
            { score: 8, name: 'Near Mint-Mint', multiplier: 1.5, slabImage: 'Images/slabs/slab_8.png' },
            { score: 7, name: 'Near Mint', multiplier: 1.2, slabImage: 'Images/slabs/slab_7.png' },
            { score: 6, name: 'Excellent-Mint', multiplier: 1.0, slabImage: 'Images/slabs/slab_6.png' },
            { score: 5, name: 'Excellent', multiplier: 0.8, slabImage: 'Images/slabs/slab_5.png' },
            { score: 4, name: 'Very Good-Excellent', multiplier: 0.6, slabImage: 'Images/slabs/slab_4.png' },
            { score: 3, name: 'Very Good', multiplier: 0.4, slabImage: 'Images/slabs/slab_3.png' },
            { score: 2, name: 'Good', multiplier: 0.3, slabImage: 'Images/slabs/slab_2.png' },
            { score: 1, name: 'Poor', multiplier: 0.2, slabImage: 'Images/slabs/slab_1.png' }
        ],
        ungradedConditions: [
            { id: 'Pristine', label: 'Pristine', gradePotential: [8, 10], probability: 0.1 },
            { id: 'Minty', label: 'Looks Mint', gradePotential: [7, 9], probability: 0.3 },
            { id: 'VeryGood', label: 'Very Good', gradePotential: [5, 7], probability: 0.4 },
            { id: 'Good', label: 'Good', gradePotential: [3, 5], probability: 0.15 },
            { id: 'Fair', label: 'Fair', gradePotential: [1, 3], probability: 0.05 }
        ],
        defaultPackPullValueSource: 'basePrice'
    }
};
