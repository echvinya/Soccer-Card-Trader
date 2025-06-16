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
    // Clear previous market items and special actions
    UIElements.marketItems.innerHTML = '';
    UIElements.specialActionsContainer.innerHTML = '';

    const location = GameState.getCurrentLocation();
    const locationMarket = GameState.market[GameState.current.currentLocationId];

    if (!locationMarket) {
        UIElements.marketItems.innerHTML = '<div class="p-4 text-center">Market data not available.</div>';
        return;
    }

    // --- START: RE-ADDED BUTTON LOGIC ---
    // This entire block was missing and has been restored.

    // Logic for Price Guide Button 
    if (!GameState.current.hasPriceGuide) {
        const priceGuideBtn = document.createElement('button');
        priceGuideBtn.className = 'btn btn-secondary';
        priceGuideBtn.innerHTML = `Buy Price Guide <span class="font-bold ml-2">$${GameConfig.priceGuideCost}</span>`;
        priceGuideBtn.title = `Reveals if a card's current price is above or below its base value.`;
        priceGuideBtn.onclick = () => Trading.buyPriceGuide();
        UIElements.specialActionsContainer.appendChild(priceGuideBtn);
    }

    // Logic for Trade-In Button 
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

    // Logic for Booster Pack Button 
    const boosterPackBtn = document.createElement('button');
    boosterPackBtn.className = 'btn btn-special';
    const locationBoosterPrice = location.boosterPrice;
    boosterPackBtn.innerHTML = `Buy Booster Pack <span class="font-bold ml-2">$${locationBoosterPrice}</span>`;

    if (location.specialization === 'rookies') {
        boosterPackBtn.title = 'Get 3-5 random cards with higher chance of rookies!';
    } else if (location.specialization === 'mystery') {
        boosterPackBtn.title = 'Mystery pack: Guaranteed to contain at least one rare card!';
    } else {
        boosterPackBtn.title = 'Get 3-5 random cards. A high-risk, high-reward gamble!';
    }
    
    if (!locationMarket.boosterAvailable) {
        boosterPackBtn.disabled = true;
        boosterPackBtn.textContent = 'Boosters Sold Out Today';
    } else if (GameState.current.boosterPacksPurchasedToday >= GameConfig.boosterPack.dailyLimit) {
        boosterPackBtn.disabled = true;
        boosterPackBtn.textContent = `Daily Limit Reached (${GameConfig.boosterPack.dailyLimit})`;
    } else {
        boosterPackBtn.onclick = () => BoosterPacks.buyBoosterPack(locationBoosterPrice);
    }
    UIElements.specialActionsContainer.appendChild(boosterPackBtn);

    // --- END: RE-ADDED BUTTON LOGIC ---


    // This is the existing logic for rendering the market items as cards.
    GameData.tradableCards.forEach(card => {
        const marketInfo = locationMarket[card.id];
        if (!marketInfo) return;

        const priceColorClass = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
        const priceIndicatorHtml = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? `<span class="ml-2 text-green-400" title="Price is above base value">▲</span>` : `<span class="ml-2 text-red-400" title="Price is below base value">▼</span>`) : '';

        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';
        
        cardWrapper.innerHTML = `
            <div class="block md:table-cell align-middle p-1 md:p-2"><div class="font-bold">${card.name}</div><div class="text-xs text-gray-400 font-normal block md:hidden mt-1">${card.description}</div></div>
            <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Price: </span><span class="${priceColorClass}">$${marketInfo.price.toLocaleString()}</span>${priceIndicatorHtml}</div>
            <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Supply: </span>${marketInfo.available}</div>
            <div class="block md:table-cell align-middle p-1 md:p-2 mt-2 md:mt-0">
                <div class="flex items-center justify-between md:justify-start gap-3">
                    <input type="number" id="buy-qty-${card.id}" min="1" max="${marketInfo.available}" value="1" class="w-16 text-center">
                    <div class="flex items-center gap-2"><button class="btn btn-success btn-compact" title="Buy Quantity" data-card-id="${card.id}" data-action="buy-qty" ${marketInfo.available === 0 ? 'disabled' : ''}>Buy</button><button class="btn btn-success btn-compact" title="Buy All" data-card-id="${card.id}" data-action="buy-all" ${marketInfo.available === 0 ? 'disabled' : ''}>All</button></div>
                </div>
            </div>
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
            if(item.quantity <= 0) return;
            const card = GameState.getCardDetails(item.cardId);
            const currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[item.cardId]?.price || 0;
            const averageBuyPrice = item.totalCost / item.quantity;

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';

            cardWrapper.innerHTML = `
                <div class="block md:table-cell align-middle p-1 md:p-2"><div class="font-bold">${card.name}</div></div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Held: </span>${item.quantity}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Avg. Buy Price: </span>$${averageBuyPrice.toFixed(2)}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Current Sell Price: </span><span class="text-green-400">$${currentMarketPrice.toLocaleString()}</span></div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mt-2 md:mt-0">
                    <div class="flex items-center justify-between md:justify-start gap-3">
                        <input type="number" id="sell-qty-${card.id}" min="1" max="${item.quantity}" value="1" class="w-16 text-center">
                        <div class="flex items-center gap-2"><button class="btn btn-danger btn-compact" title="Sell Quantity" data-card-id="${card.id}" data-action="sell-qty">$</button><button class="btn btn-danger btn-compact" title="Sell All" data-card-id="${card.id}" data-action="sell-all">All</button></div>
                    </div>
                </div>
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
                
                const cardVisual = CardVisuals.createCardVisual(cabinetItem);
                cardWrapper.appendChild(cardVisual);
                
                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
                valueDisplay.textContent = `$${cabinetItem.capturedValue || 0}`;
                cardWrapper.appendChild(valueDisplay);
                
                cabinetListEl.appendChild(cardWrapper);
            });
        }
    }
};
