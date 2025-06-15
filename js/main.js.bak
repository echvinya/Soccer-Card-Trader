import { auth } from './firebase/firebaseConfig.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { UIElements } from './ui/uiElements.js';
import { GameController } from './core/gameController.js';
import { Leaderboard } from './features/leaderboard.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI elements
    UIElements.init();
    
    // Setup Firebase authentication
    onAuthStateChanged(auth, user => {
        if (user) {
            GameController.setupEventHandlers();
            GameController.initializeGame();
            Leaderboard.listenForLeaderboardUpdates();
        } else {
            signInAnonymously(auth).catch(error => {
                console.error("Anonymous sign-in failed: ", error);
                document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center p-4">
                    <div class="max-w-2xl text-center p-8 rounded-lg bg-gray-800 border border-red-500">
                        <h1 class="text-3xl font-bold text-red-400 mb-4">Connection Error</h1>
                        <p class="text-lg mb-2">Could not connect to the game server.</p>
                        <p class="text-md text-gray-400 mb-6">This usually happens when the website's domain is not authorized or the API Key has referrer restrictions.</p>
                        <p class="mt-4 text-xs text-gray-500">Full error: ${error.message}</p>
                    </div>
                </div>`;
            });
        }
    });
});
