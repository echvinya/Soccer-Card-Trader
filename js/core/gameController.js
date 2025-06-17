import { GameState } from './gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { Market } from '../features/market.js';
import { GameLogger } from './gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { UIElements } from '../ui/uiElements.js';
import { Trading } from '../features/trading.js';
// Handles player movement between locations and associated day changes.
import { Travel } from '../features/travel.js';
// Manages the player's display cabinet feature.
import { Cabinet } from '../features/cabinet.js';
// Handles high score submissions and display.
import { Leaderboard } from '../features/leaderboard.js';
// Manages random events that occur during gameplay.
import { Events } from '../features/events.js';
// Handles game over conditions and final scoring.
import { GameEnd } from '../features/gameEnd.js';
// Handles card grading submissions and processing.
import { GradingService } from '../features/grading.js';

/**
 * GameController
 * Orchestrates the overall game flow, initializes the game state, sets up event handlers,
 * and coordinates actions between different game modules.
 */
export const GameController = {
    /**
     * Initializes or restarts the game.
     * This function sets up the initial game state (cash, days, location),
     * generates market data for all locations, updates the market for the starting location,
     * logs a welcome message, and renders the initial UI.
     * It includes error handling to catch issues during this critical setup phase.
     */
    initializeGame() {
        try {
            // Initialize core game state (player stats, inventory, etc.)
            GameState.initialize();
            // Generate initial market prices and availability for all cards in all locations.
            Market.generateAllMarketPrices();
            // Update the market specifically for the player's starting location.
            Market.updateMarketForCurrentLocation();

            const currentLocation = GameState.getCurrentLocation();
            if (!currentLocation) {
                // Log critical error as the game cannot start without a valid current location.
                console.error("Critical: Current location not found during initialization.");
                GameLogger.addLogMessage("Error: Game initialization failed. Current location is missing.");
                // Potentially display a user-friendly error message on the UI.
                return; // Stop further initialization.
            }
            GameLogger.addLogMessage(`Welcome! You have ${GameConfig.initialDays} days. Starting at ${currentLocation.name}.`);
            // Render all UI components to reflect the initial state.
            UIRenderer.renderAll();

            // Assuming UIElements are generally expected to exist. If not, these could also be in try-catch.
            if (UIElements.gameOverModal) UIElements.gameOverModal.classList.add('hidden');
            if (UIElements.highScoreModal) UIElements.highScoreModal.classList.add('hidden');
        } catch (error) {
            console.error("Error during game initialization:", error);
            GameLogger.addLogMessage("A critical error occurred while starting the game. Please try refreshing the page.");
            // Optionally, display an error message to the user via UI.
            // Note: Existing comments on error handling from previous steps are preserved.
        }
    },

    /**
     * Sets up all global event handlers for user interactions.
     * This includes handlers for market actions (buy/sell), inventory actions,
     * leaderboard interactions, and various UI buttons (restart, modals, etc.).
     * It uses a helper function `addSafeEventListener` to ensure robustness.
     */
    setupEventHandlers() {
        /**
         * Helper function to add event listeners safely.
         * It checks if the target DOM element exists before attaching the listener
         * and wraps the event handler in a try...catch block to prevent
         * unhandled errors from breaking the application.
         * @param {HTMLElement} element - The DOM element to attach the listener to.
         * @param {string} eventType - The type of event (e.g., 'click', 'change').
         * @param {Function} handler - The event handler function.
         */
        const addSafeEventListener = (element, eventType, handler) => {
            if (!element) {
                // Log a warning if the element doesn't exist, preventing errors but alerting developers.
                console.warn(`Element not found for event listener: ${eventType}`);
                return;
            }
            element.addEventListener(eventType, (e) => {
                try {
                    handler(e);
                } catch (error) {
                    console.error(`Error in event handler for ${eventType} on ${element.id || element.className}:`, error);
                    GameLogger.addLogMessage("An error occurred while processing your action. Please try again.");
                }
            });
        };

        // Market click handler: Uses event delegation on the market items container.
        // Actions are determined by 'data-action' and 'data-card-id' attributes on clicked buttons.
        if (UIElements.marketItems) {
            addSafeEventListener(UIElements.marketItems, 'click', (e) => {
                // Find the closest button with a 'data-action' attribute that was clicked.
                const button = e.target.closest('button[data-action]');
                if (!button) return; // If the click was not on a relevant button.
                const action = button.dataset.action;
                const cardId = button.dataset.cardId;
                if (!action || !cardId) {
                    GameLogger.addLogMessage("Invalid action or card ID for market operation.");
                    return;
                }

                // Dispatch to the appropriate Trading module function based on the action.
                if (action === 'buy-qty') Trading.buyItemQty(cardId);
                else if (action === 'buy-all') Trading.buyAllItems(cardId);
            });
        } else {
            console.warn("Market items container (UIElements.marketItems) not found. Cannot attach event handlers.");
        }
        
        // Inventory click handler: Similar to the market, uses event delegation on the inventory items container.
        if (UIElements.inventoryItems) {
            addSafeEventListener(UIElements.inventoryItems, 'click', (e) => {
                const button = e.target.closest('button[data-action]');
                if (!button) return;
                const action = button.dataset.action;
                const cardId = button.dataset.cardId;
                if (!action || !cardId) {
                    GameLogger.addLogMessage("Invalid action or card ID for inventory operation.");
                    return;
                }

                // Dispatch to the appropriate Trading module function.
                if (action === 'sell-qty') Trading.sellItemQty(cardId);
                else if (action === 'sell-all') Trading.sellAllItems(cardId);
            });
        } else {
            console.warn("Inventory items container (UIElements.inventoryItems) not found. Cannot attach event handlers.");
        }

        // Leaderboard click handler: Handles clicks within the leaderboard lists.
        // Specifically looks for 'view-cabinet' action to display a player's saved cabinet from high scores.
        const handleLeaderboardClick = (e) => {
            // This function is already wrapped by addSafeEventListener defined above.
            const button = e.target.closest('button[data-action="view-cabinet"]');
            if (button) {
                const scoreId = button.dataset.scoreId;
                if (!scoreId) {
                    GameLogger.addLogMessage("Score ID missing for leaderboard action.");
                    return;
                }
                // Ensure leaderboardScores is available and is an array before trying to use .find()
                if (GameState.leaderboardScores && Array.isArray(GameState.leaderboardScores)) {
                    const score = GameState.leaderboardScores.find(s => s.id === scoreId);
                    if (score && score.cabinet) {
                        Cabinet.showPlayerCabinet(score.cabinet);
                    } else if (score && !score.cabinet) {
                        GameLogger.addLogMessage("Selected score does not have a cabinet to display.");
                    } else {
                        GameLogger.addLogMessage("Could not find score details for the selected player.");
                    }
                } else {
                    GameLogger.addLogMessage("Leaderboard data is not available at the moment.");
                    console.warn("GameState.leaderboardScores is not available or not an array.");
                }
            }
        };
        
        // Attach leaderboard click handlers to both main and game-over leaderboards.
        addSafeEventListener(UIElements.leaderboardList, 'click', handleLeaderboardClick);
        addSafeEventListener(UIElements.gameOverLeaderboardList, 'click', handleLeaderboardClick);

        // General UI Button Handlers:
        // These attach listeners to various static buttons throughout the UI,
        // such as restarting the game, closing modals, or toggling help text.
        // Each handler calls the appropriate module or updates game state.
        addSafeEventListener(UIElements.restartGameBtn, 'click', () => {
            GameLogger.addLogMessage("Restarting game...");
            this.initializeGame(); // initializeGame itself has robust error handling.
        });
        addSafeEventListener(UIElements.playAgainBtn, 'click', () => {
            if (UIElements.gameOverModal) UIElements.gameOverModal.classList.add('hidden');
            this.initializeGame(); // initializeGame itself has robust error handling.
        });
        addSafeEventListener(UIElements.closePackModalBtn, 'click', () => {
            if (UIElements.boosterPackModal) UIElements.boosterPackModal.classList.add('hidden');
        });
        addSafeEventListener(UIElements.closeEventModalBtn, 'click', () => {
            if (UIElements.eventModal) UIElements.eventModal.classList.add('hidden');
        });
        addSafeEventListener(UIElements.helpTextToggle, 'change', (e) => {
            // This handler toggles the visibility of help text based on checkbox state.
            // Accessing e.target.checked is generally safe for checkbox change events.
            // Ensure GameState.current exists, though it should after initializeGame.
            if (GameState.current) {
                GameState.current.showHelpText = e.target.checked;
                UIRenderer.renderAll(); // Re-render UI to reflect help text changes. This call could potentially fail.
            } else {
                console.error("GameState.current is not initialized. Cannot set showHelpText.");
                GameLogger.addLogMessage("Error: Game state not ready for help text toggle.");
            }
        });
        addSafeEventListener(UIElements.submitScoreBtn, 'click', () => {
            // Calls Leaderboard module to handle submission.
            // Assumes submitHighScore has its own error handling or should be wrapped if it's complex.
            Leaderboard.submitHighScore();
        });
        addSafeEventListener(UIElements.cancelCabinetModalBtn, 'click', () => {
            if (UIElements.cabinetModal) UIElements.cabinetModal.classList.add('hidden');
        });
        addSafeEventListener(UIElements.manageCabinetBtn, 'click', () => {
            // Calls Cabinet module to show management modal.
            // Assumes this function has its own error handling.
            Cabinet.showManageCabinetModal();
        });
        addSafeEventListener(UIElements.closeViewCabinetBtn, 'click', () => {
            if (UIElements.viewCabinetModal) UIElements.viewCabinetModal.classList.add('hidden');
        });

        // Event listener for "Send for Grading" buttons in the display cabinet
        if (UIElements.displayCabinetList) {
            addSafeEventListener(UIElements.displayCabinetList, 'click', (e) => {
                const button = e.target.closest('button[data-action="send-to-grading"]');
                if (button) {
                    const cabinetSlotIndex = parseInt(button.dataset.cabinetSlotIndex);
                    // instanceId is primarily for client-side clarity if needed,
                    // but submitCardForGrading uses cabinetSlotIndex to get the item.
                    // const instanceId = button.dataset.instanceId;

                    if (isNaN(cabinetSlotIndex)) {
                        console.error("GameController Error: Invalid cabinetSlotIndex for grading submission from button:", button.dataset.cabinetSlotIndex);
                        GameLogger.addLogMessage("Error initiating grading. Invalid slot information.");
                        return;
                    }

                    const success = GradingService.submitCardForGrading(cabinetSlotIndex);
                    if (success) {
                        // Re-render relevant UI parts immediately after submission
                        UIRenderer.renderDisplayCabinet();
                        UIRenderer.renderPlayerStats();
                    }
                }
            });
        } else {
            console.warn("Display cabinet list (UIElements.displayCabinetList) not found. Cannot attach grading event handlers.");
        }

        // Event listener for the "Close Grading Reveal Modal" button
        if (UIElements.closeGradingRevealModalBtn) {
            addSafeEventListener(UIElements.closeGradingRevealModalBtn, 'click', () => {
                UIRenderer.hideGradingRevealModal();
                // hideGradingRevealModal should handle re-rendering the cabinet.
            });
        } else {
            console.warn("Close grading reveal modal button (UIElements.closeGradingRevealModalBtn) not found.");
        }
    },

    /**
     * Advances the game by one day.
     * This is a conceptual placement for daily processing logic.
     * Actual implementation might be in a main game loop or a dedicated "Next Day" button handler.
     */
    advanceDay() {
        // Example of how daily processing would be integrated:
        // GameState.current.daysRemaining--;
        // GameLogger.addLogMessage(`Advanced to next day. ${GameState.current.daysRemaining} days left.`);

        // Process any cards currently in grading.
        GradingService.processDailyGrading();

        // After all daily processing, check if a grading reveal is pending.
        if (GameState.current.pendingGradingReveal) {
            UIRenderer.showGradingRevealModal(GameState.current.pendingGradingReveal);
            // Note: showGradingRevealModal does not clear pendingGradingReveal itself.
            // It's cleared when the modal is closed by the user via hideGradingRevealModal.
        }

        // Market.updateMarketForCurrentLocation(); // Example: Market might update daily
        // Events.checkForTravelEvent(); // Or new events might occur
        // UIRenderer.renderAll();
        // GameEnd.checkGameOver();
        console.log("Conceptual advanceDay called: Grading processed, reveal checked.");
    }
};
