export const UIElements = {
    // Initialize after DOM is loaded
    init() {
        // Stats
        this.cash = document.getElementById('cash');
        this.days = document.getElementById('days');
        this.marketLocationName = document.getElementById('market-location-name');
        this.specialActionsContainer = document.getElementById('special-actions-container');
        
        // Tables
        this.marketItems = document.getElementById('market-items');
        this.travelOptions = document.getElementById('travel-options');
        
        // Other UI
        this.logMessages = document.getElementById('log-messages');
        this.helpTextToggle = document.getElementById('help-text-toggle');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.inGameLeaderboardTitle = document.getElementById('in-game-leaderboard-title');
        
        // Buttons
        this.travelBtn = document.getElementById('travel-btn');
        this.displayCabinetBtn = document.getElementById('display-cabinet-btn');

        // Modals
        this.buyModal = document.getElementById('buy-modal');
        this.buyModalTitle = document.getElementById('buy-modal-title');
        this.buyModalCash = document.getElementById('buy-modal-cash');
        this.buyModalCardName = document.getElementById('buy-modal-card-name');
        this.buyModalCardPrice = document.getElementById('buy-modal-card-price');
        this.buyQuantity = document.getElementById('buy-quantity');
        this.buyPlusBtn = document.getElementById('buy-plus-btn');
        this.buyMinusBtn = document.getElementById('buy-minus-btn');
        this.buyAllBtn = document.getElementById('buy-all-btn');
        this.buyModalTotalPrice = document.getElementById('buy-modal-total-price');
        this.buyConfirmBtn = document.getElementById('buy-confirm-btn');
        this.buyCancelBtn = document.getElementById('buy-cancel-btn');

        this.sellModal = document.getElementById('sell-modal');
        this.sellModalTitle = document.getElementById('sell-modal-title');
        this.sellModalCash = document.getElementById('sell-modal-cash');
        this.sellModalCardName = document.getElementById('sell-modal-card-name');
        this.sellModalAvgBuyPrice = document.getElementById('sell-modal-avg-buy-price');
        this.sellModalCurrentSellPrice = document.getElementById('sell-modal-current-sell-price');
        this.sellQuantity = document.getElementById('sell-quantity');
        this.sellPlusBtn = document.getElementById('sell-plus-btn');
        this.sellMinusBtn = document.getElementById('sell-minus-btn');
        this.sellAllBtn = document.getElementById('sell-all-btn');
        this.sellModalTotalPrice = document.getElementById('sell-modal-total-price');
        this.sellConfirmBtn = document.getElementById('sell-confirm-btn');
        this.sellCancelBtn = document.getElementById('sell-cancel-btn');

        this.travelModal = document.getElementById('travel-modal');
        this.travelCancelBtn = document.getElementById('travel-cancel-btn');

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
        this.displayCabinetList = document.getElementById('display-cabinet-list');
        this.displayCabinetPlaceholder = document.getElementById('display-cabinet-placeholder');
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

        // Add these new modal elements
        this.gradingCompleteModal = document.getElementById('grading-complete-modal');
        this.gradingCompleteTitle = document.getElementById('grading-complete-title');
        this.gradingCompleteCardVisualArea = document.getElementById('grading-complete-card-visual-area');
        this.gradingCompleteCardName = document.getElementById('grading-complete-card-name');
        this.gradingCompleteGradeName = document.getElementById('grading-complete-grade-name');
        this.gradingCompleteGradeValue = document.getElementById('grading-complete-grade-value');
        this.gradingCompleteOldValue = document.getElementById('grading-complete-old-value');
        this.gradingCompleteNewValue = document.getElementById('grading-complete-new-value');
        this.closeGradingCompleteModalBtn = document.getElementById('close-grading-complete-modal-btn');
    }
};
