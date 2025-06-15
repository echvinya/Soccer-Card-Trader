// js/main.js

import { auth } from './firebase/firebaseConfig.js';
import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { GameController } from './core/gameController.js';
import { Leaderboard } from './features/leaderboard.js';
import { UIElements } from './ui/uiElements.js'; // <-- Import UIElements

// This function will run once the HTML document is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    // This is the perfect place to initialize our UI Elements
    UIElements.init();

    // Now that the elements are loaded, we can start the app authentication
    startApp();
});


// This function handles Firebase auth and starts the game logic
function startApp() {
    onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in anonymously.
            console.log("User is signed in:", user.uid);
            
            // Initialize the game state and render the UI
            GameController.initializeGame();

            // Setup all the button and input event handlers
            GameController.setupEventHandlers();
            
            // Start listening for real-time leaderboard updates
            Leaderboard.listenForLeaderboardUpdates();
            
        } else {
            // User is signed out. Attempt to sign in.
            console.log("User is signed out. Attempting anonymous sign-in...");
            signInAnonymously(auth).catch(error => {
                console.error("Anonymous sign-in failed: ", error);
                
                // Display a user-friendly error message on the screen
                document.body.innerHTML = `
                    <div class="min-h-screen flex items-center justify-center p-4">
                        <div class="max-w-2xl text-center p-8 rounded-lg bg-gray-800 border border-red-500">
                            <h1 class="text-3xl font-bold text-red-400 mb-4">Connection Error</h1>
                            <p class="text-lg mb-2">Could not connect to the game server.</p>
                            <p class="text-md text-gray-400 mb-6">This can happen if the website's domain is not authorized in the Firebase console or due to other API key restrictions.</p>
                            <p class="mt-4 text-xs text-gray-500">Full error: ${error.message}</p>
                        </div>
                    </div>`;
            });
        }
    });
}
