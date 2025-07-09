import { GameConfig } from '../config/gameConfig.js';

export const CardVisuals = {
    generateLayerIndices(cardId) {
        const indices = [];
        const isCommonSingle = cardId === 'common_single';
        const isGameWornRelic = cardId === 'game_worn_relic';
        const isAutographedJersey = cardId === 'autographed_jersey';
        // Behavior specific to GameWornRelic or AutographedJersey
        const isSpecialRelicCard = isGameWornRelic || isAutographedJersey;

        const usesRestrictedFrames = [
            'autographed_common',
            'favorite_player',
            'prized_rookie_card',
            'game_worn_relic',
            'numbered_legend',
            'holo_legend',
            'numbered_rookie_auto',
            'autographed_jersey'
        ].includes(cardId);

        const needsAutosLayer = [
            'autographed_common',
            'numbered_rookie_auto',
            'autographed_jersey'
        ].includes(cardId);

        GameConfig.commonCardAssets.layers.forEach(layer => {
            let selectedIndex = null;
            const layerName = layer.folder.toLowerCase();

            if (isSpecialRelicCard) {
                if (layerName === 'head' || layerName === 'hair' || layerName === 'background') {
                    indices.push(null); // Skip these layers
                    return;
                }
                if (layerName === 'shirt') {
                    indices.push(null); // Skip original shirt layer for these cards
                    return;
                }
                if (layerName === 'relics') {
                    // Select from Relics layer instead of Shirt
                    selectedIndex = Math.floor(Math.random() * layer.count) + 1;
                    indices.push(selectedIndex);
                    return;
                }
            }
            
            if (layerName === 'autos') {
                if (needsAutosLayer) {
                    selectedIndex = Math.floor(Math.random() * layer.count) + 1;
                }
            } else if (layerName === 'frame') {
                if (isCommonSingle) {
                    selectedIndex = Math.floor(Math.random() * 2) + 1; // Frames 1-2
                } else if (usesRestrictedFrames) {
                    if (layer.count > 2) {
                        selectedIndex = Math.floor(Math.random() * (layer.count - 2)) + 3;
                    } else {
                        selectedIndex = Math.floor(Math.random() * layer.count) + 1;
                    }
                } else {
                    selectedIndex = Math.floor(Math.random() * layer.count) + 1;
                }
            } else if (layerName === 'background') {
                if (isCommonSingle) {
                    selectedIndex = Math.floor(Math.random() * 8) + 1; // Backgrounds 1-8
                } else {
                    selectedIndex = Math.floor(Math.random() * layer.count) + 1;
                }
            } else if (layerName !== 'relics') { // Ensure we don't double-process relics
                // Default random selection for other layers like Shirt, Head, Hair (if not special relic card)
                selectedIndex = Math.floor(Math.random() * layer.count) + 1;
            }
            
            indices.push(selectedIndex);
        });
        
        return indices;
    },

    createCardImageLayers(targetDiv, layerIndices, cardId, isGraded = false) { // Added isGraded parameter
        if (!layerIndices || layerIndices.length === 0) return;
        
        // Render actual card layers first
        GameConfig.commonCardAssets.layers.forEach((layerConfig, i) => {
            const layerIndexValue = layerIndices[i];
            if (layerIndexValue === null) return; // Skip null indices

            const img = document.createElement('img');
            img.src = `${GameConfig.commonCardAssets.base_url}${layerConfig.folder}/${layerIndexValue}.png`;
            img.style.position = 'absolute';
            img.style.left = '0';
            img.style.top = '0';
            img.style.width = '100%';
            img.style.height = '100%';

            // Layer-specific styling (e.g., autos z-index)
            // Relics layer doesn't need special scaling here as it's a pre-composed image.
            // Old special shirt scaling is removed.
            if (layerConfig.folder.toLowerCase() === 'autos') {
                img.style.zIndex = '5';
            }
            // The 'Relics' layer will be rendered like any other normal layer here.
            
            targetDiv.appendChild(img);
        });

        // Add slab image if the card is graded
        if (isGraded) {
            const slabImg = document.createElement('img');
            slabImg.src = `${GameConfig.commonCardAssets.base_url}Slab/slab.png`; // Path to slab image
            slabImg.style.position = 'absolute';
            slabImg.style.left = '0';
            slabImg.style.top = '0';
            slabImg.style.width = '100%';
            slabImg.style.height = '100%';
            slabImg.style.zIndex = '6'; // Slab is above card art/autos, below numbering
            targetDiv.appendChild(slabImg);
        }
    },

    generateCardNumbering(card) { // card.id is used here
        const eligibleCards = ['numbered_legend', 'numbered_rookie_auto', 'autographed_jersey'];
        if (!eligibleCards.includes(card.id)) return null;
        
        const denominations = [
            { total: 1, weight: 1, multiplier: 20 }, { total: 2, weight: 2, multiplier: 15 },
            { total: 10, weight: 5, multiplier: 10 }, { total: 25, weight: 10, multiplier: 5 },
            { total: 75, weight: 15, multiplier: 3 }, { total: 150, weight: 20, multiplier: 2 },
            { total: 250, weight: 25, multiplier: 1.5 }, { total: 500, weight: 22, multiplier: 1.5 }
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
                    number: serialNumber, total: denom.total,
                    multiplier: finalMultiplier, display: `${serialNumber}/${denom.total}`
                };
            }
        }
        return null; // Should not be reached if weights are correct
    },

    addNumberingOverlay(container, numbering, cardId) { // Added cardId parameter
        if (!numbering) return;
        
        const serialContainer = document.createElement('div');
        // Default positioning: bottom-right
        let positionClasses = 'absolute bottom-2 right-2 flex flex-col items-center';

        if (cardId === 'numbered_rookie_auto' || cardId === 'autographed_jersey') {
            positionClasses = 'absolute top-2 right-2 flex flex-col items-center';
        }

        serialContainer.className = positionClasses;
        serialContainer.style.zIndex = '10'; // Ensure numbering is on top of all card layers
        
        const plate = document.createElement('div');
        plate.className = 'relative px-3 py-1 rounded';
        
        // Plate styling (same as before)
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
        
        // Text styling (same as before)
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

        // Card types that use the dynamic image generation
        const graphicCardTypes = [
            'favorite_player', 'numbered_legend', 'prized_rookie_card',
            'holo_legend', 'numbered_rookie_auto', 'autographed_common',
            'common_single', 'autographed_jersey', 'game_worn_relic'
        ];

        // Handle cards currently out for grading first
        if (cabinetItem.isGrading) {
            visualContainer.className += ' bg-gray-700 rounded-lg flex flex-col items-center justify-center text-white border-2 border-gray-500';

            const lockIcon = document.createElement('span');
            lockIcon.className = 'text-4xl mb-2'; // Tailwind classes for size and margin
            lockIcon.textContent = '🔒';
            visualContainer.appendChild(lockIcon);

            const gradingText = document.createElement('p');
            gradingText.className = 'text-xs text-center px-1'; // Tailwind classes for size and padding
            gradingText.textContent = `Grading: ${cabinetItem.daysUntilGraded} days left`;
            visualContainer.appendChild(gradingText);

            return visualContainer; // Return the placeholder
        }

        if (graphicCardTypes.includes(card.id)) {
            // Pass isGraded status to createCardImageLayers for slab application
            this.createCardImageLayers(visualContainer, cabinetItem.layers, card.id, cabinetItem.isGraded);

            if (card.id === 'holo_legend') {
                visualContainer.classList.add('holo-effect');
            }

            // Apply sparkle effect if applicable (and not holo, to avoid visual clutter)
            if (card.basePrice > GameConfig.rareCardThreshold && card.id !== 'common_single' && card.id !== 'holo_legend') {
                visualContainer.classList.add('sparkle');
            }
            
            if (cabinetItem.numbering) {
                this.addNumberingOverlay(visualContainer, cabinetItem.numbering, card.id);
            }
        } else {
            // Fallback for cards not using dynamic graphics (e.g., older card types if any)
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
