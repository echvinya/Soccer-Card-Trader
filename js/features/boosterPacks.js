import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';
import { Cabinet } from './cabinet.js';

/**
 * Selects a hidden ungraded condition for a card based on configured probabilities.
 * @returns {string} The ID of the selected condition (e.g., 'Pristine', 'VeryGood').
 */
function selectUngradedCondition() {
    const conditions = GameConfig.grading.ungradedConditions;
    if (!conditions || conditions.length === 0) {
        console.error("Grading Error: ungradedConditions not defined in GameConfig or is empty.");
        return 'Good'; // Fallback to a default condition ID
    }

    let randomNumber = Math.random();
    let cumulativeProbability = 0;
    for (const condition of conditions) {
        cumulativeProbability += (condition.probability || 0); // Default probability to 0 if not defined
        if (randomNumber <= cumulativeProbability) {
            return condition.id;
        }
    }
    // Fallback to the last condition if probabilities don't sum to 1 or due to floating point issues.
    return conditions[conditions.length - 1].id;
}

/**
 * Creates a unique card instance object for a pack-pulled card.
 * @param {Object} baseCardData - The base card data from GameData.cards.
 * @returns {Object} A new unique card instance object.
 */
function createUniqueCardInstance(baseCardData) {
    if (!baseCardData || !baseCardData.id) {
        console.error("Card Creation Error: Invalid baseCardData provided.", baseCardData);
        // Return a placeholder or throw an error, depending on desired strictness
        return null;
    }

    const instanceId = crypto.randomUUID();
    let packPullValue = 0;

    const valueSource = GameConfig.grading?.defaultPackPullValueSource || 'basePrice';
    if (valueSource === 'basePrice' && typeof baseCardData.basePrice === 'number') {
        packPullValue = baseCardData.basePrice;
    } else {
        // Fallback or alternative logic if marketPriceAtPullTime was desired and implemented
        packPullValue = baseCardData.basePrice || 0;
        if (valueSource !== 'basePrice') {
            console.warn(`Grading Warning: defaultPackPullValueSource is '${valueSource}', but only 'basePrice' is currently directly supported here. Falling back to basePrice.`);
        }
    }

    const hiddenUngradedCondition = selectUngradedCondition();

    return {
        instanceId: instanceId,
        cardId: baseCardData.id,
        baseCard: { ...baseCardData }, // Store a copy of the base card data for reference
        quantity: 1, // Unique instances always have quantity 1
        packPullValue: packPullValue,
        hiddenUngradedCondition: hiddenUngradedCondition,
        grade: null, // Starts as ungraded
        // imageCombo could be relevant if instance visuals differ beyond base card art + grade.
        // For now, CardVisuals handles this based on baseCard, numbering, layers.
    };
}


/**
 * BoosterPacks Module
 * Handles the functionality related to buying and opening booster packs.
 * This includes checking purchase eligibility, determining pack contents based on location,
 * and revealing the pulled cards to the player sequentially.
 */
