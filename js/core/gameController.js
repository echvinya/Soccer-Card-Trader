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

            if (action === 'buy-qty') Trading.buyItemQty(cardId);
            else if (action === 'buy-all') Trading.buyAllItems(cardId);
        });
        
        // Inventory click handler
        UIElements.inventoryItems.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;
            const action = button.dataset.action;
            const cardId = button.dataset.cardId;
            if (!action || !cardId) return;

            if (action === 'sell-qty') Trading.sellItemQty(cardId);
            else if (action === 'sell-all') Trading.sellAllItems(cardId);
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
        UIElements.restartGameBtn.addEventListener('click', () => {
            GameLogger.addLogMessage("Restarting game...");
            this.initializeGame();
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
    }
};
