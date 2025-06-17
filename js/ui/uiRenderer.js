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

/**
 * UIRenderer Module
 * Responsible for updating all visual aspects of the game interface based on the current GameState.
 * It populates UI elements with player stats, market data, inventory, travel options, logs, and cabinet displays.
 */
export const UIRenderer = {
    /**
     * Calls all individual render functions to refresh the entire game UI.
     * This is the main function to invoke when a full UI update is needed.
     * Includes a top-level try-catch for critical rendering failures.
     */
    renderAll() {
        try {
            this.renderPlayerStats();
            this.renderMarket();
            this.renderInventory();
            this.renderTravelOptions();
            this.renderLog();
            this.renderDisplayCabinet();
        } catch (error) {
            console.error("UIRenderer Error: Critical error in renderAll:", error);
            // Potentially show a generic error message to the user on the UI itself
            if (UIElements.cash) UIElements.cash.textContent = "Error";
            if (UIElements.marketItems) UIElements.marketItems.innerHTML = "<p>Error loading UI. Please refresh.</p>";
        }
    },

    /**
     * Renders player-specific statistics like cash, days remaining, and current location.
     * Updates UIElements.cash, UIElements.days, UIElements.currentLocationName, UIElements.marketLocationName.
     */
    renderPlayerStats() {
        try {
            if (!GameState.current) {
                console.warn("UIRenderer Warning: GameState.current not ready for renderPlayerStats.");
                return;
            }
            // Display cash, ensuring it's a number and formatted.
            if (UIElements.cash) UIElements.cash.textContent = `$${(GameState.current.cash ?? 0).toLocaleString()}`;
            // Display days remaining.
            if (UIElements.days) UIElements.days.textContent = GameState.current.daysRemaining ?? 'N/A';

            const location = GameState.getCurrentLocation();
            // Display current location name in multiple UI spots.
            if (location && location.name) {
                if (UIElements.currentLocationName) UIElements.currentLocationName.textContent = location.name;
                if (UIElements.marketLocationName) UIElements.marketLocationName.textContent = location.name;
            } else {
                if (UIElements.currentLocationName) UIElements.currentLocationName.textContent = "Unknown Location";
                if (UIElements.marketLocationName) UIElements.marketLocationName.textContent = "Unknown Location";
                console.warn("UIRenderer Warning: Current location not found or has no name.");
            }
        } catch (error) {
            console.error("UIRenderer Error: Failed to render player stats:", error);
        }
    },

    /**
     * Renders the leaderboard with player scores.
     * @param {Array<Object>} scores - Array of score objects (initials, score, id, cabinet).
     * @param {HTMLElement} targetElement - The DOM element where the leaderboard will be rendered.
     */
    renderLeaderboard(scores, targetElement) {
        try {
            if (!targetElement) {
                console.warn("UIRenderer Warning: Target element for leaderboard is missing.");
                return;
            }
            targetElement.innerHTML = ''; // Clear previous scores

            if (!Array.isArray(scores) || scores.length === 0) {
                targetElement.innerHTML = '<p class="text-gray-500 text-center">No high scores yet. Be the first!</p>';
                return;
            }

            // Create and append each score entry.
            scores.forEach((entry, index) => {
                // Validate each score entry.
                if (!entry || typeof entry.initials !== 'string' || typeof entry.score !== 'number' || typeof entry.id === 'undefined') {
                    console.warn("UIRenderer Warning: Invalid score entry found in leaderboard data:", entry);
                    return; // Skip this invalid entry
                }

                const div = document.createElement('div');
                div.className = 'flex justify-between items-center text-lg p-1 rounded';
                if (index === 0) div.classList.add('bg-amber-500/20'); // Highlight top score

                // Add a "Cabinet" button if the player has a saved cabinet.
                const cabinetButton = (entry.cabinet && Array.isArray(entry.cabinet) && entry.cabinet.length > 0)
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
        } catch (error) {
            console.error("UIRenderer Error: Failed to render leaderboard:", error);
            if (targetElement) targetElement.innerHTML = "<p>Error displaying leaderboard.</p>";
        }
    },

    /**
     * Renders the market items for the current location.
     * Displays cards available for purchase, their prices, supply, and buy controls.
     * Also renders special action buttons like "Buy Price Guide", "Trade-In", and "Buy Booster Pack".
     * Shows event indicators (e.g., card show, market flood) and price guide indicators.
     */
    renderMarket() {
        try {
            // Ensure necessary UI elements and game state components are available.
            if (!UIElements.marketItems || !UIElements.specialActionsContainer) {
                console.warn("UIRenderer Warning: Market items or special actions container missing.");
                return;
            }
            UIElements.marketItems.innerHTML = '';
            UIElements.specialActionsContainer.innerHTML = '';

            if (!GameState.current || !GameState.market || !GameConfig || !GameData) {
                 console.warn("UIRenderer Warning: GameState, GameConfig or GameData not fully ready for renderMarket.");
                 UIElements.marketItems.innerHTML = '<div class="p-4 text-center">Market data loading...</div>';
                 return;
            }

            const location = GameState.getCurrentLocation();
            // Validate current location data.
            if (!location || !location.id || typeof location.specialization !== 'string' || typeof location.boosterPrice !== 'number') {
                console.warn("UIRenderer Warning: Current location data is invalid or missing for renderMarket.");
                UIElements.marketItems.innerHTML = '<div class="p-4 text-center">Current location data unavailable.</div>';
                return;
            }
            const locationMarket = GameState.market[location.id];

            // Display store discount banner if active.
            const existingBanner = document.querySelector('.discount-banner');
            if (existingBanner) existingBanner.remove();
            if (GameState.current.storeDiscount > 0 && typeof GameState.current.storeDiscount === 'number') {
                const discountBanner = document.createElement('div');
                discountBanner.className = 'discount-banner bg-green-600 text-white p-2 rounded mb-4 text-center';
                discountBanner.textContent = `Store Discount Active: ${Math.round(GameState.current.storeDiscount)}% off all purchases!`;
                const marketSection = document.getElementById('market-section');
                if (marketSection) {
                    const headerDiv = marketSection.querySelector('.flex.justify-between.items-start.mb-3');
                    if (headerDiv) marketSection.insertBefore(discountBanner, headerDiv.nextSibling);
                    else marketSection.prepend(discountBanner);
                }
            }

            // Render "Buy Price Guide" button if not already owned.
            if (!GameState.current.hasPriceGuide) {
                const priceGuideCost = GameConfig.priceGuideCost ?? 500;
                const priceGuideBtn = document.createElement('button');
                priceGuideBtn.className = 'btn btn-secondary';
                priceGuideBtn.innerHTML = `Buy Price Guide <span class="font-bold ml-2">$${priceGuideCost}</span>`;
                priceGuideBtn.title = `Reveals if a card's current price is above or below its base value.`;
                priceGuideBtn.onclick = () => Trading.buyPriceGuide();
                UIElements.specialActionsContainer.appendChild(priceGuideBtn);
            }

            // Render "Trade-In" button if location has this specialization.
            if (location.specialization === 'trade_in') {
                const commonCount = GameState.current.inventory?.find(item => item.cardId === 'common_single')?.quantity || 0;
                const tradeInBtn = document.createElement('button');
                tradeInBtn.className = 'btn btn-secondary';
                tradeInBtn.innerHTML = `Trade 25 Commons <span class="font-bold ml-2">(Have: ${commonCount})</span>`;
                tradeInBtn.title = 'Trade 25 Common Singles for 1 random better card';
                tradeInBtn.disabled = commonCount < 25;
                tradeInBtn.onclick = () => Trading.executeTradeIn();
                UIElements.specialActionsContainer.appendChild(tradeInBtn);
            }

            // Render "Buy Booster Pack" button.
            const boosterPackBtn = document.createElement('button');
            boosterPackBtn.className = 'btn btn-special';
            const locationBoosterPrice = location.boosterPrice;
            boosterPackBtn.innerHTML = `Buy Booster Pack <span class="font-bold ml-2">$${locationBoosterPrice}</span>`;
            boosterPackBtn.title = 'Get 3-5 random cards. A high-risk, high-reward gamble!';

            const dailyLimit = GameConfig?.boosterPack?.dailyLimit ?? 1;
            // Disable button based on availability or daily purchase limit.
            if (locationMarket && !locationMarket.boosterAvailable) {
                boosterPackBtn.disabled = true;
                boosterPackBtn.textContent = 'Boosters Sold Out Today';
            } else if ((GameState.current.boosterPacksPurchasedToday ?? 0) >= dailyLimit) {
                boosterPackBtn.disabled = true;
                boosterPackBtn.textContent = `Daily Limit Reached (${dailyLimit})`;
            } else {
                boosterPackBtn.onclick = () => BoosterPacks.buyBoosterPack(locationBoosterPrice);
            }
            UIElements.specialActionsContainer.appendChild(boosterPackBtn);

            if (!locationMarket) {
                UIElements.marketItems.innerHTML = '<div class="p-4 text-center">Market data not available for this location.</div>';
                return;
            }
            if (!Array.isArray(GameData.tradableCards)) {
                console.warn("UIRenderer Warning: GameData.tradableCards is not an array.");
                UIElements.marketItems.innerHTML = '<div class="p-4 text-center">Tradable card data is missing.</div>';
                return;
            }

            // Iterate through tradable cards and render each market item.
            GameData.tradableCards.forEach(card => {
                // Validate card data.
                if (!card || !card.id || !card.name || typeof card.basePrice !== 'number' || typeof card.description !== 'string') {
                    console.warn("UIRenderer Warning: Invalid card data in GameData.tradableCards:", card);
                    return;
                }
                const marketInfo = locationMarket[card.id];
                // Validate market info for the card.
                if (!marketInfo || typeof marketInfo.price !== 'number' || typeof marketInfo.available !== 'number') {
                    console.warn(`UIRenderer Warning: Market info for ${card.name} incomplete or missing.`, marketInfo);
                    return;
                }

                // Add event indicators (star for card show, drop for market flood).
                let eventIndicator = '';
                if (Array.isArray(GameState.current.activeEvents)) {
                    const activeCardShow = GameState.current.activeEvents.find(e => e.type === 'card_show' && Array.isArray(e.affectedCards) && e.affectedCards.some(ac => ac.cardId === card.id));
                    const activeFlood = GameState.current.activeEvents.find(e => e.type === 'market_flood' && e.affectedCard === card.id);
                    if (activeCardShow) eventIndicator = '<span class="ml-2 text-yellow-400" title="Card Show Boost!">⭐</span>';
                    if (activeFlood) eventIndicator = '<span class="ml-2 text-blue-400" title="Market Flooded!">💧</span>';
                }

                // Add price guide indicators (arrow up/down if price guide owned).
                const priceColorClass = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
                const priceIndicatorHtml = GameState.current.hasPriceGuide ? (marketInfo.price > card.basePrice ? `<span class="ml-2 text-green-400" title="Price is above base value">▲</span>` : `<span class="ml-2 text-red-400" title="Price is below base value">▼</span>`) : '';

                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';

                // Populate card details, price, supply, quantity input, and action buttons.
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
        } catch (error) {
            console.error("UIRenderer Error: Failed to render market:", error);
            if (UIElements.marketItems) UIElements.marketItems.innerHTML = "<p>Error displaying market items.</p>";
        }
    },

    /**
     * Renders the player's current inventory.
     * Displays each card owned, quantity, average buy price, current market sell price, and sell controls.
     */
    renderInventory() {
        try {
            if (!UIElements.inventoryItems) {
                console.warn("UIRenderer Warning: Inventory items container missing.");
                return;
            }
            UIElements.inventoryItems.innerHTML = '';

            if (!GameState.current || !Array.isArray(GameState.current.inventory)) {
                console.warn("UIRenderer Warning: GameState.current.inventory not ready for renderInventory.");
                UIElements.inventoryItems.innerHTML = '<div class="p-4 text-center">Inventory data loading...</div>';
                return;
            }

            if (GameState.current.inventory.length === 0) {
                UIElements.inventoryItems.innerHTML = '<div class="p-4 text-center">Your portfolio is empty.</div>';
                return;
            }

            // Iterate through inventory items and render each.
            GameState.current.inventory.forEach(item => {
                // Validate inventory item and associated card data.
                if (!item || item.quantity <= 0 || !item.cardId) {
                     console.warn("UIRenderer Warning: Invalid item in inventory:", item);
                    return;
                }
                const card = GameState.getCardDetails(item.cardId);
                if (!card || !card.name || !card.id) {
                    console.warn(`UIRenderer Warning: Card details not found for inventory item cardId: ${item.cardId}`);
                    return;
                }

                // Determine current market sell price and average buy price for the item.
                const currentMarketPrice = GameState.market?.[GameState.current?.currentLocationId]?.[item.cardId]?.price || 0;
                const averageBuyPrice = (typeof item.totalCost === 'number' && item.quantity > 0) ? item.totalCost / item.quantity : 0;

                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'block md:table-row border-b border-gray-700 last:border-b-0 p-3 md:p-0';

                // Populate card name, quantity held, average buy price, current sell price, quantity input, and action buttons.
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
        } catch (error) {
            console.error("UIRenderer Error: Failed to render inventory:", error);
            if (UIElements.inventoryItems) UIElements.inventoryItems.innerHTML = "<p>Error displaying inventory.</p>";
        }
    },

    /**
     * Renders the travel options available to the player.
     * Dynamically creates buttons for each possible destination based on GameData.locations
     * and GameData.travelDurations. Also handles logic for "End Journey" button.
     */
    renderTravelOptions() {
        try {
            if (!UIElements.travelOptions) {
                console.warn("UIRenderer Warning: Travel options container missing.");
                return;
            }
            UIElements.travelOptions.innerHTML = '';

            // Validate necessary game state and data.
            if (!GameState.current || typeof GameState.current.daysRemaining !== 'number' || !GameState.current.currentLocationId) {
                console.warn("UIRenderer Warning: GameState not ready for renderTravelOptions.");
                return;
            }
            if (!GameData || !Array.isArray(GameData.locations) || !GameData.travelDurations) {
                console.warn("UIRenderer Warning: GameData (locations/travelDurations) not ready for renderTravelOptions.");
                return;
            }

            const daysLeft = GameState.current.daysRemaining;
            const currentLocationId = GameState.current.currentLocationId;

            // "End Journey" button is always an option, but especially prominent if days are low.
            const endGameBtn = document.createElement('button');
            endGameBtn.className = 'btn btn-danger w-full text-left';
            endGameBtn.textContent = 'End Your Journey';
            endGameBtn.title = 'Finish the game with your current cash and see your final score.';
            endGameBtn.onclick = () => GameEnd.forceEndGame();

            // Logic for displaying travel options based on days remaining.
            if (daysLeft <= 1) { // Only option is to end game if 1 or fewer days left.
                UIElements.travelOptions.appendChild(endGameBtn);
            } else if (daysLeft === 2) { // If 2 days left, can only travel to locations 1 day away.
                UIElements.travelOptions.appendChild(endGameBtn); // End game is still an option.
                GameData.locations.forEach(location => {
                    if (!location || !location.id || location.id === currentLocationId) return;
                    const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99; // Default high cost if undefined.
                    if (travelCost === 1) { // Only show 1-day trips.
                        const button = document.createElement('button');
                        button.className = 'btn btn-primary w-full text-left';
                        button.textContent = `${location.name || 'Unknown'} (${travelCost} day)`;
                        button.title = location.description || '';
                        button.onclick = () => Travel.travelTo(location.id);
                        UIElements.travelOptions.appendChild(button);
                    }
                });
            } else { // More than 2 days left, show all travel options.
                GameData.locations.forEach(location => {
                    if (!location || !location.id || location.id === currentLocationId) return;
                    const travelCost = GameData.travelDurations[currentLocationId]?.[location.id] || 99;
                    const button = document.createElement('button');
                    button.className = 'btn btn-primary w-full text-left';
                    button.textContent = `${location.name || 'Unknown'} (${travelCost} day${travelCost > 1 ? 's' : ''})`;
                    button.title = location.description || '';
                    button.onclick = () => Travel.travelTo(location.id);
                    UIElements.travelOptions.appendChild(button);
                });
                 // Add End Journey button as the last option if many days are left.
                UIElements.travelOptions.appendChild(document.createElement('hr')); // Visual separator
                UIElements.travelOptions.appendChild(endGameBtn);
            }
        } catch (error) {
            console.error("UIRenderer Error: Failed to render travel options:", error);
            if (UIElements.travelOptions) UIElements.travelOptions.innerHTML = "<p>Error displaying travel options.</p>";
        }
    },

    /**
     * Renders the game log messages.
     * Displays messages from `GameState.current.log`. Basic HTML sanitization is applied.
     */
    renderLog() {
        try {
            if (!UIElements.logMessages) {
                console.warn("UIRenderer Warning: Log messages container missing.");
                return;
            }
            if (GameState.current && Array.isArray(GameState.current.log)) {
                // Map log messages to HTML, sanitizing angle brackets to prevent HTML injection.
                UIElements.logMessages.innerHTML = GameState.current.log.map(msg =>
                    `<div class="log-message">${typeof msg === 'string' ? msg.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Invalid log message'}</div>`
                ).join('');
            } else {
                UIElements.logMessages.innerHTML = '';
                console.warn("UIRenderer Warning: GameState.current.log not ready or not an array.");
            }
        } catch (error) {
            console.error("UIRenderer Error: Failed to render log:", error);
            if(UIElements.logMessages) UIElements.logMessages.innerHTML = "<p>Error displaying logs.</p>";
        }
    },

    /**
     * Renders the player's display cabinet.
     * Shows visual representations of cards the player has chosen to display.
     */
    renderDisplayCabinet() {
        try {
            const cabinetListEl = UIElements.displayCabinetList;
            const placeholderEl = UIElements.displayCabinetPlaceholder;
            const manageBtn = UIElements.manageCabinetBtn;

            if (!cabinetListEl || !placeholderEl || !manageBtn) {
                console.warn("UIRenderer Warning: Display cabinet UI elements missing.");
                return;
            }
            cabinetListEl.innerHTML = ''; // Clear previous cabinet items.

            if (!GameState.current || !Array.isArray(GameState.current.displayCabinet)) {
                 console.warn("UIRenderer Warning: GameState.current.displayCabinet not ready for render.");
                 if (placeholderEl) {
                    cabinetListEl.appendChild(placeholderEl); // Show placeholder if data not ready.
                    placeholderEl.style.display = 'block';
                 }
                 manageBtn.style.display = 'none';
                 return;
            }

            // Display placeholder or cabinet items.
            if (GameState.current.displayCabinet.length === 0) {
                if (!cabinetListEl.contains(placeholderEl)) {
                     cabinetListEl.appendChild(placeholderEl);
                }
                placeholderEl.style.display = 'block'; // Show placeholder for empty cabinet.
                manageBtn.style.display = 'none';      // Hide manage button if cabinet is empty.
            } else {
                if (cabinetListEl.contains(placeholderEl)) {
                     placeholderEl.style.display = 'none'; // Hide placeholder if cabinet has items.
                }
                manageBtn.style.display = 'inline-block'; // Show manage button.
                // Iterate and render each cabinet item.
                GameState.current.displayCabinet.forEach(cabinetItem => {
                    if (!cabinetItem || typeof cabinetItem.capturedValue === 'undefined' || !cabinetItem.card) {
                        console.warn("UIRenderer Warning: Invalid item in display cabinet:", cabinetItem);
                        return;
                    }
                    const cardWrapper = document.createElement('div');
                    cardWrapper.className = 'flex flex-col items-center';

                    const cardVisual = CardVisuals.createCardVisual(cabinetItem);
                    if (cardVisual) {
                        cardWrapper.appendChild(cardVisual);
                    } else {
                        console.warn("UIRenderer Warning: Failed to create card visual for cabinet item:", cabinetItem);
                        const errorVisual = document.createElement('div');
                        errorVisual.textContent = 'Error';
                        errorVisual.className = 'w-24 h-32 border border-red-500 bg-gray-700 flex items-center justify-center text-xs';
                        cardWrapper.appendChild(errorVisual);
                    }

                    const valueDisplay = document.createElement('div');
                    valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
                    valueDisplay.textContent = `$${(cabinetItem.capturedValue || 0).toLocaleString()}`; // Display captured value.
                    cardWrapper.appendChild(valueDisplay);

                    cabinetListEl.appendChild(cardWrapper);
                });
            }
        } catch (error) {
            console.error("UIRenderer Error: Failed to render display cabinet:", error);
            if (UIElements.displayCabinetList) UIElements.displayCabinetList.innerHTML = "<p>Error displaying cabinet.</p>";
        }
    }
};
