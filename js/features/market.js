import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameState } from '../core/gameState.js';

/**
 * Market Module
 * Handles the generation and updating of market data for cards across different locations.
 * This includes calculating prices and availability based on various factors like
 * base card prices, location biases, game configuration, and special events.
 */
export const Market = {
    /**
     * Generates market data (price and availability) for a single card at a specific location.
     * @param {Object} card - The card object from GameData.tradableCards.
     * @param {Object} location - The location object from GameData.locations.
     * @returns {Object} An object containing the calculated `price` and `available` quantity for the card at that location.
     *                   Returns a default safe structure { price: 1, available: 0 } if inputs are invalid.
     */
    generateMarketDataForCard(card, location) {
        // Validate inputs: card and location must exist and have necessary properties.
        // Error handling comments from previous pass are preserved.
        if (!card || typeof card.basePrice !== 'number' || typeof card.id !== 'string') {
            console.error("Market Error: Invalid card data provided to generateMarketDataForCard.", card);
            return { price: 1, available: 0 }; // Return a default/safe structure.
        }
        if (!location || typeof location.priceBias !== 'number' || typeof location.availabilityBias !== 'number' || typeof location.specialization !== 'string') {
            console.error("Market Error: Invalid location data provided to generateMarketDataForCard.", location);
            return { price: 1, available: 0 }; // Return a default/safe structure.
        }

        // Safely access GameConfig properties with fallbacks to prevent NaN issues.
        const priceMultiplierMin = GameConfig?.priceMultiplier?.min ?? 0.8;
        const priceMultiplierMax = GameConfig?.priceMultiplier?.max ?? 1.2;
        const availabilityMin = GameConfig?.availability?.min ?? 5;
        const availabilityMax = GameConfig?.availability?.max ?? 20;

        // --- Price Calculation ---
        // Price fluctuates randomly within a configured range (e.g., 80% to 120% of base).
        const priceFluctuation = Math.random() * (priceMultiplierMax - priceMultiplierMin) + priceMultiplierMin;
        // Final price is base price * fluctuation * location-specific bias.
        const finalPrice = Math.round(card.basePrice * priceFluctuation * location.priceBias);
        
        // --- Availability Calculation ---
        let availabilityFluctuation = Math.random(); // Base random factor for availability.
        // Availability uses a squared fluctuation to make lower numbers more common, then scaled by config range.
        let baseAvailability = Math.floor(Math.pow(availabilityFluctuation, 2) * (availabilityMax - availabilityMin + 1)) + availabilityMin;
        
        // Apply location specializations to modify base availability.
        // These checks assume card.id and card.basePrice are valid due to the initial validation.
        if (location.specialization === 'high_end') {
            // High-end locations boost availability of expensive cards, reduce for cheap ones.
            if (card.id === 'autographed_jersey' || card.id === 'numbered_rookie_auto' || card.id === 'numbered_legend') {
                baseAvailability = Math.max(5, Math.floor(baseAvailability * 2));
            } else if (card.basePrice < 50) {
                baseAvailability = Math.floor(baseAvailability * 0.5);
            }
        } else if (location.specialization === 'rookies') {
            // Rookie-focused locations boost availability of specific rookie cards.
            if (card.id === 'prized_rookie_card' || card.id === 'numbered_rookie_auto') {
                baseAvailability = Math.max(5, Math.floor(baseAvailability * 2.5));
            }
        } else if (location.specialization === 'bulk') {
            // Bulk locations have a flat, higher random availability range.
            baseAvailability = Math.floor(Math.random() * 46) + 5; // Results in 5-50
        }
        
        // Final availability is base availability * location-specific bias, ensuring at least 1.
        const finalAvailability = Math.max(1, Math.round(baseAvailability * location.availabilityBias));
        // Ensure price is at least 1.
        return { price: Math.max(1, finalPrice), available: finalAvailability };
    },

    /**
     * Generates and stores initial market prices and booster pack availability for ALL locations.
     * This is typically called once at the beginning of the game.
     * It populates `GameState.market` with data for each tradable card in each location.
     */
    generateAllMarketPrices() {
        try {
            // Validate GameData dependencies. Error handling comments from previous pass are preserved.
            if (!GameData || !Array.isArray(GameData.locations)) {
                console.error("Market Error: GameData.locations is not an array or GameData is missing. Cannot generate market prices.");
                return;
            }
            if (!GameData || !Array.isArray(GameData.tradableCards)) {
                console.error("Market Error: GameData.tradableCards is not an array or GameData is missing. Cannot generate market prices.");
                return;
            }
            const boosterChance = GameConfig?.boosterPack?.chancePerDay ?? 0.1; // Default chance if not configured.

            GameData.locations.forEach(location => {
                if (!location || typeof location.id === 'undefined') {
                    console.warn("Market Warning: Skipping location with invalid data during market generation.", location);
                    return; // Skip this iteration for invalid location data.
                }
                // Initialize the market object for this location.
                GameState.market[location.id] = {};
                // Determine initial booster pack availability for this location.
                GameState.market[location.id].boosterAvailable = (Math.random() < boosterChance);

                GameData.tradableCards.forEach(card => {
                    if (!card || typeof card.id === 'undefined') {
                        console.warn("Market Warning: Skipping card with invalid data during market generation for location:", location.id, card);
                        return; // Skip this iteration for invalid card data.
                    }
                    // generateMarketDataForCard now has internal checks for card and location validity.
                    GameState.market[location.id][card.id] = this.generateMarketDataForCard(card, location);
                });
            });
        } catch (error) {
            console.error("Market Error: A critical error occurred in generateAllMarketPrices:", error);
            // Potentially set a flag or state indicating market generation failed.
        }
    },

    /**
     * Updates the market data for the player's current location.
     * This is called when the player travels to a new location or advances the day at the same location.
     * It re-calculates booster pack availability and card prices/stock, unless a card's market data
     * has been specifically modified by an event (indicated by the `eventModified` flag).
     */
    updateMarketForCurrentLocation() {
        try {
            const location = GameState.getCurrentLocation();
            // Critical: If location is undefined, we cannot proceed.
            // Error handling comments from previous pass are preserved.
            if (!location || typeof location.id === 'undefined') {
                console.error("Market Error: Current location is undefined or invalid in updateMarketForCurrentLocation. Market not updated.");
                return;
            }

            // Ensure GameState.market for the location ID exists, or initialize it.
            const locationMarket = GameState.market[location.id] || {};
            GameState.market[location.id] = locationMarket; // Ensure it's assigned back if it was newly created.

            // Re-roll booster pack availability for the current location.
            // Existing comment about this being an intended game mechanic is preserved.
            const boosterChance = GameConfig?.boosterPack?.chancePerDay ?? 0.1;
            locationMarket.boosterAvailable = (Math.random() < boosterChance);

            if (!GameData || !Array.isArray(GameData.tradableCards)) {
                console.error("Market Error: GameData.tradableCards is not an array or GameData is missing. Cannot update market for location:", location.id);
                return;
            }

            GameData.tradableCards.forEach(card => {
                if (!card || typeof card.id === 'undefined') {
                    console.warn("Market Warning: Skipping card with invalid data during market update for location:", location.id, card);
                    return; // Skip this iteration.
                }
                // Card prices and availability are regenerated IF NOT modified by an ongoing event.
                // The `eventModified` flag is set by event logic (e.g., in events.js)
                // and cleared when events end or player leaves the location.
                // generateMarketDataForCard has internal checks for card and location.
                if (!locationMarket[card.id] || !locationMarket[card.id].eventModified) {
                    locationMarket[card.id] = this.generateMarketDataForCard(card, location);
                }
            });
            // No need to re-assign locationMarket to GameState.market[location.id] if it was already an object from GameState.market
            // as object properties are modified by reference. But assigning it (as done above when initializing) is also fine.
        } catch (error) {
            console.error("Market Error: A critical error occurred in updateMarketForCurrentLocation:", error);
        }
    }
};
