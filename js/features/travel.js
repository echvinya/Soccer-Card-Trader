import { GameState } from '../core/gameState.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { Market } from './market.js';
import { Events } from './events.js';
import { GameEnd } from './gameEnd.js';
import { MobileNavigation } from '../ui/mobileNavigation.js'; // Import MobileNavigation

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
        
        GameState.current.daysRemaining -= travelCostDays;
        GameState.current.currentLocationId = destinationLocationId;
        GameLogger.addLogMessage(`Traveled to ${GameState.getCurrentLocation().name}. Lost ${travelCostDays} day${travelCostDays > 1 ? 's' : ''}.`);
        GameState.current.boosterPacksPurchasedToday = 0;
        
        if (GameState.current.pendingEvent && GameState.current.pendingEvent.location === destinationLocationId) {
            GameState.current.activeEvents.push(GameState.current.pendingEvent);
            Events.applyEventEffects(GameState.current.pendingEvent);
            GameLogger.addLogMessage(`You've arrived just in time for the ${GameState.current.pendingEvent.type.replace(/_/g, ' ')}!`);
            GameState.current.pendingEvent = null;
        }
        
        Market.updateMarketForCurrentLocation();
        Events.checkForTravelEvent();

        if (await GameEnd.checkGameOver()) return;
        UIRenderer.renderAll(); // Renders desktop, player stats etc.

        // Navigate to the market tab for the new location in mobile view
        const marketNavButton = document.getElementById('nav-market');
        if (marketNavButton && typeof MobileNavigation.handleNavClick === 'function') {
            MobileNavigation.handleNavClick(marketNavButton);
        } else if (typeof MobileNavigation.navigateToView === 'function') {
            // Fallback if handleNavClick isn't ideal or button not found, though less clean
            MobileNavigation.navigateToView('market', true);
        }
    }
};
