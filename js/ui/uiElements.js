export const UIElements = {
    // Initialize after DOM is loaded
    init() {
        // Mobile specific elements
        this.mobileCash = document.getElementById('mobile-cash');
        this.mobileMainContent = document.getElementById('mobile-main-content');

        // Mobile Modals & Controls - REMOVED as their display logic is now part of tabs
        // this.mobileTravelModal = document.getElementById('mobile-travel-modal');
        // this.mobileTravelOptions = document.getElementById('mobile-travel-options');
        // this.closeMobileTravelModalBtn = document.getElementById('close-mobile-travel-modal-btn');
        
        // this.mobileLogModal = document.getElementById('mobile-log-modal');
        // this.mobileLogMessages = document.getElementById('mobile-log-messages');
        // this.closeMobileLogModalBtn = document.getElementById('close-mobile-log-modal-btn');

        // this.mobileCabinetModal = document.getElementById('mobile-cabinet-modal'); // This was for viewing
        // this.mobileCabinetList = document.getElementById('mobile-cabinet-list');
        // this.mobileCabinetPlaceholder = document.getElementById('mobile-cabinet-placeholder');
        // this.mobileManageCabinetBtn = document.getElementById('mobile-manage-cabinet-btn'); // Button inside the old mobile cabinet viewing modal
        // this.closeMobileCabinetModalBtn = document.getElementById('close-mobile-cabinet-modal-btn');

        // Stats (Legacy - some might still be used by core logic or modals indirectly, review later)
        this.cash = document.getElementById('cash'); // Legacy desktop cash
        this.days = document.getElementById('days'); // Legacy desktop days
        this.currentLocationName = document.getElementById('current-location-name'); // Legacy
        this.marketLocationName = document.getElementById('market-location-name'); // Legacy
        this.specialActionsContainer = document.getElementById('special-actions-container'); // Legacy

        // Tables (Legacy)
        this.marketItems = document.getElementById('market-items'); // Legacy
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
        this.displayCabinetList = document.getElementById('display-cabinet-list');         // <-- ADD THIS LINE (This was from a previous unrelated instruction, should be fine)
        this.displayCabinetPlaceholder = document.getElementById('display-cabinet-placeholder'); // <-- ADD THIS LINE (This was from a previous unrelated instruction, should be fine)
        this.cabinetModal = document.getElementById('cabinet-modal'); // This is the generic one for management - KEEP
        this.cabinetModalTitle = document.getElementById('cabinet-modal-title');
        this.cabinetModalMessage = document.getElementById('cabinet-modal-message');
        this.cabinetModalOptions = document.getElementById('cabinet-modal-options');
        this.cancelCabinetModalBtn = document.getElementById('cancel-cabinet-modal-btn');
        this.manageCabinetBtn = document.getElementById('manage-cabinet-btn'); // This is the legacy desktop manage button - KEEP for now
        this.viewCabinetModal = document.getElementById('view-cabinet-modal'); // For viewing other players' cabinets - KEEP
        this.viewCabinetList = document.getElementById('view-cabinet-list');
        this.closeViewCabinetBtn = document.getElementById('close-view-cabinet-btn');
        this.announcementModal = document.getElementById('announcement-modal');
    }
};
