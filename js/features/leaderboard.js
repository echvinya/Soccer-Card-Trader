import { db } from '../firebase/firebaseConfig.js';
import { collection, onSnapshot, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { GameEnd } from './gameEnd.js';

export const Leaderboard = {
    getLeaderboardCollection() {
        return collection(db, 'artifacts', GameConfig.appId, 'public', 'data', 'leaderboard');
    },

    async listenForLeaderboardUpdates() {
        onSnapshot(this.getLeaderboardCollection(), (snapshot) => {
            const scores = [];
            snapshot.forEach(doc => {
                scores.push({ id: doc.id, ...doc.data() });
            });
            GameState.leaderboardScores = scores.sort((a, b) => b.score - a.score);
            const topScores = GameState.leaderboardScores.slice(0, GameConfig.leaderboard.inGameSize);
            UIElements.inGameLeaderboardTitle.textContent = `Global Top ${GameConfig.leaderboard.inGameSize}`;
            UIRenderer.renderLeaderboard(topScores, UIElements.leaderboardList);
        });
    },

    async submitHighScore() {
        const initials = document.getElementById('player-initials').value.trim().toUpperCase();
        if (initials.length !== 3 || !/^[A-Z]{3}$/.test(initials)) {
            alert("Please enter exactly 3 letters.");
            return;
        }
        UIElements.submitScoreBtn.disabled = true;
        UIElements.submitScoreBtn.textContent = "Submitting...";
        
        let cabinetValue = 0;
        GameState.current.displayCabinet.forEach(item => {
            cabinetValue += (item.capturedValue || 0);
        });
        const totalScore = GameState.current.cash + cabinetValue;
        
        const scoreData = {
            initials: initials,
            score: totalScore,
            cash: GameState.current.cash,
            cabinetValue: cabinetValue,
            timestamp: new Date(),
            cabinet: GameState.current.displayCabinet
        };

        try {
            await addDoc(this.getLeaderboardCollection(), scoreData);
            const snapshot = await getDocs(this.getLeaderboardCollection());
            if (snapshot.docs.length > GameConfig.leaderboard.size) {
                const allScores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                allScores.sort((a, b) => b.score - a.score);
                const scoresToDelete = allScores.slice(GameConfig.leaderboard.size);
                for (const score of scoresToDelete) {
                    await deleteDoc(doc(db, 'artifacts', GameConfig.appId, 'public', 'data', 'leaderboard', score.id));
                }
            }
            GameLogger.addLogMessage(`High score of ${totalScore.toLocaleString()} submitted for ${initials}!`);
            await GameEnd.showGameOverScreen();
        } catch (error) {
            console.error("Error submitting high score: ", error);
            GameLogger.addLogMessage("Error: Could not submit high score.");
            await GameEnd.showGameOverScreen();
        } finally {
            UIElements.highScoreModal.classList.add('hidden');
            UIElements.submitScoreBtn.disabled = false;
            UIElements.submitScoreBtn.textContent = "Submit Score";
        }
    }
};
