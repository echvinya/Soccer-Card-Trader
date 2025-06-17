import { GameState } from '../core/gameState.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { Market } from './market.js';
import { Events } from './events.js';
import { GameEnd } from './gameEnd.js';
// Add GameController to the imports
import { GameController } from '../core/gameController.js';

export const Travel = {
    async travelTo(destinationLocationId) {
        const previousLocationId = GameState.current.currentLocationId;
        const travelCostDays = GameData.travelDurations[previousLocationId]?.[destinationLocationId];

        if (travelCostDays === undefined) {
            GameLogger.addLogMessage("Cannot travel to that location.");
            return;
        }
        if (GameState.current.daysRemaining < travelCostDays) {
            GameLogger.addLogMessage("Not enough days left to travel!");
            await GameEnd.checkGameOver();
            return;
        }
        
        Events.clearOldEvents(previousLocationId);
        GameState.current.storeDiscount = 0;
        
        const daysActuallyPassed = travelCostDays;
        GameState.current.daysRemaining -= travelCostDays;
        GameState.current.currentLocationId = destinationLocationId;
        GameLogger.addLogMessage(`Traveled to ${GameState.getCurrentLocation().name}. Lost ${travelCostDays} day${travelCostDays > 1 ? 's' : ''}.`);
        
        // Call advanceDayEffects to process grading and other daily events for each day passed
        // This will trigger grading progress and show modals for any completed gradings.
        GameController.advanceDayEffects(daysActuallyPassed);

        GameState.current.boosterPacksPurchasedToday = 0; // Reset daily limits after day advance

        // Check for pending events at the new location
        if (GameState.current.pendingEvent && GameState.current.pendingEvent.location === destinationLocationId) {
            GameState.current.activeEvents.push(GameState.current.pendingEvent);
            Events.applyEventEffects(GameState.current.pendingEvent);
            GameLogger.addLogMessage(`You've arrived just in time for the ${GameState.current.pendingEvent.type.replace(/_/g, ' ')}!`);
            GameState.current.pendingEvent = null;
        }
        
        // Update market for the new location & check for new travel events
        Market.updateMarketForCurrentLocation();
        Events.checkForTravelEvent(); // This might generate a new pendingEvent

        if (await GameEnd.checkGameOver()) return; // checkGameOver might also end game based on daysRemaining

        UIRenderer.renderAll(); // Finally, render all UI changes
    }
};
