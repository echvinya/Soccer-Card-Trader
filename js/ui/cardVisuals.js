import { GameConfig } from '../config/gameConfig.js';

export const CardVisuals = {
    generateLayerIndices() {
        const indices = [];
        GameConfig.commonCardAssets.layers.forEach(layer => {
            indices.push(Math.floor(Math.random() * layer.count) + 1);
        });
        return indices;
    },

    createCardImageLayers(targetDiv, layerIndices) {
        if (!layerIndices || layerIndices.length === 0) return;

        GameConfig.commonCardAssets.layers.forEach((layer, i) => {
            const img = document.createElement('img');
            img.src = `${GameConfig.commonCardAssets.base_url}${layer.folder}/${layerIndices[i]}.png`;
            img.style.position = 'absolute';
            img.style.left = '0';
            img.style.top = '0';
            img.style.width = '100%';
            img.style.height = '100%';
            targetDiv.appendChild(img);
        });
    },

    generateCardNumbering(card) {
        const eligibleCards = ['numbered_legend', 'numbered_rookie_auto', 'autographed_jersey'];
        if (!eligibleCards.includes(card.id)) return null;
        
        const denominations = [
            { total: 1, weight: 1, multiplier: 20 },
            { total: 2, weight: 2, multiplier: 15 },
            { total: 10, weight: 5, multiplier: 10 },
            { total: 25, weight: 10, multiplier: 5 },
            { total: 75, weight: 15, multiplier: 3 },
            { total: 150, weight: 20, multiplier: 2 },
            { total: 250, weight: 25, multiplier: 1.5 },
            { total: 500, weight: 22, multiplier: 1.5 }
        ];
        
        const totalWeight = denominations.reduce((sum, d) => sum + d.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const denom of denominations) {
            random -= denom.weight;
            if (random <= 0) {
                const serialNumber = Math.floor(Math.random() * denom.total) + 1;
                
                let finalMultiplier = denom.multiplier;
                if (serialNumber === 1) finalMultiplier *= 1.5;
                if (serialNumber === denom.total) finalMultiplier *= 1.25;
                
                return {
                    number: serialNumber,
                    total: denom.total,
                    multiplier: finalMultiplier,
                    display: `${serialNumber}/${denom.total}`
                };
            }
        }
    },

    addNumberingOverlay(container, numbering) {
        if (!numbering) return;
        
        const serialContainer = document.createElement('div');
        serialContainer.className = 'absolute bottom-2 right-2 flex flex-col items-center';
        serialContainer.style.zIndex = '10';
        
        const plate = document.createElement('div');
        plate.className = 'relative px-3 py-1 rounded';
        
        if (numbering.number === 1 && numbering.total === 1) {
            plate.style.background = 'linear-gradient(135deg, #FFD700 0%, #B8860B 50%, #FFD700 100%)';
            plate.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8), inset 0 0 10px rgba(255, 255, 255, 0.5)';
            plate.className += ' animate-pulse';
        } else if (numbering.total <= 10) {
            plate.style.background = 'linear-gradient(135deg, #C0C0C0 0%, #808080 50%, #C0C0C0 100%)';
            plate.style.boxShadow = '0 0 15px rgba(192, 192, 192, 0.6)';
        } else if (numbering.total <= 25) {
            plate.style.background = 'linear-gradient(135deg, #CD7F32 0%, #8B4513 50%, #CD7F32 100%)';
            plate.style.boxShadow = '0 0 10px rgba(205, 127, 50, 0.5)';
        } else {
            plate.style.background = 'rgba(0, 0, 0, 0.8)';
            plate.style.border = '1px solid #FFD700';
        }
        
        const serialText = document.createElement('div');
        serialText.textContent = numbering.display;
        serialText.style.fontFamily = 'monospace';
        serialText.style.fontSize = '11px';
        serialText.style.fontWeight = '900';
        serialText.style.letterSpacing = '0.5px';
        
        if (numbering.number === 1 && numbering.total === 1) {
            serialText.className = 'serial-rainbow';
        } else if (numbering.number === 1 || numbering.number === numbering.total) {
            serialText.className = 'serial-foil';
        } else if (numbering.total <= 25) {
            serialText.className = 'serial-embossed';
        } else {
            serialText.style.color = '#FFD700';
        }
        
        if (numbering.total <= 10) {
            const label = document.createElement('div');
            label.textContent = 'SERIAL';
            label.style.fontSize = '8px';
            label.style.color = '#FFD700';
            label.style.letterSpacing = '1px';
            label.style.opacity = '0.8';
            plate.appendChild(label);
        }
        
        plate.appendChild(serialText);
        serialContainer.appendChild(plate);
        container.appendChild(serialContainer);
    },

    createCardVisual(cabinetItem) {
        const card = cabinetItem.card;
        const visualContainer = document.createElement('div');
        visualContainer.className = 'relative aspect-[3/4] w-full';

        const graphicCardTypes = [
            'favorite_player', 
            'numbered_legend', 
            'prized_rookie_card', 
            'holo_legend', 
            'numbered_rookie_auto', 
            'autographed_common', 
            'common_single',
            'autographed_jersey'
        ];

        if (graphicCardTypes.includes(card.id)) {
            this.createCardImageLayers(visualContainer, cabinetItem.layers);
            if (card.basePrice > GameConfig.rareCardThreshold && card.id !== 'common_single') {
                visualContainer.classList.add('sparkle');
            }
            
            if (cabinetItem.numbering) {
                this.addNumberingOverlay(visualContainer, cabinetItem.numbering);
            }
        } else {
            visualContainer.className += ' border-2 border-gray-400 rounded-lg p-2 flex items-center justify-center text-center';
            visualContainer.textContent = card.name;
            if (card.basePrice > GameConfig.rareCardThreshold) {
                visualContainer.classList.add('sparkle', 'text-black');
            } else {
                visualContainer.style.backgroundColor = '#374151';
            }
        }
        return visualContainer;
    }
};
