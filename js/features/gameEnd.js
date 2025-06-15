import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';

export const GameEnd = {
    async checkGameOver() {
        if (GameState.current.daysRemaining <= 0) {
            let cabinetValue = 0;
            GameState.current.displayCabinet.forEach(item => {
                cabinetValue += (item.capturedValue || 0);
            });
            const totalScore = GameState.current.cash + cabinetValue;
            
            GameLogger.addLogMessage(`Game Over! Final cash: ${GameState.current.cash.toLocaleString()}, Cabinet value: ${cabinetValue}, Total: ${totalScore.toLocaleString()}.`);
            
            const lowestHighScore = GameState.leaderboardScores.length > 0 ? 
                GameState.leaderboardScores[Math.min(GameState.leaderboardScores.length - 1, GameConfig.leaderboard.size - 1)].score : 0;
            if (totalScore > lowestHighScore || GameState.leaderboardScores.length < GameConfig.leaderboard.size) {
                document.getElementById('high-score-final-score').innerHTML = 
                    `${GameState.current.cash.toLocaleString()} + ${cabinetValue} cabinet = <span class="text-green-400">${totalScore.toLocaleString()}</span>`;
                UIElements.highScoreModal.classList.remove('hidden');
            } else {
                await this.showGameOverScreen();
            }
            return true;
        }
        return false;
    },

    async showGameOverScreen() {
        const gameOverCabinetList = document.getElementById('game-over-cabinet-list');
        gameOverCabinetList.innerHTML = '';
        
        let cabinetValue = 0;
        
        if (GameState.current.displayCabinet.length > 0) {
            GameState.current.displayCabinet.forEach(cabinetItem => {
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'flex flex-col items-center';
                
                const cardVisual = CardVisuals.createCardVisual(cabinetItem);
                cardWrapper.appendChild(cardVisual);
                
                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
                valueDisplay.textContent = `${cabinetItem.capturedValue || 0}`;
                cardWrapper.appendChild(valueDisplay);
                
                gameOverCabinetList.appendChild(cardWrapper);
                cabinetValue += (cabinetItem.capturedValue || 0);
            });
            document.getElementById('game-over-cabinet-section').style.display = 'block';
        } else {
            document.getElementById('game-over-cabinet-section').style.display = 'none';
        }

        const totalScore = GameState.current.cash + cabinetValue;
        
        const topScores = GameState.leaderboardScores.slice(0, GameConfig.leaderboard.size);
        document.getElementById('final-score').innerHTML = 
            `${GameState.current.cash.toLocaleString()} <span class="text-lg">(+ ${cabinetValue} cabinet)</span> = <span class="text-green-400">${totalScore.toLocaleString()}</span>`;
        UIRenderer.renderLeaderboard(topScores, document.getElementById('game-over-leaderboard-list'));
        UIElements.gameOverModal.classList.remove('hidden');
    }
};
