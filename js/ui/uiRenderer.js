import { GameState } from '../core/gameState.js';
import { GameData } from '../config/gameData.js';
import { GameConfig } from '../config/gameConfig.js';
import { UIElements } from './uiElements.js';
import { CardVisuals } from './cardVisuals.js';
import { Trading } from '../features/trading.js';
import { BoosterPacks } from '../features/boosterPacks.js';
import { Travel } from '../features/travel.js';
import { Cabinet } from '../features/cabinet.js';
import { GameEnd } from '../features/gameEnd.js'

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
        UIElements.marketItems.innerHTML = '';
        UIElements.specialActionsContainer.innerHTML = '';
        
        const existingBanner = document.querySelector('.discount-banner');
        if (existingBanner) existingBanner.remove();
        
        if (GameState.current.storeDiscount > 0) {
            const discountBanner = document.createElement('div');
            discountBanner.className = 'discount-banner bg-green-600 text-white p-2 rounded mb-4 text-center';
            discountBanner.textContent = `Store Discount Active: ${Math.round(GameState.current.storeDiscount)}% off all purchases!`;
            
            const marketSection = document.getElementById('market-section');
            const headerDiv = marketSection.querySelector('.flex.justify-between.items-start.mb-3');
            if (headerDiv && headerDiv.nextSibling) {
                marketSection.insertBefore(discountBanner, headerDiv.nextSibling);
            } else {
                marketSection.prepend(discountBanner);
            }
        }
        
        const location = GameState.getCurrentLocation();
        const locationMarket = GameState.market[GameState.current.currentLocationId];
        if (!locationMarket) {
            UIElements.marketItems.innerHTML = '<tr><td colspan="5" class="table-cell text-center py-4">Market data not available.</td></tr>';
            return;
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

        GameData.tradableCards.forEach(card => {
            const marketInfo = locationMarket[card.id];
            if (!marketInfo) return;

            let eventIndicator = '';
            const activeCardShow = GameState.current.activeEvents.find(e => 
                e.type === 'card_show' && 
                e.affectedCards.some(ac => ac.cardId === card.id)
            );
            const activeFlood = GameState.current.activeEvents.find(e => 
                e.type === 'market_flood' && 
                e.affectedCard === card.id
            );
            
            if (activeCardShow) {
                eventIndicator = '<span class="ml-2 text-yellow-400" title="Card Show Boost!">⭐</span>';
            } else if (activeFlood) {
                eventIndicator = '<span class="ml-2 text-blue-400" title="Market Flooded!">💧</span>';
            }

            let priceIndicatorHtml = '';
            if (GameState.current.hasPriceGuide) {
                if (marketInfo.price > card.basePrice) priceIndicatorHtml = `<span class="ml-2 text-green-400" title="Price is above base value">▲</span>`;
                else if (marketInfo.price < card.basePrice) priceIndicatorHtml = `<span class="ml-2 text-red-400" title="Price is below base value">▼</span>`;
            }
            const priceColorClass = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
            
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700';
            
            tr.innerHTML = `
                <td class="table-cell">
                    <div class="font-medium">${card.name}${eventIndicator}</div>
                    <div class="text-xs text-gray-400">${card.description}</div>
                </td>
                <td class="table-cell"><div class="flex items-center"><span class="font-semibold ${priceColorClass}">$${marketInfo.price.toLocaleString()}</span>${priceIndicatorHtml}</div></td>
                <td class="table-cell">${marketInfo.available}</td>
                <td class="table-cell"><input type="number" id="buy-qty-${card.id}" min="1" max="${marketInfo.available}" value="1"></td>
                <td class="table-cell">
                    <div class="flex items-center gap-2">
                        <button class="btn btn-success btn-compact" title="Buy Quantity" data-card-id="${card.id}" data-action="buy-qty" ${marketInfo.available === 0 ? 'disabled' : ''}>$</button>
                        <button class="btn btn-success btn-compact" title="Buy All" data-card-id="${card.id}" data-action="buy-all" ${marketInfo.available === 0 ? 'disabled' : ''}>A</button>
                    </div>
                </td>`;
            UIElements.marketItems.appendChild(tr);
        });
    },

    renderInventory() {
        UIElements.inventoryItems.innerHTML = '';
        if (GameState.current.inventory.length === 0) {
            UIElements.inventoryItems.innerHTML = '<tr><td colspan="6" class="table-cell text-center py-4">Your portfolio is empty.</td></tr>';
            return;
        }
        GameState.current.inventory.forEach(item => {
            const card = GameState.getCardDetails(item.cardId);
            const currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[item.cardId]?.price || 0;
            const averageBuyPrice = item.quantity > 0 ? (item.totalCost / item.quantity) : 0;

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-700';
            tr.innerHTML = `
                <td class="table-cell"><div class="font-medium">${card.name}</div></td>
                <td class="table-cell">${item.quantity}</td>
                <td class="table-cell">$${averageBuyPrice.toFixed(2)}</td>
                <td class="table-cell font-semibold text-green-400">$${currentMarketPrice.toLocaleString()}</td>
                <td class="table-cell"><input type="number" id="sell-qty-${card.id}" min="1" max="${item.quantity}" value="1"></td>
                <td class="table-cell">
                    <div class="flex items-center gap-2">
                        <button class="btn btn-danger btn-compact" title="Sell Quantity" data-card-id="${card.id}" data-action="sell-qty">$</button>
                        <button class="btn btn-danger btn-compact" title="Sell All" data-card-id="${card.id}" data-action="sell-all">A</button>
                    </div>
                </td>`;
            UIElements.inventoryItems.appendChild(tr);
        });
    },

