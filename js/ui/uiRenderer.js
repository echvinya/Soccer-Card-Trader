import { GameState } from '../core/gameState.js';
import { GameData } from '../config/gameData.js';
import { GameConfig } from '../config/gameConfig.js';
import { UIElements } from './uiElements.js';
import { CardVisuals } from './cardVisuals.js';
import { Trading } from '../features/trading.js';
import { BoosterPacks } from '../features/boosterPacks.js';
import { Travel } from '../features/travel.js';
import { Cabinet } from '../features/cabinet.js';
import { GameEnd } from '../features/gameEnd.js';

export const UIRenderer = {
    renderAll() {
        this.renderPlayerStats();
        this.renderMarket();
        this.renderTravelOptions();
        this.renderLog();
        this.renderDisplayCabinet();
    },

    renderPlayerStats() {
        UIElements.cash.textContent = `$${GameState.current.cash.toLocaleString()}`;
        UIElements.days.textContent = GameState.current.daysRemaining;
        const location = GameState.getCurrentLocation();
        UIElements.marketLocationName.textContent = location.name;
    },

    renderLeaderboard(scores, targetElement) {
        targetElement.innerHTML = '';
        if (scores.length === 0) {
            targetElement.innerHTML = '<p class="text-gray-500 text-center">No high scores yet. Be the first!</p>';
            return;
        }
        scores.forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center text-lg p-1 rounded';
            if (index === 0) div.classList.add('bg-amber-500/20');
            
            const cabinetButton = (entry.cabinet && entry.cabinet.length > 0) 
                ? `<button class="btn btn-secondary btn-sm text-xs" data-score-id="${entry.id}" data-action="view-cabinet">Cabinet</button>`
                : '';

            div.innerHTML = `
                <div class="flex items-center">
                    <span class="font-bold mr-3">${index + 1}. ${entry.initials}</span>
                    ${cabinetButton}
                </div>
                <span class="text-green-400 font-semibold">$${entry.score.toLocaleString()}</span>`;
            targetElement.appendChild(div);
        });
    },

    renderMarket() {
        // Clear previous content
        UIElements.marketItems.innerHTML = '';
        UIElements.specialActionsContainer.innerHTML = '';

        // --- FIX: RESTORED BANNER AND SPECIAL ACTIONS LOGIC ---
        const location = GameState.getCurrentLocation();
        const locationMarket = GameState.market[GameState.current.currentLocationId];
        
        const existingBanner = document.querySelector('.discount-banner');
        if (existingBanner) existingBanner.remove();

        if (GameState.current.storeDiscount > 0) {
            const discountBanner = document.createElement('div');
            discountBanner.className = 'discount-banner bg-green-600 text-white p-2 rounded mb-4 text-center';
            discountBanner.textContent = `Store Discount Active: ${Math.round(GameState.current.storeDiscount)}% off all purchases!`;
            const marketSection = document.getElementById('market-section');
            const headerDiv = marketSection.querySelector('.flex.justify-between.items-start.mb-3');
            marketSection.insertBefore(discountBanner, headerDiv.nextSibling);
        }

        if (!GameState.current.hasPriceGuide) {
            const priceGuideBtn = document.createElement('button');
            priceGuideBtn.className = 'btn btn-secondary';
            priceGuideBtn.innerHTML = `Buy Price Guide <span class="font-bold ml-2">$${GameConfig.priceGuideCost}</span>`;
            priceGuideBtn.title = `Reveals if a card's current price is above or below its base value.`;
            priceGuideBtn.onclick = () => Trading.buyPriceGuide();
            UIElements.specialActionsContainer.appendChild(priceGuideBtn);
        }

        if (location.specialization === 'trade_in') {
            const commonCount = GameState.current.inventory.find(item => item.cardId === 'common_single')?.quantity || 0;
            const tradeInBtn = document.createElement('button');
            tradeInBtn.className = 'btn btn-secondary';
            tradeInBtn.innerHTML = `Trade 25 Commons <span class="font-bold ml-2">(Have: ${commonCount})</span>`;
            tradeInBtn.title = 'Trade 25 Common Singles for 1 random better card';
            tradeInBtn.disabled = commonCount < 25;
            tradeInBtn.onclick = () => Trading.executeTradeIn();
            UIElements.specialActionsContainer.appendChild(tradeInBtn);
        }

        const boosterPackBtn = document.createElement('button');
        boosterPackBtn.className = 'btn btn-special';
        const locationBoosterPrice = location.boosterPrice;
        boosterPackBtn.innerHTML = `Buy Booster Pack <span class="font-bold ml-2">$${locationBoosterPrice}</span>`;
        boosterPackBtn.title = 'Get 3-5 random cards. A high-risk, high-reward gamble!';
        
        if (locationMarket && !locationMarket.boosterAvailable) {
            boosterPackBtn.disabled = true;
            boosterPackBtn.textContent = 'Boosters Sold Out Today';
        } else if (GameState.current.boosterPacksPurchasedToday >= GameConfig.boosterPack.dailyLimit) {
            boosterPackBtn.disabled = true;
            boosterPackBtn.textContent = `Daily Limit Reached (${GameConfig.boosterPack.dailyLimit})`;
        } else {
            boosterPackBtn.onclick = () => BoosterPacks.buyBoosterPack(locationBoosterPrice);
        }
        UIElements.specialActionsContainer.appendChild(boosterPackBtn);
        // --- END OF RESTORED LOGIC ---

        if (!locationMarket) {
            UIElements.marketItems.innerHTML = '<div class="p-4 text-center">Market data not available.</div>';
            return;
        }

        GameData.tradableCards.forEach(card => {
            const marketInfo = locationMarket[card.id];
            if (!marketInfo) return;

            const inventoryItem = GameState.current.inventory.find(item => item.cardId === card.id);
            const heldQuantity = inventoryItem ? inventoryItem.quantity : 0;

            let eventIndicator = '';
            const activeCardShow = GameState.current.activeEvents.find(e => e.type === 'card_show' && e.affectedCards.some(ac => ac.cardId === card.id));
            const activeFlood = GameState.current.activeEvents.find(e => e.type === 'market_flood' && e.affectedCard === card.id);
            if (activeCardShow) eventIndicator = '<span class="ml-2 text-yellow-400" title="Card Show Boost!">⭐</span>';
            if (activeFlood) eventIndicator = '<span class="ml-2 text-blue-400" title="Market Flooded!">💧</span>';

            const priceColorClass = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
            const priceIndicatorHtml = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? `<span class="ml-2 text-green-400" title="Price is above base value">▲</span>` : `<span class="ml-2 text-red-400" title="Price is below base value">▼</span>`) : '';

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';
            
            cardWrapper.innerHTML = `
                <div class="block md:table-cell align-middle p-1 md:p-2">
                    <div class="font-bold">${card.name}${eventIndicator}</div>
                    <div class="text-xs text-gray-400 font-normal block mt-1">${card.description}</div>
                </div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mobile-inline"><span class="font-semibold text-gray-400 md:hidden">Price: </span><span class="${priceColorClass}">$${marketInfo.price.toLocaleString()}</span>${priceIndicatorHtml}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mobile-inline"><span class="font-semibold text-gray-400 md:hidden">Supply: </span>${marketInfo.available}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mobile-inline"><span class="font-semibold text-gray-400 md:hidden">Held: </span>${heldQuantity}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mt-2 md:mt-0"><span class="font-semibold text-gray-400 md:hidden">Actions: </span><div class="inline-flex items-center gap-2"><button class="btn btn-success btn-compact" title="Buy" data-card-id="${card.id}" data-action="buy" ${marketInfo.available === 0 ? 'disabled' : ''}>Buy</button><button class="btn btn-danger btn-compact" title="Sell" data-card-id="${card.id}" data-action="sell" ${heldQuantity === 0 ? 'disabled' : ''}>Sell</button></div></div>
            `;
            UIElements.marketItems.appendChild(cardWrapper);
        });
    },

    renderTravelOptions() {
        const travelOptions = [UIElements.travelOptions, UIElements.desktopTravelOptions];
        travelOptions.forEach(el => el.innerHTML = '');

        const daysLeft = GameState.current.daysRemaining;
        const currentLocationId = GameState.current.currentLocationId;

        const endGameBtn = document.createElement('button');
        endGameBtn.className = 'btn btn-danger w-full text-left';
        endGameBtn.textContent = 'End Your Journey';
        endGameBtn.title = 'Finish the game with your current cash and see your final score.';
        endGameBtn.onclick = () => GameEnd.forceEndGame();

        if (daysLeft <= 1) {
            travelOptions.forEach(el => el.appendChild(endGameBtn.cloneNode(true)));
        } else if (daysLeft === 2) {
            travelOptions.forEach(el => el.appendChild(endGameBtn.cloneNode(true)));
            GameData.locations.forEach(location => {
                if (location.id === currentLocationId) return;
                const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99;
                if (travelCost === 1) {
                    const button = document.createElement('button');
                    button.className = 'btn btn-primary w-full text-left';
                    button.textContent = `${location.name} (${travelCost} day)`;
                    button.title = location.description;
                    button.onclick = () => Travel.travelTo(location.id);
                    travelOptions.forEach(el => el.appendChild(button.cloneNode(true)));
                }
            });
        } else {
            GameData.locations.forEach(location => {
                if (location.id === currentLocationId) return;
                const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99;
                const button = document.createElement('button');
                button.className = 'btn btn-primary w-full text-left';
                button.textContent = `${location.name} (${travelCost} day${travelCost > 1 ? 's' : ''})`;
                button.title = location.description;
                button.onclick = () => Travel.travelTo(location.id);
                travelOptions.forEach(el => el.appendChild(button.cloneNode(true)));
            });
        }
    },

    renderGlobalLeaderboard() {
        this.renderLeaderboard(GameState.leaderboardScores, UIElements.globalLeaderboardList);
    },

    renderLog() {
        UIElements.logMessages.innerHTML = GameState.current.log.map(msg => `<div class="log-message">${msg}</div>`).join('');
    },

    renderDisplayCabinet() {
        const cabinetListEl = UIElements.displayCabinetList;
        const placeholderEl = UIElements.displayCabinetPlaceholder;
        cabinetListEl.innerHTML = '';

        if (GameState.current.displayCabinet.length === 0) {
            if (placeholderEl && !cabinetListEl.contains(placeholderEl)) {
                 cabinetListEl.appendChild(placeholderEl);
            }
            if(placeholderEl) placeholderEl.style.display = 'block';
            UIElements.manageCabinetBtn.style.display = 'none';
        } else {
            if (placeholderEl && cabinetListEl.contains(placeholderEl)) {
                 placeholderEl.style.display = 'none';
            }
            UIElements.manageCabinetBtn.style.display = 'inline-block';
            GameState.current.displayCabinet.forEach(cabinetItem => {
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'flex flex-col items-center';
                
                // Always use CardVisuals.createCardVisual as it now handles all states:
                // - Placeholder for isGrading
                // - Slab for isGraded
                // - Normal display otherwise
                console.log('UIRenderer: Rendering cabinet item:', cabinetItem.card.name, 'isGrading:', cabinetItem.isGrading, 'isGraded:', cabinetItem.isGraded); // Log for item state
                const cardElement = CardVisuals.createCardVisual(cabinetItem);
                cardWrapper.appendChild(cardElement);

                // Value display logic (remains the same, applied below the card visual)
                if (cabinetItem.isGraded) {
                    const valueDisplay = document.createElement('div');
                    valueDisplay.className = 'text-sm font-semibold text-yellow-400 mt-1'; // Changed to yellow for graded
                    valueDisplay.textContent = `$${cabinetItem.valueAfterGrading !== null && cabinetItem.valueAfterGrading !== undefined ? cabinetItem.valueAfterGrading : (cabinetItem.capturedValue || 0)}`;
                    cardWrapper.appendChild(valueDisplay);
                } else if (!cabinetItem.isGrading) {
                    // Only show captured value if not grading and not graded.
                    // The placeholder for 'isGrading' from createCardVisual already includes days left.
                    const valueDisplay = document.createElement('div');
                    valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
                    valueDisplay.textContent = `$${cabinetItem.capturedValue || 0}`;
                    cardWrapper.appendChild(valueDisplay);
                }
                
                cabinetListEl.appendChild(cardWrapper);
            });
        }
    },

    showGradingCompleteModal(gradedCabinetItem) {
        if (!gradedCabinetItem || !gradedCabinetItem.card) {
            console.error("Invalid card data for grading complete modal", gradedCabinetItem);
            return;
        }

        const card = gradedCabinetItem.card; // This is the card definition

        UIElements.gradingCompleteCardName.textContent = card.name;
        UIElements.gradingCompleteGradeName.textContent = gradedCabinetItem.gradeName;
        UIElements.gradingCompleteGradeValue.textContent = gradedCabinetItem.gradeValue;

        // Populate the Old Value
        UIElements.gradingCompleteOldValue.textContent = `$${(gradedCabinetItem.capturedValue || 0).toLocaleString()}`; // <<< ADD THIS LINE

        // Populate the New Value (already there)
        UIElements.gradingCompleteNewValue.textContent = `$${(gradedCabinetItem.valueAfterGrading || 0).toLocaleString()}`;

        UIElements.gradingCompleteCardVisualArea.innerHTML = ''; // Clear previous visual
        // Create and append the card visual using the same structure as in displayCabinet
        // cabinetItem for createCardVisual expects the card definition under a .card property,
        // and layers/numbering if applicable. gradedCabinetItem already has this structure.
        const cardVisualElement = CardVisuals.createCardVisual(gradedCabinetItem);
        UIElements.gradingCompleteCardVisualArea.appendChild(cardVisualElement);

        // Potentially add slab visual to cardVisualElement here if needed in modal specifically,
        // or ensure createCardVisual handles it if the card isGraded.
        // For now, createCardVisual will just show the card image.
        // Step 9 will focus on making the main cabinet visual "slabbed".

        UIElements.gradingCompleteModal.classList.remove('hidden');

        // Event listener for the close button (should only be added once or managed carefully)
        // A simple way is to replace the button with a clone to remove old listeners, then add new.
        const oldBtn = UIElements.closeGradingCompleteModalBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        UIElements.closeGradingCompleteModalBtn = newBtn; // Re-assign in UIElements if you want to keep the reference updated, or just use newBtn here.

        newBtn.onclick = () => {
            UIElements.gradingCompleteModal.classList.add('hidden');
            // Potentially trigger a UIRenderer.renderAll() if changes need to be reflected immediately elsewhere,
            // though GameController will likely call renderAll after the modal is closed.
        };
    }
};
