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
        // Update new mobile cash display
        if (UIElements.mobileCash) {
            UIElements.mobileCash.textContent = `$${GameState.current.cash.toLocaleString()}`;
        }

        // Update legacy desktop elements if they exist (for compatibility if some logic still uses them)
        // These will eventually be phased out or handled differently.
        if (UIElements.cash) {
            UIElements.cash.textContent = `$${GameState.current.cash.toLocaleString()}`;
        }
        if (UIElements.days) {
            UIElements.days.textContent = GameState.current.daysRemaining;
        }
        const location = GameState.getCurrentLocation();
        if (location) {
            if (UIElements.currentLocationName) {
                UIElements.currentLocationName.textContent = location.name;
            }
            if (UIElements.marketLocationName) { // This is also a legacy element now
                UIElements.marketLocationName.textContent = location.name;
            }
        }
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
            cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';
            
            cardWrapper.innerHTML = `
                <div class="block md:table-cell align-middle p-1 md:p-2">
                    <div class="font-bold">${card.name}${eventIndicator}</div>
                    <div class="text-xs text-gray-400 font-normal block mt-1">${card.description}</div>
                </div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Price: </span><span class="${priceColorClass}">$${marketInfo.price.toLocaleString()}</span>${priceIndicatorHtml}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Supply: </span>${marketInfo.available}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Quantity: </span><input type="number" id="buy-qty-${card.id}" min="1" max="${marketInfo.available}" value="1" class="w-16 text-center"></div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mt-2 md:mt-0"><span class="font-semibold text-gray-400 md:hidden">Actions: </span><div class="inline-flex items-center gap-2"><button class="btn btn-success btn-compact" title="Buy Quantity" data-card-id="${card.id}" data-action="buy-qty" ${marketInfo.available === 0 ? 'disabled' : ''}>$</button><button class="btn btn-success btn-compact" title="Buy All" data-card-id="${card.id}" data-action="buy-all" ${marketInfo.available === 0 ? 'disabled' : ''}>All</button></div></div>
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
            cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';

            cardWrapper.innerHTML = `
                <div class="block md:table-cell align-middle p-1 md:p-2"><div class="font-bold">${card.name}</div></div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Held: </span>${item.quantity}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Avg. Buy Price: </span>$${averageBuyPrice.toFixed(2)}</div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Current Sell Price: </span><span class="text-green-400">$${currentMarketPrice.toLocaleString()}</span></div>
                <div class="block md:table-cell align-middle p-1 md:p-2"><span class="font-semibold text-gray-400 md:hidden">Quantity: </span><input type="number" id="sell-qty-${card.id}" min="1" max="${item.quantity}" value="1" class="w-16 text-center"></div>
                <div class="block md:table-cell align-middle p-1 md:p-2 mt-2 md:mt-0"><span class="font-semibold text-gray-400 md:hidden">Actions: </span><div class="inline-flex items-center gap-2"><button class="btn btn-danger btn-compact" title="Sell Quantity" data-card-id="${card.id}" data-action="sell-qty">$</button><button class="btn btn-danger btn-compact" title="Sell All" data-card-id="${card.id}" data-action="sell-all">All</button></div></div>
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
    },

    // --- Mobile View Renderers ---
    renderMobileMarketView(containerElement) {
        containerElement.innerHTML = ''; // Clear container
        const location = GameState.getCurrentLocation();
        const locationMarket = GameState.market[GameState.current.currentLocationId];
        const itemsPerPage = 5; // Show 5 items per page

        if (!location || !locationMarket) {
            containerElement.innerHTML = '<p class="text-center text-gray-400">Market data not available.</p>';
            return;
        }

        // Header for market view
        const header = document.createElement('div');
        header.className = 'mb-3';
        header.innerHTML = `<h2 class="text-xl font-semibold text-center text-amber-400">${location.name} Market</h2>`;
        // TODO: Add special actions like booster pack button here, styled for mobile.
        containerElement.appendChild(header);

        const tradableCardsInMarket = GameData.tradableCards.filter(card => locationMarket[card.id]);

        const page = GameState.current.mobileMarketPage || 0;
        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToShow = tradableCardsInMarket.slice(startIndex, endIndex);

        if (itemsToShow.length === 0 && page === 0) {
            containerElement.innerHTML += '<p class="text-center text-gray-400">No items in this market currently.</p>';
        }

        itemsToShow.forEach(card => {
            const marketInfo = locationMarket[card.id];
            if (!marketInfo) return;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-gray-800 p-3 rounded-md mb-2 shadow'; // Tailwind classes for list item

            let eventIndicator = ''; // Placeholder for event indicators
            const priceColorClass = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
            const priceIndicatorHtml = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? `<span class="ml-1 text-xs text-green-400">▲</span>` : `<span class="ml-1 text-xs text-red-400">▼</span>`) : '';

            itemDiv.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <h3 class="text-md font-semibold text-sky-400">${card.name} ${eventIndicator}</h3>
                    <span class="text-xs text-gray-400">Supply: ${marketInfo.available}</span>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-sm ${priceColorClass}">Price: $${marketInfo.price.toLocaleString()}${priceIndicatorHtml}</p>
                    <div class="flex items-center space-x-2">
                        <input type="number" id="mobile-buy-qty-${card.id}" min="1" max="${marketInfo.available}" value="1" class="w-14 text-center bg-gray-700 text-white rounded p-1 text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-red-500">
                        <button data-action="buy-mobile" data-card-id="${card.id}" class="btn-compact btn-success text-xs py-1 px-2" ${marketInfo.available === 0 ? 'disabled' : ''}>Buy</button>
                        <button data-action="buy-all-mobile" data-card-id="${card.id}" data-available="${marketInfo.available}" class="btn-compact btn-success text-xs py-1 px-2" ${marketInfo.available === 0 ? 'disabled' : ''}>All</button>
                    </div>
                </div>
            `;
            // Add event listeners
            const buyButton = itemDiv.querySelector('button[data-action="buy-mobile"]');
            if (buyButton) {
                buyButton.addEventListener('click', () => {
                    const quantityInput = document.getElementById(`mobile-buy-qty-${card.id}`);
                    const quantity = parseInt(quantityInput.value, 10);
                    if (quantity > 0) {
                        // Trading.buyItem will be created in step 6
                        Trading.buyItem(card.id, quantity, marketInfo.price);
                        this.renderMobileMarketView(containerElement);
                        UIRenderer.renderPlayerStats();
                    }
                });
            }

            const buyAllButton = itemDiv.querySelector('button[data-action="buy-all-mobile"]');
            if (buyAllButton) {
                buyAllButton.addEventListener('click', () => {
                    const quantity = parseInt(buyAllButton.dataset.available, 10);
                    if (quantity > 0) {
                        // Trading.buyItem will be created in step 6
                        Trading.buyItem(card.id, quantity, marketInfo.price);
                        this.renderMobileMarketView(containerElement);
                        UIRenderer.renderPlayerStats();
                    }
                });
            }
            containerElement.appendChild(itemDiv);
        });

        // Pagination
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'flex justify-between items-center mt-4';

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'btn btn-secondary text-xs py-1 px-3';
        if (page === 0) prevButton.disabled = true;
        prevButton.onclick = () => {
            if (GameState.current.mobileMarketPage > 0) {
                GameState.current.mobileMarketPage--;
                this.renderMobileMarketView(containerElement);
            }
        };

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'btn btn-secondary text-xs py-1 px-3';
        if (endIndex >= tradableCardsInMarket.length) nextButton.disabled = true;
        nextButton.onclick = () => {
            if (endIndex < tradableCardsInMarket.length) {
                GameState.current.mobileMarketPage++;
                this.renderMobileMarketView(containerElement);
            }
        };

        paginationDiv.appendChild(prevButton);
        paginationDiv.appendChild(document.createTextNode(`Page ${page + 1} of ${Math.ceil(tradableCardsInMarket.length / itemsPerPage)}`));
        paginationDiv.appendChild(nextButton);
        containerElement.appendChild(paginationDiv);

        // Re-attach special action buttons like booster packs if applicable
        this.renderMobileSpecialActions(containerElement.querySelector('h2').parentElement); // Pass header div
    },

    renderMobileSpecialActions(headerDiv) {
        // Simplified special actions for mobile market view
        // This is a placeholder, actual actions might differ or be more integrated.
        const location = GameState.getCurrentLocation();
        const locationMarket = GameState.market[GameState.current.currentLocationId];

        // Clear any existing special actions first to prevent duplication on re-render
        let specialActionsContainer = headerDiv.querySelector('.mobile-special-actions');
        if (specialActionsContainer) {
            specialActionsContainer.innerHTML = ''; // Clear existing buttons
        } else {
            specialActionsContainer = document.createElement('div');
            specialActionsContainer.className = 'mobile-special-actions mt-3 flex flex-col items-stretch gap-2'; // Full width buttons
            headerDiv.appendChild(specialActionsContainer); // Append once
        }

        // 1. Price Guide Button
        if (!GameState.current.hasPriceGuide) {
            const priceGuideBtn = document.createElement('button');
            priceGuideBtn.className = 'btn btn-secondary w-full text-sm py-2';
            priceGuideBtn.innerHTML = `Buy Price Guide <span class="font-bold ml-2">$${GameConfig.priceGuideCost}</span>`;
            priceGuideBtn.title = `Reveals if a card's current price is above or below its base value.`;
            priceGuideBtn.onclick = () => {
                Trading.buyPriceGuide();
                // Re-render market view to hide button and update prices if guide was bought
                this.renderMobileMarketView(UIElements.mobileMainContent);
                UIRenderer.renderPlayerStats();
            };
            specialActionsContainer.appendChild(priceGuideBtn);
        }

        // 2. Trade In Common Cards Button
        if (location.specialization === 'trade_in') {
            const commonCount = GameState.current.inventory.find(item => item.cardId === 'common_single')?.quantity || 0;
            const tradeInBtn = document.createElement('button');
            tradeInBtn.className = 'btn btn-secondary w-full text-sm py-2';
            tradeInBtn.innerHTML = `Trade 25 Commons <span class="font-bold ml-2">(Have: ${commonCount})</span>`;
            tradeInBtn.title = 'Trade 25 Common Singles for 1 random better card';
            tradeInBtn.disabled = commonCount < 25;
            tradeInBtn.onclick = () => {
                Trading.executeTradeIn();
                // Re-render market view to update common count
                this.renderMobileMarketView(UIElements.mobileMainContent);
                UIRenderer.renderPlayerStats(); // Cash might not change but inventory does
            };
            specialActionsContainer.appendChild(tradeInBtn);
        }

        // 3. Booster Pack Button (existing logic)
        if (locationMarket && location.boosterPrice) {
            const boosterPackBtn = document.createElement('button');
            boosterPackBtn.className = 'btn btn-special w-full text-sm py-2';
            boosterPackBtn.innerHTML = `Buy Booster <span class="font-bold ml-1">$${location.boosterPrice}</span>`;

            if (!locationMarket.boosterAvailable) {
                boosterPackBtn.disabled = true;
                boosterPackBtn.textContent = 'Boosters Sold Out';
            } else if (GameState.current.boosterPacksPurchasedToday >= GameConfig.boosterPack.dailyLimit) {
                boosterPackBtn.disabled = true;
                boosterPackBtn.textContent = `Daily Limit Reached`;
            } else {
                boosterPackBtn.onclick = () => {
                    BoosterPacks.buyBoosterPack(location.boosterPrice);
                    this.renderMobileMarketView(UIElements.mobileMainContent);
                    UIRenderer.renderPlayerStats();
                };
            }
            specialActionsContainer.appendChild(boosterPackBtn);
        }

        // Only append if it wasn't there before and has children now
        // This check is now redundant as we ensure it's appended if new, or cleared if existing.
        // if (!headerDiv.contains(specialActionsContainer) && specialActionsContainer.hasChildNodes()) {
        //    headerDiv.appendChild(specialActionsContainer);
        //}

    },

    renderMobileTravelTabView(containerElement) {
        containerElement.innerHTML = ''; // Clear container

        const header = document.createElement('div');
        header.className = 'p-4 text-center'; // Combined header and content area
        header.innerHTML = `<h2 class="text-2xl font-semibold text-amber-400 mb-4">Travel To:</h2>`;

        const travelOptionsContainer = document.createElement('div');
        travelOptionsContainer.id = 'mobile-travel-options-direct'; // New ID for direct rendering
        travelOptionsContainer.className = 'space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto px-4 pb-4'; // Adjusted max-height, assuming header/nav height

        const daysLeft = GameState.current.daysRemaining;
        const currentLocationId = GameState.current.currentLocationId;

        // Helper function to create travel buttons, adapted from renderMobileTravelModal
        const createTravelButtonDirect = (location, travelCost) => {
            const button = document.createElement('button');
            button.className = 'btn btn-primary w-full text-left py-2 px-3 text-sm';
            button.textContent = `${location.name} (${travelCost} day${travelCost > 1 ? 's' : ''})`;
            button.title = location.description;
            button.onclick = async () => {
                await Travel.travelTo(location.id);
                // Post-travel navigation to market is handled within Travel.travelTo
            };
            return button;
        };

        // "End Journey" Button logic from renderMobileTravelModal
        if (daysLeft <= GameConfig.maxTravelCost + 1 || GameData.locations.every(loc => GameState.current.daysRemaining < (GameData.travelDurations[currentLocationId]?.[loc.id] || 99))) {
            const endGameBtn = document.createElement('button');
            endGameBtn.className = 'btn btn-danger w-full text-left py-2 px-3 text-sm';
            endGameBtn.textContent = 'End Your Journey';
            endGameBtn.title = 'Finish the game with your current cash and see your final score.';
            endGameBtn.onclick = async () => {
                await GameEnd.forceEndGame();
                // Game over modal will be shown by GameEnd logic
            };
            travelOptionsContainer.appendChild(endGameBtn);
        }

        // Location buttons logic from renderMobileTravelModal
        let validDestinations = 0;
        GameData.locations.forEach(location => {
            if (location.id === currentLocationId) return;
            const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99;
            if (daysLeft >= travelCost) {
                travelOptionsContainer.appendChild(createTravelButtonDirect(location, travelCost));
                validDestinations++;
            }
        });

        if (travelOptionsContainer.children.length === 0) {
             travelOptionsContainer.innerHTML = '<p class="text-gray-400 text-center">No travel options available with current days remaining or it is time to end your journey.</p>';
        }

        header.appendChild(travelOptionsContainer);
        containerElement.appendChild(header);
    },

    renderMobileLogTabView(containerElement) {
        containerElement.innerHTML = ''; // Clear container

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'p-4 h-full flex flex-col'; // Allow flex column for scrolling content

        const header = document.createElement('h2');
        header.className = 'text-2xl font-semibold text-center text-amber-400 mb-4 flex-shrink-0';
        header.textContent = 'Game Log';
        contentWrapper.appendChild(header);

        const logMessagesContainer = document.createElement('div');
        logMessagesContainer.id = 'mobile-log-messages-direct'; // New ID
        // Tailwind classes for styling log messages, similar to what was in UIElements.mobileLogMessages modal part
        logMessagesContainer.className = 'space-y-1 text-xs text-left bg-gray-900 p-2 rounded flex-grow overflow-y-auto max-h-[calc(100vh-180px)]'; // Adjusted max-height

        if (GameState.current.log.length === 0) {
            logMessagesContainer.innerHTML = '<p class="text-gray-500 text-center">No log entries yet.</p>';
        } else {
            logMessagesContainer.innerHTML = GameState.current.log
                .map(msg => `<div class="py-1 px-1.5 border-b border-gray-700 last:border-b-0">${msg}</div>`)
                .join('');
        }

        contentWrapper.appendChild(logMessagesContainer);
        containerElement.appendChild(contentWrapper);
    },

    renderMobileCabinetTabView(containerElement) {
        containerElement.innerHTML = ''; // Clear container

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'p-4 h-full flex flex-col';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center mb-4 flex-shrink-0';

        const title = document.createElement('h2');
        title.className = 'text-2xl font-semibold text-cyan-400';
        title.textContent = 'Display Cabinet';
        headerDiv.appendChild(title);

        const manageCabinetBtnDirect = document.createElement('button');
        manageCabinetBtnDirect.id = 'mobile-manage-cabinet-direct-btn';
        manageCabinetBtnDirect.className = 'btn btn-secondary btn-compact text-xs';
        manageCabinetBtnDirect.textContent = 'Manage';
        manageCabinetBtnDirect.onclick = () => {
            Cabinet.showManageCabinetModal(); // This opens UIElements.cabinetModal for management
        };
        headerDiv.appendChild(manageCabinetBtnDirect);
        contentWrapper.appendChild(headerDiv);

        const cabinetListContainer = document.createElement('div');
        cabinetListContainer.id = 'mobile-cabinet-list-direct'; // New ID
        // Similar styling to UIElements.mobileCabinetList from the modal
        cabinetListContainer.className = 'grid grid-cols-2 gap-3 flex-grow overflow-y-auto bg-gray-900 p-2 rounded max-h-[calc(100vh-220px)]';

        const cabinetItems = GameState.current.displayCabinet;

        if (cabinetItems.length === 0) {
            cabinetListContainer.innerHTML = '<p class="text-gray-500 text-center col-span-2 py-4">Your cabinet is empty.</p>';
            manageCabinetBtnDirect.classList.add('hidden'); // Hide manage if empty
        } else {
            manageCabinetBtnDirect.classList.remove('hidden'); // Show manage if not empty
            cabinetItems.forEach(cabinetItem => {
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'flex flex-col items-center bg-gray-700 p-2 rounded shadow';
                const cardVisual = CardVisuals.createCardVisual(cabinetItem, true); // true for compact
                cardWrapper.appendChild(cardVisual);
                const valueDisplay = document.createElement('div');
                valueDisplay.className = 'text-xs font-semibold text-green-300 mt-1';
                valueDisplay.textContent = `$${(cabinetItem.capturedValue || 0).toLocaleString()}`;
                cardWrapper.appendChild(valueDisplay);
                cabinetListContainer.appendChild(cardWrapper);
            });
        }

        contentWrapper.appendChild(cabinetListContainer);
        containerElement.appendChild(contentWrapper);
    },

    renderMobileInventoryView(containerElement) {
        containerElement.innerHTML = ''; // Clear container
        const itemsPerPage = 5;
        const page = GameState.current.mobileInventoryPage || 0;

        // Header for inventory view
        const header = document.createElement('div');
        header.className = 'mb-3';
        header.innerHTML = `<h2 class="text-xl font-semibold text-center text-amber-400">Your Portfolio</h2>`;
        containerElement.appendChild(header);

        const ownedItems = GameState.current.inventory.filter(item => item.quantity > 0);

        if (ownedItems.length === 0) {
            containerElement.innerHTML += '<p class="text-center text-gray-400">Your portfolio is empty. Buy some cards!</p>';
            return;
        }

        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToShow = ownedItems.slice(startIndex, endIndex);

        itemsToShow.forEach(item => {
            const card = GameState.getCardDetails(item.cardId);
            if (!card) return;

            const currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[item.cardId]?.price || 0;
            const averageBuyPrice = item.totalCost > 0 && item.quantity > 0 ? (item.totalCost / item.quantity) : 0;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'bg-gray-800 p-3 rounded-md mb-2 shadow';

            itemDiv.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <h3 class="text-md font-semibold text-sky-400">${card.name}</h3>
                    <span class="text-xs text-gray-400">Held: ${item.quantity}</span>
                </div>
                <p class="text-xs text-gray-500 mb-1">Avg. Buy: $${averageBuyPrice.toFixed(2)} | Current Sell: $${currentMarketPrice.toLocaleString()}</p>
                <div class="flex justify-between items-center mt-1">
                    <div></div> <!-- Spacer -->
                    <div class="flex items-center space-x-2">
                        <input type="number" id="mobile-sell-qty-${card.id}" min="1" max="${item.quantity}" value="1" class="w-14 text-center bg-gray-700 text-white rounded p-1 text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-red-500">
                        <button data-action="sell-mobile" data-card-id="${card.id}" class="btn-compact btn-danger text-xs py-1 px-2">Sell</button>
                        <button data-action="sell-all-mobile" data-card-id="${card.id}" data-quantity="${item.quantity}" class="btn-compact btn-danger text-xs py-1 px-2">All</button>
                    </div>
                </div>
            `;

            const sellButton = itemDiv.querySelector('button[data-action="sell-mobile"]');
            if (sellButton) {
                sellButton.addEventListener('click', () => {
                    const quantityInput = document.getElementById(`mobile-sell-qty-${card.id}`);
                    const quantity = parseInt(quantityInput.value, 10);
                    if (quantity > 0) {
                        // Trading.sellItem will be created in step 6
                        Trading.sellItem(card.id, quantity, currentMarketPrice);
                        this.renderMobileInventoryView(containerElement);
                        UIRenderer.renderPlayerStats();
                    }
                });
            }

            const sellAllButton = itemDiv.querySelector('button[data-action="sell-all-mobile"]');
            if (sellAllButton) {
                sellAllButton.addEventListener('click', () => {
                    const quantity = parseInt(sellAllButton.dataset.quantity, 10);
                    if (quantity > 0) {
                         // Trading.sellItem will be created in step 6
                        Trading.sellItem(card.id, quantity, currentMarketPrice);
                        this.renderMobileInventoryView(containerElement);
                        UIRenderer.renderPlayerStats();
                    }
                });
            }
            containerElement.appendChild(itemDiv);
        });

        // Pagination
        if (ownedItems.length > itemsPerPage) {
            const paginationDiv = document.createElement('div');
            paginationDiv.className = 'flex justify-between items-center mt-4';

            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.className = 'btn btn-secondary text-xs py-1 px-3';
            if (page === 0) prevButton.disabled = true;
            prevButton.onclick = () => {
                if (GameState.current.mobileInventoryPage > 0) {
                    GameState.current.mobileInventoryPage--;
                    this.renderMobileInventoryView(containerElement);
                }
            };

            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.className = 'btn btn-secondary text-xs py-1 px-3';
            if (endIndex >= ownedItems.length) nextButton.disabled = true;
            nextButton.onclick = () => {
                if (endIndex < ownedItems.length) {
                    GameState.current.mobileInventoryPage++;
                    this.renderMobileInventoryView(containerElement);
                }
            };

            paginationDiv.appendChild(prevButton);
            paginationDiv.appendChild(document.createTextNode(`Page ${page + 1} of ${Math.ceil(ownedItems.length / itemsPerPage)}`));
            paginationDiv.appendChild(nextButton);
            containerElement.appendChild(paginationDiv);
        }
    },

    // renderMobileTravelModal() function removed
    // renderMobileLogModal() function removed
    // renderMobileCabinetModal() function removed
};