renderTravelOptions() {
        UIElements.travelOptions.innerHTML = ''; //  Clear existing options first
        const daysLeft = GameState.current.daysRemaining; //  Get the current days remaining
        const currentLocationId = GameState.current.currentLocationId; //  Get the current location

        // Create the "End Game" button to be used in the conditions below
        const endGameBtn = document.createElement('button');
        endGameBtn.className = 'btn btn-danger w-full text-left'; // Use danger style for emphasis
        endGameBtn.textContent = 'End Your Journey';
        endGameBtn.title = 'Finish the game with your current cash and see your final score.';
        endGameBtn.onclick = () => GameEnd.forceEndGame();

        if (daysLeft <= 1) {
            // Case 1: 1 day or less left, only show the "End Game" button
            UIElements.travelOptions.appendChild(endGameBtn);
        } else if (daysLeft === 2) {
            // Case 2: Exactly 2 days left, show "End Game" and 1-day travel options
            UIElements.travelOptions.appendChild(endGameBtn);

            GameData.locations.forEach(location => { // 
                if (location.id === currentLocationId) return; // 
                const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99; // 
                
                // Only show locations that are 1 day away
                if (travelCost === 1) {
                    const button = document.createElement('button'); // 
                    button.className = 'btn btn-primary w-full text-left'; // 
                    button.textContent = `${location.name} (${travelCost} day)`; // 
                    button.title = location.description; // 
                    button.onclick = () => Travel.travelTo(location.id); // 
                    UIElements.travelOptions.appendChild(button); // 
                }
            });
        } else {
            // Case 3: More than 2 days left, show all normal travel options
            GameData.locations.forEach(location => { // 
                if (location.id === currentLocationId) return; // 
                const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99; // 
                const button = document.createElement('button'); // 
                button.className = 'btn btn-primary w-full text-left'; // 
                button.textContent = `${location.name} (${travelCost} day${travelCost > 1 ? 's' : ''})`; // 
                button.title = location.description; // 
                button.onclick = () => Travel.travelTo(location.id); // 
                UIElements.travelOptions.appendChild(button); // 
            });
        }
    },

    renderLog() {
        UIElements.logMessages.innerHTML = GameState.current.log.map(msg => `<div class="log-message">${msg}</div>`).join('');
    },

    renderDisplayCabinet() {
        const cabinetListEl = document.getElementById('display-cabinet-list');
        const placeholderEl = document.getElementById('display-cabinet-placeholder');
        cabinetListEl.innerHTML = '';

        if (GameState.current.displayCabinet.length === 0) {
            if (!cabinetListEl.contains(placeholderEl)) cabinetListEl.appendChild(placeholderEl);
            placeholderEl.style.display = 'block';
            UIElements.manageCabinetBtn.style.display = 'none';
        } else {
            if (cabinetListEl.contains(placeholderEl)) placeholderEl.style.display = 'none';
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
