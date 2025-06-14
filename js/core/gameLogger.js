import { GameState } from './gameState.js';
import { UIRenderer } from '../ui/uiRenderer.js';

export const GameLogger = {
    addLogMessage(message) {
        GameState.current.log.unshift(message);
        if (GameState.current.log.length > 50) GameState.current.log.pop();
        UIRenderer.renderLog();
    }
};
