import { GameState } from '../core/gameState.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { Market } from './market.js';
import { Events } from './events.js';
import { GameEnd } from './gameEnd.js';

/**
 * Travel Module
 * Handles the logic associated with player movement between different locations in the game.
 * This includes calculating travel time, updating game state accordingly,
 * and triggering related actions like market updates and event checks.
 */
export const Travel = {
    /**
     * Moves the player to a new location.
     * @param {string} destinationLocationId - The ID of the location to travel to.
     * Logic:
     * 1. Validates if travel is possible (location exists, enough days remaining).
     * 2. Clears any market events active at the *previous* location.
     * 3. Resets daily player state like store discounts.
     * 4. Deducts travel days from `GameState.current.daysRemaining`.
     * 5. Updates `GameState.current.currentLocationId` to the new location.
     * 6. Resets daily limits like `boosterPacksPurchasedToday`.
     * 7. Checks if arriving at the destination triggers a `pendingEvent` (e.g., a card show announced earlier).
     * 8. Updates the market data for the new current location.
     * 9. Checks for new random travel events that might occur upon arrival.
     * 10. Checks for game over conditions (e.g., running out of days).
     * 11. Re-renders the UI to reflect all changes.
     */
    async travelTo(destinationLocationId) {
        const previousLocationId = GameState.current.currentLocationId;
        // Determine travel duration from GameData based on current and destination locations.
        const travelCostDays = GameData.travelDurations[previousLocationId]?.[destinationLocationId];

        // Validate travel path and days.
        if (travelCostDays === undefined) {
            GameLogger.addLogMessage("Cannot travel to that location."); // Should ideally not happen if UI is correct.
            return;
        }
        if (GameState.current.daysRemaining < travelCostDays) {
            GameLogger.addLogMessage("Not enough days left to travel!");
            // Check if this lack of days triggers a game over.
            await GameEnd.checkGameOver();
            return;
        }
        
        // --- Pre-Travel State Updates ---
        // Clear any event-specific market modifications from the location being left.
        Events.clearOldEvents(previousLocationId);
        // Reset daily store discount as it's location/day specific.
        GameState.current.storeDiscount = 0;
        
        // --- Update Core Game State for Travel ---
        GameState.current.daysRemaining -= travelCostDays;
        GameState.current.currentLocationId = destinationLocationId;
        GameLogger.addLogMessage(`Traveled to ${GameState.getCurrentLocation()?.name || 'an unknown place'}. Lost ${travelCostDays} day${travelCostDays > 1 ? 's' : ''}.`);

        // Reset daily counters.
        GameState.current.boosterPacksPurchasedToday = 0;
        
        // --- Post-Travel Actions & Event Handling ---
        // Check if arriving at this location triggers a pending event.
        if (GameState.current.pendingEvent && GameState.current.pendingEvent.location === destinationLocationId) {
            GameState.current.activeEvents.push(GameState.current.pendingEvent); // Move from pending to active.
            Events.applyEventEffects(GameState.current.pendingEvent); // Apply its market effects.
            GameLogger.addLogMessage(`You've arrived just in time for the ${GameState.current.pendingEvent.type.replace(/_/g, ' ')}!`);
            GameState.current.pendingEvent = null; // Clear the pending event.
        }
        
        // Refresh market data for the new location.
        Market.updateMarketForCurrentLocation();
        // Check if any new travel-related random event occurs upon arrival.
        Events.checkForTravelEvent();

        // Check for game over conditions again (e.g., if days ran out exactly due to travel).
        if (await GameEnd.checkGameOver()) return; // If game over, stop further UI updates for travel.

        // Update the entire UI to reflect the new state.
        UIRenderer.renderAll();
    }
};
