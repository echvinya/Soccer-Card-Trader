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
        this.renderInventory();
        this.renderTravelOptions();
        this.renderLog();
        this.renderDisplayCabinet();
    },

    renderPlayerStats() {
        UIElements.cash.textContent = `$${GameState.current.cash.toLocaleString()}`;
        UIElements.days.textContent = GameState.current.daysRemaining;
        const location = GameState.getCurrentLocation();
        UIElements.currentLocationName.textContent = location.name;
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

            let eventIndicator = '';
            const activeCardShow = GameState.current.activeEvents.find(e => e.type === 'card_show' && e.affectedCards.some(ac => ac.cardId === card.id));
            const activeFlood = GameState.current.activeEvents.find(e => e.type === 'market_flood' && e.affectedCard === card.id);
            if (activeCardShow) eventIndicator = '<span class="ml-2 text-yellow-400" title="Card Show Boost!">⭐</span>';
            if (activeFlood) eventIndicator = '<span class="ml-2 text-blue-400" title="Market Flooded!">💧</span>';

            const priceColorClass = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
            const priceIndicatorHtml = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? `<span class="ml-2 text-green-400" title="Price is above base value">▲</span>` : `<span class="ml-2 text-red-400" title="Price is below base value">▼</span>`) : '';

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-2 md:p-0'; // Adjusted padding for mobile view
            
            // Adding sm:p-2 for slightly larger padding on small screens beyond the smallest
            // Using p-1 for the smallest screens (mobile landscape)
            cardWrapper.innerHTML = `
                <div class="block md:table-cell align-middle p-1 sm:p-2">
                    <div class="font-bold">${card.name}${eventIndicator}</div>
                    <div class="text-xs text-gray-400 font-normal block mt-1">${card.description}</div>
                </div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Price: </span><span class="${priceColorClass}">$${marketInfo.price.toLocaleString()}</span>${priceIndicatorHtml}</div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Supply: </span>${marketInfo.available}</div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Quantity: </span><input type="number" id="buy-qty-${card.id}" min="1" max="${marketInfo.available}" value="1" class="w-14 sm:w-16 text-center text-xs sm:text-sm p-1"></div>
                <div class="block md:table-cell align-middle p-1 sm:p-2 mt-1 sm:mt-2 md:mt-0"><span class="font-semibold text-gray-400 md:hidden">Actions: </span><div class="inline-flex items-center gap-1 sm:gap-2"><button class="btn btn-success btn-compact text-xs sm:text-sm" title="Buy Quantity" data-card-id="${card.id}" data-action="buy-qty" ${marketInfo.available === 0 ? 'disabled' : ''}>$</button><button class="btn btn-success btn-compact text-xs sm:text-sm" title="Buy All" data-card-id="${card.id}" data-action="buy-all" ${marketInfo.available === 0 ? 'disabled' : ''}>All</button></div></div>
            `;
            UIElements.marketItems.appendChild(cardWrapper);
        });
    },

    renderInventory() {
        UIElements.inventoryItems.innerHTML = '';
        if (GameState.current.inventory.length === 0) {
            UIElements.inventoryItems.innerHTML = '<div class="p-4 text-center">Your portfolio is empty.</div>';
            return;
        }

        GameState.current.inventory.forEach(item => {
            if (item.quantity <= 0) return;
            const card = GameState.getCardDetails(item.cardId);
            const currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[item.cardId]?.price || 0;
            const averageBuyPrice = item.totalCost / item.quantity;

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-2 md:p-0'; // Adjusted padding for mobile view

            // Adding sm:p-2 for slightly larger padding on small screens beyond the smallest
            // Using p-1 for the smallest screens (mobile landscape)
            cardWrapper.innerHTML = `
                <div class="block md:table-cell align-middle p-1 sm:p-2"><div class="font-bold">${card.name}</div></div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Held: </span>${item.quantity}</div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Avg. Buy Price: </span>$${averageBuyPrice.toFixed(2)}</div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Current Sell Price: </span><span class="text-green-400">$${currentMarketPrice.toLocaleString()}</span></div>
                <div class="block md:table-cell align-middle p-1 sm:p-2"><span class="font-semibold text-gray-400 md:hidden">Quantity: </span><input type="number" id="sell-qty-${card.id}" min="1" max="${item.quantity}" value="1" class="w-14 sm:w-16 text-center text-xs sm:text-sm p-1"></div>
                <div class="block md:table-cell align-middle p-1 sm:p-2 mt-1 sm:mt-2 md:mt-0"><span class="font-semibold text-gray-400 md:hidden">Actions: </span><div class="inline-flex items-center gap-1 sm:gap-2"><button class="btn btn-danger btn-compact text-xs sm:text-sm" title="Sell Quantity" data-card-id="${card.id}" data-action="sell-qty">$</button><button class="btn btn-danger btn-compact text-xs sm:text-sm" title="Sell All" data-card-id="${card.id}" data-action="sell-all">All</button></div></div>
            `;
            UIElements.inventoryItems.appendChild(cardWrapper);
        });
    },

    renderTravelOptions() {
        UIElements.travelOptions.innerHTML = '';
        const daysLeft = GameState.current.daysRemaining;
        const currentLocationId = GameState.current.currentLocationId;

        const endGameBtn = document.createElement('button');
        endGameBtn.className = 'btn btn-danger w-full text-left';
        endGameBtn.textContent = 'End Your Journey';
        endGameBtn.title = 'Finish the game with your current cash and see your final score.';
        endGameBtn.onclick = () => GameEnd.forceEndGame();

        if (daysLeft <= 1) {
            UIElements.travelOptions.appendChild(endGameBtn);
        } else if (daysLeft === 2) {
            UIElements.travelOptions.appendChild(endGameBtn);
            GameData.locations.forEach(location => {
                if (location.id === currentLocationId) return;
                const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99;
                if (travelCost === 1) {
                    const button = document.createElement('button');
                    button.className = 'btn btn-primary w-full text-left';
                    button.textContent = `${location.name} (${travelCost} day)`;
                    button.title = location.description;
                    button.onclick = () => Travel.travelTo(location.id);
                    UIElements.travelOptions.appendChild(button);
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
                UIElements.travelOptions.appendChild(button);
            });
        }
    },

    renderLog() {
        UIElements.logMessages.innerHTML = GameState.current.log.map(msg => `<div class="log-message">${msg}</div>`).join('');
    },

    renderDisplayCabinet() {
        // Update the count badge on the "View Display Cabinet" button
        if (UIElements.cabinetCountBadge) {
            UIElements.cabinetCountBadge.textContent = `${GameState.current.displayCabinet.length}/${GameConfig.displayCabinetLimit}`;
        }

        // Show or hide the "Manage Cabinet" button based on whether the cabinet has items
        if (UIElements.manageCabinetBtn) {
            if (GameState.current.displayCabinet.length === 0) {
                UIElements.manageCabinetBtn.style.display = 'none';
            } else {
                UIElements.manageCabinetBtn.style.display = 'inline-block';
            }
        }

        // The actual rendering of cabinet items is now done when the modal is opened.
        // See Cabinet.showPlayerCabinetModal() - though we might rename it or make a new one
        // for the player's own cabinet vs. viewing others.
    }
};
