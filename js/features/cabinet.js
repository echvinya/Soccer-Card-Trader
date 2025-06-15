import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';

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
            
            cardWrapper.onclick = () => this.returnCabinetCardToInventory(index);
            UIElements.cabinetModalOptions.appendChild(cardWrapper);
        });
        UIElements.cabinetModal.classList.remove('hidden');
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
