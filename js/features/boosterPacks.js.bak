import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { CardVisuals } from '../ui/cardVisuals.js';
import { Cabinet } from './cabinet.js';

export const BoosterPacks = {
    buyBoosterPack(locationPrice = GameConfig.boosterPack.basePrice) {
        if (GameState.current.cash < locationPrice) {
            GameLogger.addLogMessage(`Not enough cash. Need $${locationPrice}.`);
            return;
        }
        if (GameState.current.boosterPacksPurchasedToday >= GameConfig.boosterPack.dailyLimit) {
            GameLogger.addLogMessage(`Daily pack limit reached.`);
            return;
        }
        if (!GameState.market[GameState.current.currentLocationId].boosterAvailable) {
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
        const pulledCards = [];
        
        if (location.specialization === 'rookies') {
            const rookieCards = GameData.tradableCards.filter(c => c.id.includes('rookie'));
            const otherCards = GameData.tradableCards.filter(c => !c.id.includes('rookie'));
            
            if (Math.random() < 0.5 && rookieCards.length > 0) {
                pulledCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
            } else {
                pulledCards.push(otherCards[Math.floor(Math.random() * otherCards.length)]);
            }
            
            for (let i = 1; i < packSize; i++) {
                if (Math.random() < 0.3 && rookieCards.length > 0) {
                    pulledCards.push(rookieCards[Math.floor(Math.random() * rookieCards.length)]);
                } else {
                    pulledCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
                }
            }
        } else if (location.specialization === 'mystery') {
            const rareCards = GameData.tradableCards.filter(c => c.basePrice > GameConfig.rareCardThreshold);
            const otherCards = GameData.tradableCards.filter(c => c.basePrice <= GameConfig.rareCardThreshold);
            
            pulledCards.push(rareCards[Math.floor(Math.random() * rareCards.length)]);
            
            for (let i = 1; i < packSize; i++) {
                pulledCards.push(GameData.tradableCards[Math.floor(Math.random() * GameData.tradableCards.length)]);
            }
        } else {
            const lowValueCards = GameData.tradableCards.filter(c => c.basePrice <= 250);
            const lowValueLootTable = [];
            lowValueCards.forEach(card => {
                const weight = (card.id === 'common_single') ? 6 : 1;
                for (let i = 0; i < weight; i++) lowValueLootTable.push(card);
            });
            const fullLootTable = [];
            GameData.tradableCards.forEach(card => {
                let weight = 1;
                if (card.id === 'common_single') weight = 4;
                for (let i = 0; i < weight; i++) fullLootTable.push(card);
            });
            for (let i = 0; i < Math.min(3, packSize); i++) {
                pulledCards.push(lowValueLootTable[Math.floor(Math.random() * lowValueLootTable.length)]);
            }
            if (packSize > 3) {
                for (let i = 3; i < packSize; i++) {
                    pulledCards.push(fullLootTable[Math.floor(Math.random() * fullLootTable.length)]);
                }
            }
        }
        
        this.revealCardsSequentially(pulledCards);
    },

    revealCardsSequentially(cards) {
        UIElements.packSummaryArea.innerHTML = '';
        UIElements.closePackModalBtn.style.display = 'none';
        UIElements.boosterPackModal.classList.remove('hidden');
        let revealIndex = 0;

        function revealNext() {
            if (revealIndex < cards.length) {
                const card = cards[revealIndex];
                
                const numbering = CardVisuals.generateCardNumbering(card);
                
                let inventoryItem = GameState.current.inventory.find(item => item.cardId === card.id);
                if (inventoryItem) inventoryItem.quantity++;
                else GameState.current.inventory.push({ cardId: card.id, quantity: 1, totalCost: 0 });

                const wrapperDiv = document.createElement('div');
                wrapperDiv.className = 'flex flex-col items-center opacity-0 animate-fade-in w-32';
                
                const cabinetButton = document.createElement('button');
                cabinetButton.className = 'btn btn-secondary btn-sm text-xs mt-2 w-full';
                cabinetButton.textContent = 'To Cabinet';
                cabinetButton.onclick = () => Cabinet.addToDisplayCabinet(card.id, cabinetButton);
                
                const graphicCardTypes = ['favorite_player', 'numbered_legend', 'prized_rookie_card', 'holo_legend', 'numbered_rookie_auto', 'autographed_common', 'common_single', 'autographed_jersey'];
                const tempCabinetItem = { card: card, layers: null, numbering: numbering };

                if (graphicCardTypes.includes(card.id)) {
                    tempCabinetItem.layers = CardVisuals.generateLayerIndices();
                    cabinetButton.dataset.layers = JSON.stringify(tempCabinetItem.layers);
                }
                
                if (numbering) {
                    cabinetButton.dataset.numbering = JSON.stringify(numbering);
                }
                
                const cardVisual = CardVisuals.createCardVisual(tempCabinetItem);
                wrapperDiv.appendChild(cardVisual);

                const cardName = document.createElement('div');
                cardName.className = 'text-xs text-gray-300 mt-1 mb-1 text-center font-medium';
                cardName.textContent = card.name;
                wrapperDiv.appendChild(cardName);
                
                const currentPrice = GameState.market[GameState.current.currentLocationId]?.[card.id]?.price || card.basePrice;
                const priceDisplay = document.createElement('div');
                priceDisplay.className = 'text-xs text-green-400 font-semibold mb-1';
                
                if (numbering) {
                    const adjustedPrice = Math.round(currentPrice * numbering.multiplier);
                    priceDisplay.innerHTML = `$${currentPrice} → <span class="text-yellow-400">$${adjustedPrice}</span>`;
                    
                    const serialInfo = document.createElement('div');
                    serialInfo.className = 'text-xs text-amber-400 font-bold';
                    serialInfo.textContent = `Serial: ${numbering.display}`;
                    if (numbering.multiplier > 5) {
                        serialInfo.className += ' animate-pulse';
                    }
                    wrapperDiv.appendChild(serialInfo);
                } else {
                    priceDisplay.textContent = `$${currentPrice}`;
                }
                wrapperDiv.appendChild(priceDisplay);
                
                wrapperDiv.appendChild(cabinetButton);
                UIElements.packSummaryArea.appendChild(wrapperDiv);

                revealIndex++;
                setTimeout(revealNext, 500);
            } else {
                UIElements.closePackModalBtn.style.display = 'inline-block';
                const summaryLog = cards.map(c => `<li class="ml-4 list-disc pack-item">${c.name}</li>`).join('');
                GameLogger.addLogMessage(`Opened a pack: <ul>${summaryLog}</ul>`);
                UIRenderer.renderAll();
            }
        }
        revealNext();
    }
};
