import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameLogger } from '../core/gameLogger.js';
// import { UIRenderer } from '../ui/uiRenderer.js'; // Not strictly needed here, UI updates handled by caller or renderAll

/**
 * GradingService
 * Handles the logic for card grading, including submission, daily processing,
 * and finalization of grades.
 */
export const GradingService = {
    /**
     * Checks if a card instance from the inventory is eligible for grading.
     * @param {string} inventoryItemInstanceId - The instanceId of the card in the player's inventory.
     * @returns {boolean} True if the card is eligible, false otherwise.
     */
    isCardEligibleForGrading(inventoryItemInstanceId) {
        if (!inventoryItemInstanceId) return false;

        const cardInstance = GameState.current.inventory.find(item => item.instanceId === inventoryItemInstanceId);

        if (!cardInstance) {
            // console.warn(`Grading Eligibility: Card instance ${inventoryItemInstanceId} not found in inventory.`);
            return false;
        }

        // To be eligible: must be a unique instance and not already graded.
        return !!cardInstance.instanceId && cardInstance.grade === null;
    },

    /**
     * Submits a card from a display cabinet slot for grading.
     * @param {number} cabinetSlotIndex - The index of the card in the GameState.current.displayCabinet.
     * @returns {boolean} True if submission was successful, false otherwise.
     */
    submitCardForGrading(cabinetSlotIndex) {
        if (cabinetSlotIndex < 0 || cabinetSlotIndex >= GameState.current.displayCabinet.length) {
            GameLogger.addLogMessage("Grading Error: Invalid cabinet slot selected.");
            console.error("Grading Error: Invalid cabinet slot index:", cabinetSlotIndex);
            return false;
        }

        const cabinetItem = GameState.current.displayCabinet[cabinetSlotIndex];

        if (!cabinetItem || !cabinetItem.instanceId) {
            GameLogger.addLogMessage("Grading Error: No valid card instance in this cabinet slot.");
            console.error("Grading Error: No valid card instance in cabinet slot:", cabinetSlotIndex, cabinetItem);
            return false;
        }

        if (cabinetItem.isAwayForGrading) {
            GameLogger.addLogMessage("This card is already away for grading.");
            return false;
        }

        if (cabinetItem.grade) {
            GameLogger.addLogMessage("This card has already been graded.");
            return false;
        }

        // Check costs
        const gradingCostCash = GameConfig.grading?.costs?.cash ?? 50;
        const gradingCostDays = GameConfig.grading?.costs?.days ?? 5;

        if (GameState.current.cash < gradingCostCash) {
            GameLogger.addLogMessage(`Not enough cash to grade. Need $${gradingCostCash}.`);
            return false;
        }
        // Days check for grading isn't strictly necessary here as it consumes days over time,
        // but good to be aware if there were an upfront day cost beyond processing time.

        // Deduct costs & update state
        GameState.current.cash -= gradingCostCash;

        cabinetItem.isAwayForGrading = true;
        cabinetItem.daysUntilGradingComplete = gradingCostDays;
        cabinetItem.lockedByGrading = true; // Slot is locked until grading revealed

        const cardName = cabinetItem.card?.name || 'Unknown Card';
        GameLogger.addLogMessage(`${cardName} (Cabinet Slot ${cabinetSlotIndex + 1}) sent for grading. It will take ${gradingCostDays} days.`);

        // UIRenderer.renderAll(); // Caller should handle UI updates
        return true;
    },

    /**
     * Processes grading progress daily. Called once per game day.
     */
    processDailyGrading() {
        if (!GameState.current || !Array.isArray(GameState.current.displayCabinet)) {
            return;
        }

        GameState.current.displayCabinet.forEach((cabinetItem, index) => {
            if (cabinetItem && cabinetItem.isAwayForGrading && cabinetItem.instanceId) {
                if (typeof cabinetItem.daysUntilGradingComplete === 'number') {
                    cabinetItem.daysUntilGradingComplete--;

                    if (cabinetItem.daysUntilGradingComplete <= 0) {
                        this.finalizeGrading(index);
                    }
                }
            }
        });
    },

    /**
     * Finalizes the grading process for a card.
     * Determines the grade, updates the cabinet item, and sets it up for reveal.
     * @param {number} cabinetSlotIndex - The index of the card in the display cabinet.
     */
    finalizeGrading(cabinetSlotIndex) {
        const cabinetItem = GameState.current.displayCabinet[cabinetSlotIndex];
        if (!cabinetItem || !cabinetItem.isAwayForGrading || !cabinetItem.instanceId) {
            console.error("Grading Finalize Error: Invalid cabinet item or not away for grading.", cabinetSlotIndex, cabinetItem);
            if(cabinetItem) cabinetItem.isAwayForGrading = false; // Reset if something went wrong
            return;
        }

        const conditionId = cabinetItem.hiddenUngradedCondition;
        const conditionInfo = GameConfig.grading.ungradedConditions.find(c => c.id === conditionId);

        if (!conditionInfo || !conditionInfo.gradePotential || conditionInfo.gradePotential.length !== 2) {
            console.error("Grading Finalize Error: Invalid or missing condition info for", conditionId, cabinetItem);
            // Assign a fallback grade if config is broken
            cabinetItem.grade = { score: 1, gradeName: 'Error', slabImage: GameConfig.grading.scales.find(s=>s.score===1)?.slabImage || '', multiplier: 0.1 };
            cabinetItem.isAwayForGrading = false;
            // `lockedByGrading` remains true until reveal
            cabinetItem.currentDisplayValue = cabinetItem.packPullValue * cabinetItem.grade.multiplier;
            GameState.current.pendingGradingReveal = { cabinetSlotIndex: cabinetSlotIndex, revealedGrade: cabinetItem.grade, cardName: cabinetItem.card?.name };
            return;
        }

        // Determine final grade score based on potential range
        const [minPotential, maxPotential] = conditionInfo.gradePotential;
        // Simple RNG: random integer between min and max (inclusive)
        const determinedScore = Math.floor(Math.random() * (maxPotential - minPotential + 1)) + minPotential;

        const gradeDetails = GameConfig.grading.scales.find(s => s.score === determinedScore);
        if (!gradeDetails) {
            console.error("Grading Finalize Error: No grade scale details found for score", determinedScore);
            // Assign a fallback grade if config is broken for this score
            cabinetItem.grade = { score: determinedScore, gradeName: 'Unknown Grade', slabImage: '', multiplier: 0.5 };
        } else {
            cabinetItem.grade = {
                score: gradeDetails.score,
                gradeName: gradeDetails.name,
                slabImage: gradeDetails.slabImage,
                multiplier: gradeDetails.multiplier
            };
        }

        cabinetItem.isAwayForGrading = false;
        // cabinetItem.lockedByGrading remains true until player views the reveal via modal

        // Update currentDisplayValue based on the new grade and original packPullValue
        cabinetItem.currentDisplayValue = (cabinetItem.packPullValue || cabinetItem.card?.basePrice || 0) * (cabinetItem.grade.multiplier || 1);
        // If it has numbering, that multiplier should also apply on top of grade multiplier
        if (cabinetItem.numbering && typeof cabinetItem.numbering.multiplier === 'number' && cabinetItem.numbering.multiplier > 0) {
             cabinetItem.currentDisplayValue *= cabinetItem.numbering.multiplier;
        }


        // Set up for reveal modal
        GameState.current.pendingGradingReveal = {
            cabinetSlotIndex: cabinetSlotIndex,
            cardName: cabinetItem.card?.name || 'Unknown Card',
            revealedGrade: { ...cabinetItem.grade }, // Pass a copy
            packPullValue: cabinetItem.packPullValue,
            currentDisplayValue: cabinetItem.currentDisplayValue,
            // Pass visual info for the modal
            baseCard: cabinetItem.card,
            layers: cabinetItem.layers,
            numbering: cabinetItem.numbering
        };

        const cardName = cabinetItem.card?.name || 'A card';
        GameLogger.addLogMessage(`${cardName} in Cabinet Slot ${cabinetSlotIndex + 1} has returned from grading!`);
        // UIRenderer.renderAll(); // Full render will happen, or specific modal will be shown by GameController
    }
};
