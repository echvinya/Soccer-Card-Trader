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
        const card = cabinetItem.card; // This is the card definition object
        const visualContainer = document.createElement('div');
        visualContainer.className = 'relative aspect-[3/4] w-full';

        if (cabinetItem.isGraded) {
            // SLABBED VISUAL
            visualContainer.classList.add('p-2'); // Add some padding for the slab border effect if needed

            // Slab background
            const slabImg = document.createElement('img');
            // ***** IMPORTANT: Use a generic placeholder path for now. Actual path might change. *****
            slabImg.src = 'Images/Common/Slab/slab.png';
            slabImg.className = 'absolute inset-0 w-full h-full object-cover rounded-lg'; // cover and rounded
            visualContainer.appendChild(slabImg);

            // Container for card image and grade text, to overlay on slab
            const contentOverlayContainer = document.createElement('div');
            contentOverlayContainer.className = 'relative z-10 w-full h-full flex flex-col'; // Use flex to position elements
            visualContainer.appendChild(contentOverlayContainer);

            // Grade header on the slab (typical for PSA/BGS like slabs)
            const gradeHeader = document.createElement('div');
            gradeHeader.className = 'bg-gray-700/70 text-white p-1 text-center rounded-t-md'; // Semi-transparent header
            gradeHeader.style.minHeight = '40px'; // Ensure space for grade text

            const gradeTextLine1 = document.createElement('p');
            gradeTextLine1.className = 'font-bold text-sm';
            gradeTextLine1.textContent = `${cabinetItem.gradeValue || ''} - ${cabinetItem.gradeName || 'N/A'}`;
            gradeHeader.appendChild(gradeTextLine1);

            // Optionally add card name to header if it fits and looks good
            const cardNameInHeader = document.createElement('p');
            cardNameInHeader.className = 'text-xs truncate';
            cardNameInHeader.textContent = card.name;
            // gradeHeader.appendChild(cardNameInHeader); // Uncomment if desired

            contentOverlayContainer.appendChild(gradeHeader);

            // Card image area (smaller, within the slab)
            const cardImageContainer = document.createElement('div');
            cardImageContainer.className = 'relative flex-grow mx-auto mt-1 mb-1'; // Centered, takes up space
            // Adjust width/height to make the card image appear smaller on the slab
            cardImageContainer.style.width = '85%';
            cardImageContainer.style.height = '65%'; // Adjust as needed

            // Use existing logic to create the card image itself
            // This assumes cabinetItem.layers and cabinetItem.numbering are still relevant
            // for the visual representation of the card *on* the slab.
            const graphicCardTypes = [
                'favorite_player', 'numbered_legend', 'prized_rookie_card',
                'holo_legend', 'numbered_rookie_auto', 'autographed_common',
                'common_single', 'autographed_jersey'
            ];

            if (graphicCardTypes.includes(card.id)) {
                this.createCardImageLayers(cardImageContainer, cabinetItem.layers);
                if (card.basePrice > GameConfig.rareCardThreshold && card.id !== 'common_single') {
                    // Add sparkle to the image container if it's a rare card
                    // visualContainer.classList.add('sparkle'); // Apply sparkle to main container or image container?
                }
                if (cabinetItem.numbering) {
                    // May need to adjust positioning/size of numbering for slab
                    this.addNumberingOverlay(cardImageContainer, cabinetItem.numbering);
                }
            } else {
                cardImageContainer.className += ' border-2 border-gray-400 rounded-lg p-2 flex items-center justify-center text-center';
                cardImageContainer.textContent = card.name;
                 if (card.basePrice > GameConfig.rareCardThreshold) {
                    cardImageContainer.classList.add('sparkle', 'text-black');
                } else {
                    cardImageContainer.style.backgroundColor = '#374151';
                }
            }
            contentOverlayContainer.appendChild(cardImageContainer);
            
            // Optional: if sparkle effect is desired for graded cards, add it here
            if (cabinetItem.gradeValue && cabinetItem.gradeValue >= 8) { // e.g. sparkle for grades 8+
                 visualContainer.classList.add('sparkle-graded'); // A new sparkle style for graded
            }


        } else {
            // NON-GRADED VISUAL (existing logic)
            const graphicCardTypes = [
                'favorite_player', 'numbered_legend', 'prized_rookie_card',
                'holo_legend', 'numbered_rookie_auto', 'autographed_common',
                'common_single', 'autographed_jersey'
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
        }
        return visualContainer;
    },

    createGradingStatusVisual(cabinetItem) {
        const visualContainer = document.createElement('div');
        visualContainer.className = 'relative aspect-[3/4] w-full border-2 border-dashed border-amber-500 rounded-lg p-2 flex flex-col items-center justify-center text-center bg-gray-700'; // Style as a placeholder

        const statusText = document.createElement('p');
        statusText.className = 'text-amber-400 font-semibold';
        statusText.textContent = 'Out for Grading';
        visualContainer.appendChild(statusText);

        if (cabinetItem.daysUntilGraded !== undefined) {
            const daysText = document.createElement('p');
            daysText.className = 'text-xs text-gray-300 mt-1';
            daysText.textContent = `Days Left: ${cabinetItem.daysUntilGraded}`;
            visualContainer.appendChild(daysText);
        }
        // Add reference to original card name for clarity
        if (cabinetItem.card && cabinetItem.card.name) {
            const cardNameText = document.createElement('p');
            cardNameText.className = 'text-xs text-gray-400 mt-2 italic';
            cardNameText.textContent = `(${cabinetItem.card.name})`;
            visualContainer.appendChild(cardNameText);
        }
        return visualContainer;
    }
};