export const BoosterPacks = {
    /**
     * Handles the purchase of a booster pack.
     * @param {number} [locationPrice=GameConfig.boosterPack.basePrice] - The price of the pack at the current location.
     */
    buyBoosterPack(locationPrice = GameConfig.boosterPack.basePrice) {
        // ... (existing validation code remains the same) ...
        if (GameState.current.cash < locationPrice) {
            GameLogger.addLogMessage(`Not enough cash. Need $${locationPrice}.`);
            return;
        }
        if (GameState.current.boosterPacksPurchasedToday >= GameConfig.boosterPack.dailyLimit) {
            GameLogger.addLogMessage(`Daily pack limit reached.`);
            return;
        }
        if (!GameState.market[GameState.current.currentLocationId]?.boosterAvailable) {
            GameLogger.addLogMessage(`Boosters sold out today.`);
            return;
        }
        if (!UIElements.boosterPackModal.classList.contains('hidden')) {
            return;
        }
        
        GameState.current.cash -= locationPrice;
        GameState.current.boosterPacksPurchasedToday++;
        
        UIRenderer.renderAll();

        const location = GameState.getCurrentLocation();
        const packSize = Math.floor(Math.random() * 3) + 3;
        const pulledCardInstances = []; // Will now store unique instances
        
        let tempPulledBaseCards = []; // Temporary array for base card objects

        // --- Card Pulling Logic based on Location Specialization (modified to pull base cards first) ---
        if (location && location.specialization === 'rookies') {
            const rookieCards = GameData.tradableCards.filter(c => c.id.includes('rookie'));
            const otherCards = GameData.tradableCards.filter(c => !c.id.includes('rookie'));
            if (Math.random() < 0.5 && rookieCards.length > 0) tempPulledBaseCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
            else if (otherCards.length > 0) tempPulledBaseCards.push(otherCards[Math.floor(Math.random() * otherCards.length)]);
            else if (rookieCards.length > 0) tempPulledBaseCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
            for (let i = 1; i < packSize; i++) {
                if (Math.random() < 0.3 && rookieCards.length > 0) tempPulledBaseCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
                else tempPulledBaseCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
            }
        } else if (location && location.specialization === 'mystery') {
            const rareCards = GameData.tradableCards.filter(c => c.basePrice > (GameConfig.rareCardThreshold ?? 100));
            const otherCards = GameData.tradableCards.filter(c => c.basePrice <= (GameConfig.rareCardThreshold ?? 100));
            if (rareCards.length > 0) tempPulledBaseCards.push(rareCards[Math.floor(Math.random() * rareCards.length)]);
            else if (otherCards.length > 0) tempPulledBaseCards.push(otherCards[Math.floor(Math.random() * otherCards.length)]);
            else tempPulledBaseCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
            for (let i = 1; i < packSize; i++) tempPulledBaseCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
        } else {
            const lowValueCards = GameData.tradableCards.filter(c => c.basePrice <= 250);
            const lowValueLootTable = [];
            lowValueCards.forEach(card => {
                const weight = (card.id === 'common_single') ? 6 : 1;
                for (let i = 0; i < weight; i++) lowValueLootTable.push(card);
            });
            const fullLootTable = [];
            GameData.tradableCards.forEach(card => {
                let weight = 1; if (card.id === 'common_single') weight = 4;
                for (let i = 0; i < weight; i++) fullLootTable.push(card);
            });
            for (let i = 0; i < Math.min(3, packSize); i++) {
                if (lowValueLootTable.length > 0) tempPulledBaseCards.push(lowValueLootTable[Math.floor(Math.random() * lowValueLootTable.length)]);
                else if (fullLootTable.length > 0) tempPulledBaseCards.push(fullLootTable[Math.floor(Math.random() * fullLootTable.length)]);
            }
            if (packSize > 3) {
                for (let i = 3; i < packSize; i++) {
                     if (fullLootTable.length > 0) tempPulledBaseCards.push(fullLootTable[Math.floor(Math.random() * fullLootTable.length)]);
                }
            }
        }
        
        while(tempPulledBaseCards.length < packSize && GameData.tradableCards.length > 0) {
            tempPulledBaseCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
        }

        // Convert base cards to unique instances
        tempPulledBaseCards.forEach(baseCard => {
            if (baseCard) { // Ensure baseCard is not undefined from faulty loot table logic
                const instance = createUniqueCardInstance(baseCard);
                if (instance) pulledCardInstances.push(instance);
            }
        });

        // Ensure pack is filled if instance creation failed for some pulls
        while(pulledCardInstances.length < packSize && GameData.tradableCards.length > 0) {
            const fallbackBaseCard = GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)];
            const instance = createUniqueCardInstance(fallbackBaseCard);
            if (instance) pulledCardInstances.push(instance);
        }


        this.revealCardsSequentially(pulledCardInstances);
    },

    /**
     * Reveals cards from a booster pack one by one with a slight delay.
     * Adds each card instance to the player's inventory and updates the UI.
     * @param {Array<Object>} cardInstances - An array of unique card instance objects pulled from the pack.
     */
    revealCardsSequentially(cardInstances) {
        if (!UIElements.packSummaryArea || !UIElements.closePackModalBtn || !UIElements.boosterPackModal) {
            console.error("Booster pack modal UI elements not found for revealing cards.");
            cardInstances.forEach(instance => { // Add to inventory even if UI fails
                 if (instance && instance.instanceId) GameState.current.inventory.push(instance);
            });
            UIRenderer.renderAll();
            return;
        }

        UIElements.packSummaryArea.innerHTML = '';
        UIElements.closePackModalBtn.style.display = 'none';
        UIElements.boosterPackModal.classList.remove('hidden');
        let revealIndex = 0;

        const self = this; // To maintain 'this' context in revealNext

        function revealNext() {
            if (revealIndex < cardInstances.length) {
                const cardInstance = cardInstances[revealIndex];
                // Basic validation for the card instance and its base card
                if (!cardInstance || !cardInstance.instanceId || !cardInstance.baseCard || !cardInstance.baseCard.id) {
                    console.warn("Invalid card instance data in pack, skipping:", cardInstance);
                    revealIndex++;
                    setTimeout(revealNext, 100);
                    return;
                }
                
                // Add the unique card instance to inventory
                GameState.current.inventory.push(cardInstance);

                // --- UI Creation for the revealed card ---
                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'flex flex-col items-center opacity-0 animate-fade-in w-32';
                
                const cabinetButton = document.createElement('button');
                cabinetButton.className = 'btn btn-secondary btn-sm text-xs mt-2 w-full';
                cabinetButton.textContent = 'To Cabinet';
                // Pass necessary instance data for cabinet addition
                cabinetButton.onclick = () => {
                    // For addToDisplayCabinet, we need cardId, the button, and potentially layers/numbering if they are instance-specific
                    // The addToDisplayCabinet function will create the cabinetItem from the instance.
                    Cabinet.addToDisplayCabinet(cardInstance.instanceId, cabinetButton);
                };
                
                // For CardVisuals, it needs base card data and any instance-specific visual modifiers
                // like numbering or dynamic layers (if applicable beyond base card type).
                // The `tempCabinetItem` structure is what CardVisuals.createCardVisual expects.
                const numberingForVisuals = CardVisuals.generateCardNumbering(cardInstance.baseCard); // This is for display in pack, not persistent numbering yet
                const tempVisualItem = {
                    card: cardInstance.baseCard,
                    layers: CardVisuals.generateLayerIndices(cardInstance.baseCard), // Assuming common cards might have layers
                    numbering: numberingForVisuals,
                    grade: null // Not graded at pull time
                };
                
                // Store instance-specific data (like pre-determined layers for common cards, or generated numbering) on the button
                // so addToDisplayCabinet can retrieve it if needed.
                if (tempVisualItem.layers) cabinetButton.dataset.layers = JSON.stringify(tempVisualItem.layers);
                if (tempVisualItem.numbering) cabinetButton.dataset.numbering = JSON.stringify(tempVisualItem.numbering);
                // Pass the instanceId to link the button to the specific card instance
                cabinetButton.dataset.instanceId = cardInstance.instanceId;


                const cardVisual = CardVisuals.createCardVisual(tempVisualItem);
                wrapperDiv.appendChild(cardVisual);

                const cardName = document.createElement('div');
                cardName.className = 'text-xs text-gray-300 mt-1 mb-1 text-center font-medium';
                cardName.textContent = cardInstance.baseCard.name || "Unknown Card";
                wrapperDiv.appendChild(cardName);
                
                const currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[cardInstance.cardId]?.price || cardInstance.baseCard.basePrice || 0;
                const priceDisplay = document.createElement('div');
                priceDisplay.className = 'text-xs text-green-400 font-semibold mb-1';
                
                if (tempVisualItem.numbering && tempVisualItem.numbering.multiplier) {
                    const adjustedPrice = Math.round(currentMarketPrice * tempVisualItem.numbering.multiplier);
                    priceDisplay.innerHTML = `$${currentMarketPrice} → <span class="text-yellow-400">$${adjustedPrice}</span>`;
                    
                    const serialInfo = document.createElement('div');
                    serialInfo.className = 'text-xs text-amber-400 font-bold';
                    serialInfo.textContent = `Serial: ${tempVisualItem.numbering.display}`;
                    if (tempVisualItem.numbering.multiplier > 5) {
                        serialInfo.className += ' animate-pulse';
                    }
                    wrapperDiv.appendChild(serialInfo);
                } else {
                    priceDisplay.textContent = `$${currentMarketPrice}`;
                }
                wrapperDiv.appendChild(priceDisplay);

                // Display hidden condition for player's info (optional, could be kept fully hidden)
                const conditionInfo = document.createElement('div');
                conditionInfo.className = 'text-xs text-cyan-400';
                const conditionConfig = GameConfig.grading.ungradedConditions.find(c => c.id === cardInstance.hiddenUngradedCondition);
                conditionInfo.textContent = `Condition: ${conditionConfig?.label || cardInstance.hiddenUngradedCondition}`;
                wrapperDiv.appendChild(conditionInfo);
                
                wrapperDiv.appendChild(cabinetButton);
                UIElements.packSummaryArea.appendChild(wrapperDiv);

                revealIndex++;
                setTimeout(revealNext, 500);
            } else {
                UIElements.closePackModalBtn.style.display = 'inline-block';
                const summaryLog = cardInstances.map(cInstance => `<li class="ml-4 list-disc pack-item">${cInstance?.baseCard?.name || 'Unknown Card'}</li>`).join('');
                GameLogger.addLogMessage(`Opened a pack: <ul>${summaryLog}</ul>`);
                UIRenderer.renderAll();
            }
        }
        revealNext();
    }
};
