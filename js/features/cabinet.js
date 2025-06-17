import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';

/**
 * Cabinet Module
 * Manages the player's Display Cabinet, a feature allowing players to showcase
 * a limited number of their most prized cards. These cards are typically
 * removed from the main inventory and their value at the time of adding is captured.
 * Provides functions to add, remove, and replace cards in the cabinet.
 */
export const Cabinet = {
    /**
     * Displays a modal for managing the player's current display cabinet.
     * Players can see their cabinet cards and choose one to return to their main inventory.
     */
    showManageCabinetModal() {
        if (!UIElements.cabinetModal || !UIElements.cabinetModalTitle || !UIElements.cabinetModalMessage || !UIElements.cabinetModalOptions) {
            console.error("Cabinet Error: Manage cabinet modal UI elements not found.");
            return;
        }
        UIElements.cabinetModalTitle.textContent = 'Manage Cabinet';
        UIElements.cabinetModalMessage.textContent = 'Select a card to return to your inventory.';
        UIElements.cabinetModalOptions.innerHTML = ''; // Clear previous options
        
        // Populate the modal with visuals of cards currently in the display cabinet.
        GameState.current.displayCabinet.forEach((cabinetItem, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'flex flex-col items-center cursor-pointer hover:opacity-80';
            
            // Create the visual representation of the card.
            const cardVisual = CardVisuals.createCardVisual(cabinetItem);
            cardWrapper.appendChild(cardVisual);
            
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
            valueDisplay.textContent = `$${cabinetItem.capturedValue || 0}`; // Display its captured value.
            cardWrapper.appendChild(valueDisplay);
            
            // Set up click action to return the card to inventory.
            cardWrapper.onclick = () => this.returnCabinetCardToInventory(index);
            UIElements.cabinetModalOptions.appendChild(cardWrapper);
        });
        UIElements.cabinetModal.classList.remove('hidden'); // Show the modal.
    },

    /**
     * Returns a selected card from the display cabinet back to the player's main inventory.
     * @param {number} indexToRemove - The index of the card in the `displayCabinet` array to remove.
     */
    returnCabinetCardToInventory(indexToRemove) {
        if (indexToRemove < 0 || indexToRemove >= GameState.current.displayCabinet.length) {
            console.error("Cabinet Error: Invalid index for removing card from cabinet.", indexToRemove);
            return;
        }
        // Remove the item from cabinet and get the removed item.
        const removedCabinetItem = GameState.current.displayCabinet.splice(indexToRemove, 1)[0];
        if (!removedCabinetItem || !removedCabinetItem.card) {
            console.error("Cabinet Error: Failed to retrieve card from cabinet for removal.", removedCabinetItem);
            return;
        }

        const removedCard = removedCabinetItem.card;
        // Add the card back to the main inventory.
        let inventoryItem = GameState.current.inventory.find(item => item.cardId === removedCard.id);
        if (inventoryItem) {
            inventoryItem.quantity++;
            // Note: totalCost is not typically restored from capturedValue, as inventory tracks buy costs.
            // If it was sold from inventory to cabinet, its cost was already accounted for.
            // If it was a new pull, its inventory cost was 0.
        } else {
            // If card type wasn't in inventory, add it with quantity 1 and 0 totalCost.
            GameState.current.inventory.push({ cardId: removedCard.id, quantity: 1, totalCost: 0 });
        }
        
        GameLogger.addLogMessage(`Moved a ${removedCard.name} from the cabinet back to inventory.`);
        if (UIElements.cabinetModal) UIElements.cabinetModal.classList.add('hidden');
        UIRenderer.renderAll(); // Refresh UI to reflect changes in cabinet and inventory.
    },

    /**
     * Displays a modal when the cabinet is full, prompting the player to replace an existing
     * cabinet card with a new one they are trying to add.
     * @param {Object} newCardItem - The cabinet item object for the new card the player wants to add.
     * @param {HTMLElement} fromButton - The button element that triggered the add attempt (e.g., "To Cabinet" button).
     */
    showReplaceCabinetModal(newCardItem, fromButton) {
        if (!UIElements.cabinetModal || !UIElements.cabinetModalTitle || !UIElements.cabinetModalMessage || !UIElements.cabinetModalOptions) {
            console.error("Cabinet Error: Replace cabinet modal UI elements not found.");
            return;
        }
        UIElements.cabinetModalTitle.textContent = 'Cabinet Full!';
        UIElements.cabinetModalMessage.textContent = 'Choose a card to replace with your new pull.';
        UIElements.cabinetModalOptions.innerHTML = ''; // Clear previous options.

        // Populate modal with current cabinet cards, making them clickable for replacement.
        GameState.current.displayCabinet.forEach((cabinetItem, index) => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'flex flex-col items-center cursor-pointer hover:opacity-80';
            
            const cardVisual = CardVisuals.createCardVisual(cabinetItem);
            cardWrapper.appendChild(cardVisual);
            
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
            valueDisplay.textContent = `$${cabinetItem.capturedValue || 0}`;
            cardWrapper.appendChild(valueDisplay);
            
            // Set up click action to replace the selected card with the new one.
            cardWrapper.onclick = () => this.replaceCabinetCard(index, newCardItem, fromButton);
            UIElements.cabinetModalOptions.appendChild(cardWrapper);
        });
        UIElements.cabinetModal.classList.remove('hidden'); // Show the modal.
    },

    /**
     * Replaces a card in the cabinet. This involves returning the chosen old card to inventory
     * and then adding the new card to the cabinet.
     * @param {number} indexToRemove - Index of the card to remove from the cabinet.
     * @param {Object} newCardItem - The new card item to add to the cabinet.
     * @param {HTMLElement} fromButton - The original button that triggered the add attempt.
     */
    replaceCabinetCard(indexToRemove, newCardItem, fromButton) {
        // First, return the card at the specified index to inventory.
        this.returnCabinetCardToInventory(indexToRemove);
        // Then, add the new card to the cabinet. `isReplacing` is true to bypass inventory removal for the new card.
        // `newCardItem.card.id` and other properties are used from the `newCardItem` object.
        this.addToDisplayCabinet(newCardItem.card.id, fromButton, true, newCardItem.layers, newCardItem.numbering, newCardItem.capturedValue);
        if (UIElements.cabinetModal) UIElements.cabinetModal.classList.add('hidden');
    },

    /**
     * Adds a card to the player's display cabinet.
     * @param {string} cardId - The ID of the card to add.
     * @param {HTMLElement} buttonElement - The button element that triggered this action (optional).
     * @param {boolean} [isReplacing=false] - True if this is part of a replace operation (skips inventory removal).
     * @param {Object|null} [forcedLayers=null] - Pre-calculated visual layers for the card (e.g., from pack opening).
     * @param {Object|null} [forcedNumbering=null] - Pre-calculated numbering (used in replace flow).
     * @param {number|null} [forcedValue=null] - Pre-calculated captured value (used in replace flow).
     */
    addToDisplayCabinet(cardId, buttonElement, isReplacing = false, forcedLayers = null, forcedNumbering = null, forcedValue = null) {
        // Determine card's visual layers and numbering from button dataset or forced parameters.
        const cardLayers = forcedLayers || (buttonElement && buttonElement.dataset.layers ? JSON.parse(buttonElement.dataset.layers) : null);
        const numbering = forcedNumbering || (buttonElement && buttonElement.dataset.numbering ? JSON.parse(buttonElement.dataset.numbering) : null);
        
        // Determine the card's value to be "captured" in the cabinet.
        // Use market price if available, otherwise base price. Adjust if card has special numbering.
        let currentMarketPrice = GameState.market[GameState.current.currentLocationId]?.[cardId]?.price || GameState.getCardDetails(cardId)?.basePrice || 0;
        
        if (numbering && typeof numbering.multiplier === 'number') {
            currentMarketPrice = Math.round(currentMarketPrice * numbering.multiplier);
        }
        
        const cardDetails = GameState.getCardDetails(cardId);
        if (!cardDetails) {
            GameLogger.addLogMessage("Error: Could not find card details to add to cabinet.");
            return;
        }

        // Construct the cabinet item object.
        const newCabinetItem = {
            card: cardDetails,
            layers: cardLayers,
            numbering: numbering,
            capturedValue: forcedValue ?? currentMarketPrice // Use forcedValue if provided (during replace)
        };

        // If not part of a replacement, remove one instance of the card from player's inventory.
        if (!isReplacing) {
            const inventoryItem = GameState.current.inventory.find(item => item.cardId === cardId);
            if (!inventoryItem || inventoryItem.quantity < 1) {
                GameLogger.addLogMessage(`Error: Card ${cardDetails.name} not found in inventory to add to cabinet.`);
                return;
            }
            inventoryItem.quantity--; // Decrement quantity.
            if (inventoryItem.quantity <= 0) {
                // Remove item from inventory if quantity becomes zero.
                GameState.current.inventory = GameState.current.inventory.filter(i => i.cardId !== cardId);
            }
        }
        
        // Check if cabinet has space or if it's a replacement.
        if (GameState.current.displayCabinet.length < GameConfig.displayCabinetLimit) {
            GameState.current.displayCabinet.push(newCabinetItem);
            const serialMsg = numbering ? ` (Serial: ${numbering.display})` : '';
            GameLogger.addLogMessage(`Added a ${newCabinetItem.card.name} to the Display Cabinet! (Value: $${newCabinetItem.capturedValue}${serialMsg})`);

            // Update the button state if provided.
            if (buttonElement) {
                buttonElement.textContent = 'Added!';
                buttonElement.disabled = true;
            }
            UIRenderer.renderAll(); // Refresh UI.
        } else if (!isReplacing) {
            // If cabinet is full and not a replacement, show replace modal.
            this.showReplaceCabinetModal(newCabinetItem, buttonElement);
        }
    },

    /**
     * Displays a modal showing a given player's cabinet (e.g., from leaderboard).
     * @param {Array<Object>} cabinet - The cabinet data array to display.
     */
    showPlayerCabinet(cabinet) {
        if (!UIElements.viewCabinetList || !UIElements.viewCabinetModal || !document.getElementById('view-cabinet-title')) {
            console.error("Cabinet Error: View cabinet modal UI elements not found.");
            return;
        }
        UIElements.viewCabinetList.innerHTML = ''; // Clear previous content.

        if (cabinet && Array.isArray(cabinet) && cabinet.length > 0) {
            document.getElementById('view-cabinet-title').textContent = "Player's Cabinet";
            cabinet.forEach(cabinetItem => {
                if (!cabinetItem || !cabinetItem.card) { // Basic validation for cabinet item
                    console.warn("Cabinet Warning: Invalid item found in provided cabinet data.", cabinetItem);
                    return;
                }
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'flex flex-col items-center';
                
                const cardVisual = CardVisuals.createCardVisual(cabinetItem); // Create visual representation.
                cardWrapper.appendChild(cardVisual);
                
                // Display captured value if available.
                if (typeof cabinetItem.capturedValue === 'number') {
                    const valueDisplay = document.createElement('div');
                    valueDisplay.className = 'text-sm font-semibold text-green-400 mt-1';
                    valueDisplay.textContent = `$${cabinetItem.capturedValue.toLocaleString()}`;
                    cardWrapper.appendChild(valueDisplay);
                }
                
                UIElements.viewCabinetList.appendChild(cardWrapper);
            });
        } else {
            // Display message if cabinet is empty or data is invalid.
            document.getElementById('view-cabinet-title').textContent = "Player's Cabinet";
            UIElements.viewCabinetList.innerHTML = '<p class="text-gray-500 col-span-full text-center">This player had an empty cabinet.</p>';
        }
        UIElements.viewCabinetModal.classList.remove('hidden'); // Show the modal.
    }
};
