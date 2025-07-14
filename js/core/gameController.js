import { GameState } from './gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { Market } from '../features/market.js';
import { GameLogger } from './gameLogger.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { UIElements } from '../ui/uiElements.js';
import { Trading } from '../features/trading.js';
import { Travel } from '../features/travel.js';
import { Cabinet } from '../features/cabinet.js';
import { Leaderboard } from '../features/leaderboard.js';
import { Events } from '../features/events.js';
import { GameEnd } from '../features/gameEnd.js';
// Add this import
import { Grading } from '../features/grading.js';

export const GameController = {
    initializeGame() {
        GameState.initialize();
        Market.generateAllMarketPrices();
        Market.updateMarketForCurrentLocation();
        GameLogger.addLogMessage(`Welcome! You have ${GameConfig.initialDays} days. Starting at ${GameState.getCurrentLocation().name}.`);
        UIRenderer.renderAll();
        UIElements.gameOverModal.classList.add('hidden');
        UIElements.highScoreModal.classList.add('hidden');
    },

    setupEventHandlers() {
        // Market click handler
        UIElements.marketItems.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const cardId = button.dataset.cardId;
            if (!action || !cardId) return;

            if (action === 'buy') Trading.openBuyModal(cardId);
            else if (action === 'sell') Trading.openSellModal(cardId);
        });

        // Leaderboard click handler
        const handleLeaderboardClick = (e) => {
            const button = e.target.closest('button[data-action="view-cabinet"]');
            if (button) {
                const scoreId = button.dataset.scoreId;
                const score = GameState.leaderboardScores.find(s => s.id === scoreId);
                if (score && score.cabinet) {
                    Cabinet.showPlayerCabinet(score.cabinet);
                }
            }
        };
        
        UIElements.leaderboardList.addEventListener('click', handleLeaderboardClick);
        UIElements.gameOverLeaderboardList.addEventListener('click', handleLeaderboardClick);

        // Button handlers
        UIElements.travelBtn.addEventListener('click', () => {
            UIElements.travelModal.classList.remove('hidden');
        });
        UIElements.displayCabinetBtn.addEventListener('click', () => {
            document.getElementById('display-cabinet-section').scrollIntoView({ behavior: 'smooth' });
        });
        UIElements.playAgainBtn.addEventListener('click', () => {
            UIElements.gameOverModal.classList.add('hidden');
            this.initializeGame();
        });
        UIElements.closePackModalBtn.addEventListener('click', () => {
            UIElements.boosterPackModal.classList.add('hidden');
        });
        UIElements.closeEventModalBtn.addEventListener('click', () => {
            UIElements.eventModal.classList.add('hidden');
        });
        UIElements.helpTextToggle.addEventListener('change', (e) => {
            GameState.current.showHelpText = e.target.checked;
            UIRenderer.renderAll();
        });
        UIElements.submitScoreBtn.addEventListener('click', () => Leaderboard.submitHighScore());
        UIElements.cancelCabinetModalBtn.addEventListener('click', () => {
            UIElements.cabinetModal.classList.add('hidden');
        });
        UIElements.manageCabinetBtn.addEventListener('click', () => Cabinet.showManageCabinetModal());
        UIElements.closeViewCabinetBtn.addEventListener('click', () => {
            UIElements.viewCabinetModal.classList.add('hidden');
        });
        UIElements.travelCancelBtn.addEventListener('click', () => {
            UIElements.travelModal.classList.add('hidden');
        });
    },

    /**
     * Processes effects that occur due to the passage of one or more days.
     * This includes updating card grading progress and showing completion modals.
     * @param {number} daysPassed - The number of days that have advanced.
     */
    advanceDayEffects(daysPassed) {
        if (daysPassed <= 0) return;

        console.log(`Advancing day effects for ${daysPassed} day(s).`);
        for (let i = 0; i < daysPassed; i++) {
            // GameState.current.daysRemaining has already been decremented by the caller (e.g., Travel.travelTo)
            // So, here we just process the consequences of that day passing.
            console.log(`Processing daily updates for day ${i + 1} of ${daysPassed}`);

            // Process grading for one day
            const newlyGradedCards = Grading.processSingleDayGradingUpdate();

            if (newlyGradedCards.length > 0) {
                console.log(`${newlyGradedCards.length} card(s) finished grading this day.`);
                newlyGradedCards.forEach(gradedCardItem => {
                    // GameLogger.addLogMessage(`${gradedCardItem.card.name} has finished grading!`); // Log it
                    UIRenderer.showGradingCompleteModal(gradedCardItem); // Show the modal
                });
            }

            // Future daily processes (e.g., random events, market fluctuations) could be called here for each day.
            // Events.processDailyEvents();
            // Market.processDailyFluctuations();
        }
        // After all days have been processed, a single UIRenderer.renderAll() will typically be called
        // by the function that initiated the day advance (e.g., Travel.travelTo),
        // so individual renders might not be needed here unless a modal blocks execution.
        // The modal UIRenderer.showGradingCompleteModal itself is non-blocking in terms of game loop.
    }
    // Make sure to export GameController if it's not already fully exported for Travel.js to use it.
    // (It is, as it's an object literal assigned to an export const)
};
