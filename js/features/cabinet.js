import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';
import { Grading, GRADING_COST } from './grading.js'; // Import Grading
import { MobileNavigation } from '../ui/mobileNavigation.js'; // Import MobileNavigation

export const Cabinet = {
    showManageCabinetModal() {
        UIElements.cabinetModalTitle.textContent = 'Manage Cabinet';
        UIElements.cabinetModalMessage.textContent = 'Select a card to return to your inventory.';
        UIElements.cabinetModalOptions.innerHTML = '';
        
        GameState.current.displayCabinet.forEach((cabinetItem, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'flex flex-col items-center cursor-pointer hover:opacity-80';
            
            const cardVisual = CardVisuals.createCardVisual(cabinetItem);
            cardWrapper.appendChild(cardVisual);
            
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
            valueDisplay.textContent = `$${cabinetItem.capturedValue || 0}`;
            cardWrapper.appendChild(valueDisplay);
            // The cardVisual and valueDisplay are correctly defined and appended once above.
            // The actionsDiv should come directly after them.

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mt-2 space-x-2';

            const returnButton = document.createElement('button');
            returnButton.className = 'btn btn-secondary btn-compact text-xs';
            returnButton.textContent = 'To Inventory';
            returnButton.onclick = (e) => {
                e.stopPropagation(); // Prevent cardWrapper click if any
                this.returnCabinetCardToInventory(index);
            };
            actionsDiv.appendChild(returnButton);

            const gradeButton = document.createElement('button');
            gradeButton.className = 'btn btn-primary btn-compact text-xs'; // Or a different color
            gradeButton.textContent = 'Grade Card';
            gradeButton.onclick = (e) => {
                e.stopPropagation();
                this.sendCardForGrading(index, cabinetItem); // Placeholder, will integrate with grading.js
            };
            actionsDiv.appendChild(gradeButton);

            cardWrapper.appendChild(actionsDiv);
            // cardWrapper.onclick = () => this.returnCabinetCardToInventory(index); // Replaced by buttons
            UIElements.cabinetModalOptions.appendChild(cardWrapper);
        });
        UIElements.cabinetModal.classList.remove('hidden');
    },

    sendCardForGrading(indexInCabinet, cabinetItem) {
        const cardName = cabinetItem.card.name; // Get name before potential modification/removal

        if (GameState.current.cash < GRADING_COST) {
            GameLogger.addLogMessage(`Not enough cash to grade ${cardName}. Cost: $${GRADING_COST}. You have: $${GameState.current.cash}.`);
            // Optionally show a more prominent UI message here if desired
            UIElements.cabinetModal.classList.add('hidden'); // Still close manage modal
            return; // Exit early
        }

        const success = Grading.initiateGrading(indexInCabinet);

        if (success) {
            GameLogger.addLogMessage(`Sent ${cardName} for grading. Cost: $${GRADING_COST}.`);
            // The card object in GameState.current.displayCabinet is now updated by initiateGrading
            // (isGrading = true, daysUntilGraded = X)
        } else {
            // initiateGrading logs specific reasons to console (already graded, etc.)
            // We can add a generic GameLogger message if needed, or rely on console for debug.
            GameLogger.addLogMessage(`Could not send ${cardName} for grading. See console for details.`);
        }

        UIElements.cabinetModal.classList.add('hidden'); // Close manage modal

        // Re-render relevant UI parts
        UIRenderer.renderPlayerStats(); // Update cash display

        // Re-render the cabinet tab view to show the card as "grading" or reflect other changes
        // Assuming 'cabinet' is the currentView in MobileNavigation when this modal was opened.
        // A more robust way might be to check MobileNavigation.getCurrentView()
        if (MobileNavigation.getCurrentView() === 'cabinet') {
            UIRenderer.renderMobileCabinetTabView(UIElements.mobileMainContent);
        } else {
            // Fallback or if desktop view is also managed by this modal
            UIRenderer.renderDisplayCabinet(); // For desktop view if applicable
        }
        // UIRenderer.renderAll(); // This might be too broad if only specific parts need update
    },

    returnCabinetCardToInventory(indexToRemove) {
        if (indexToRemove < 0 || indexToRemove >= GameState.current.displayCabinet.length) return;
        const removedCabinetItem = GameState.current.displayCabinet.splice(indexToRemove, 1)[0];
        if (!removedCabinetItem) return;

        const removedCard = removedCabinetItem.card;
        let inventoryItem = GameState.current.inventory.find(item => item.cardId === removedCard.id);
        if (inventoryItem) {
            inventoryItem.quantity++;
        } else {
            GameState.current.inventory.push({ cardId: removedCard.id, quantity: 1, totalCost: 0 });
        }
        
        GameLogger.addLogMessage(`Moved a ${removedCard.name} from the cabinet back to inventory.`);
        UIElements.cabinetModal.classList.add('hidden');
        UIRenderer.renderAll();
    },

    showReplaceCabinetModal(newCardItem, fromButton) {
        UIElements.cabinetModalTitle.textContent = 'Cabinet Full!';
        UIElements.cabinetModalMessage.textContent = 'Choose a card to replace with your new pull.';
        UIElements.cabinetModalOptions.innerHTML = '';

        GameState.current.displayCabinet.forEach((cabinetItem, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'flex flex-col items-center cursor-pointer hover:opacity-80';
            
            const cardVisual = CardVisuals.createCardVisual(cabinetItem);
            cardWrapper.appendChild(cardVisual);
            
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
            valueDisplay.textContent = `$${cabinetItem.capturedValue || 0}`;
            cardWrapper.appendChild(valueDisplay);
            
            cardWrapper.onclick = () => this.replaceCabinetCard(index, newCardItem, fromButton);
            UIElements.cabinetModalOptions.appendChild(cardWrapper);
        });
        UIElements.cabinetModal.classList.remove('hidden');
    },

    replaceCabinetCard(indexToRemove, newCardItem, fromButton) {
        this.returnCabinetCardToInventory(indexToRemove);
        this.addToDisplayCabinet(newCardItem.card.id, fromButton, true, newCardItem.layers);
        UIElements.cabinetModal.classList.add('hidden');
    },

    addToDisplayCabinet(cardId, buttonElement, isReplacing = false, forcedLayers = null) {
        const cardLayers = forcedLayers || (buttonElement && buttonElement.dataset.layers ? JSON.parse(buttonElement.dataset.layers) : null);
        const numbering = buttonElement && buttonElement.dataset.numbering ? JSON.parse(buttonElement.dataset.numbering) : null;
        
        let currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[cardId]?.price || GameState.getCardDetails(cardId).basePrice;
        
        if (numbering) {
            currentMarketPrice = Math.round(currentMarketPrice * numbering.multiplier);
        }
        
        const newCabinetItem = {
            card: GameState.getCardDetails(cardId),
            layers: cardLayers,
            numbering: numbering,
            capturedValue: currentMarketPrice
        };

        if (!isReplacing) {
            const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);
            if (!inventoryItem || inventoryItem.quantity < 1) {
                GameLogger.addLogMessage(`Error: Card not found in inventory.`);
                return;
            }
            inventoryItem.quantity--;
            if (inventoryItem.quantity <= 0) {
                GameState.current.inventory = GameState.current.inventory.filter(i => i.cardId !== cardId);
            }
        }
        
        if (GameState.current.displayCabinet.length < GameConfig.displayCabinetLimit) {
            GameState.current.displayCabinet.push(newCabinetItem);
            const serialMsg = numbering ? ` (Serial: ${numbering.display})` : '';
            GameLogger.addLogMessage(`Added a ${newCabinetItem.card.name} to the Display Cabinet! (Value: $${currentMarketPrice}${serialMsg})`);
            if (buttonElement) {
                buttonElement.textContent = 'Added!';
                buttonElement.disabled = true;
            }
            UIRenderer.renderAll();
        } else if (!isReplacing) {
            this.showReplaceCabinetModal(newCabinetItem, buttonElement);
        }
    },

    showPlayerCabinet(cabinet) {
        UIElements.viewCabinetList.innerHTML = '';
        if (cabinet && cabinet.length > 0) {
            document.getElementById('view-cabinet-title').textContent = "Player's Cabinet";
            cabinet.forEach(cabinetItem => {
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'flex flex-col items-center';
                
                const cardVisual = CardVisuals.createCardVisual(cabinetItem);
                cardWrapper.appendChild(cardVisual);
                
                if (cabinetItem.capturedValue) {
                    const valueDisplay = document.createElement('div');
                    valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
                    valueDisplay.textContent = `$${cabinetItem.capturedValue}`;
                    cardWrapper.appendChild(valueDisplay);
                }
                
                UIElements.viewCabinetList.appendChild(cardWrapper);
            });
        } else {
            UIElements.viewCabinetList.innerHTML = '<p class="text-gray-500 col-span-full">This player had an empty cabinet.</p>';
        }
        UIElements.viewCabinetModal.classList.remove('hidden');
    }
};
