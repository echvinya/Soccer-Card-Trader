export const UIElements = {
    // Initialize after DOM is loaded
    init() {
        // Stats
        this.cash = document.getElementById('cash');
        this.days = document.getElementById('days');
        this.currentLocationName = document.getElementById('current-location-name');
        this.marketLocationName = document.getElementById('market-location-name');
        this.specialActionsContainer = document.getElementById('special-actions-container');
        
        // Tables
        this.marketItems = document.getElementById('market-items');
        this.inventoryItems = document.getElementById('inventory-items');
        this.travelOptions = document.getElementById('travel-options');
        
        // Other UI
        this.logMessages = document.getElementById('log-messages');
        this.restartGameBtn = document.getElementById('restart-game-btn');
        this.helpTextToggle = document.getElementById('help-text-toggle');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.inGameLeaderboardTitle = document.getElementById('in-game-leaderboard-title');
        
        // Modals
        this.gameOverModal = document.getElementById('game-over-modal');
        this.finalScore = document.getElementById('final-score');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.gameOverLeaderboardList = document.getElementById('game-over-leaderboard-list');
        this.boosterPackModal = document.getElementById('booster-pack-modal');
        this.packSummaryArea = document.getElementById('pack-summary-area');
        this.closePackModalBtn = document.getElementById('close-pack-modal-btn');
        this.eventModal = document.getElementById('event-modal');
        this.closeEventModalBtn = document.getElementById('close-event-modal-btn');
        this.highScoreModal = document.getElementById('high-score-modal');
        this.submitScoreBtn = document.getElementById('submit-score-btn');
        
        // Cabinet
        this.cabinetModal = document.getElementById('cabinet-modal');
        this.cabinetModalTitle = document.getElementById('cabinet-modal-title');
        this.cabinetModalMessage = document.getElementById('cabinet-modal-message');
        this.cabinetModalOptions = document.getElementById('cabinet-modal-options');
        this.cancelCabinetModalBtn = document.getElementById('cancel-cabinet-modal-btn');
        this.manageCabinetBtn = document.getElementById('manage-cabinet-btn');
        this.viewCabinetModal = document.getElementById('view-cabinet-modal');
        this.viewCabinetList = document.getElementById('view-cabinet-list');
        this.closeViewCabinetBtn = document.getElementById('close-view-cabinet-btn');
        this.announcementModal = document.getElementById('announcement-modal');
    }
};
