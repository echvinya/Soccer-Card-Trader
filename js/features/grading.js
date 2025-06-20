// js/features/grading.js
import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
// import { UIRenderer } from '../ui/uiRenderer.js'; // May need later for modals
// import { GameController } from '../core/gameController.js'; // May need later

export const GRADING_COST = 75; // Fixed cost as per user feedback

export const GRADING_SCALE = [
    { value: 1,  name: "Poor",           multiplier: 0.5, weight: 3 },
    { value: 2,  name: "Fair",           multiplier: 0.7, weight: 5 },
    { value: 3,  name: "Good",           multiplier: 1.0, weight: 8 },
    { value: 4,  name: "Very Good",      multiplier: 1.2, weight: 12 },
    { value: 5,  name: "Fine",           multiplier: 1.5, weight: 16 },
    { value: 6,  name: "Very Fine",      multiplier: 2.0, weight: 20 },
    { value: 7,  name: "Near Mint",      multiplier: 2.5, weight: 24 }, // Peak
    { value: 8,  name: "Near Mint/Mint", multiplier: 3.0, weight: 18 },
    { value: 9,  name: "Mint",           multiplier: 4.0, weight: 10 },
    { value: 10, name: "Gem Mint",       multiplier: 5.0, weight: 4 }
];

// Helper function to get a random grade.
// For now, it's a simple random choice. Could be weighted later.
function getRandomGrade() {
    const totalWeight = GRADING_SCALE.reduce((sum, grade) => sum + grade.weight, 0);
    let randomThreshold = Math.random() * totalWeight;

    for (const grade of GRADING_SCALE) {
        if (randomThreshold < grade.weight) {
            return grade; // Return the whole grade object
        }
        randomThreshold -= grade.weight;
    }
    // Fallback: should ideally not be reached if weights are positive and sum correctly.
    // Return the last grade in case of any floating point inaccuracies leading to overshoot.
    return GRADING_SCALE[GRADING_SCALE.length - 1];
}

export const Grading = {
    /**
     * Initiates the grading process for a card in a specific cabinet slot.
     * @param {number} cabinetSlotIndex - The index of the card in the displayCabinet array.
     */
    initiateGrading(cabinetSlotIndex) {
        const cabinet = GameState.current.displayCabinet;
        if (cabinetSlotIndex < 0 || cabinetSlotIndex >= cabinet.length) {
            console.error(`Invalid cabinetSlotIndex: ${cabinetSlotIndex}`);
            return false;
        }

        const cardToGrade = cabinet[cabinetSlotIndex];

        if (!cardToGrade || cardToGrade.isGrading || cardToGrade.isGraded) {
            console.warn("Card cannot be sent for grading:", cardToGrade);
            // Potentially add a game log message here: "This card is already graded or being graded."
            return false;
        }

        if (GameState.current.cash < GRADING_COST) {
            console.warn("Not enough cash to grade card.");
            // Potentially add a game log message here: `Not enough cash. Grading costs $${GRADING_COST}.`
            // UIRenderer.showModal("Not enough cash!", `You need $${GRADING_COST} to send a card for grading.`);
            return false;
        }

        GameState.current.cash -= GRADING_COST;

        cardToGrade.isGrading = true;
        cardToGrade.daysUntilGraded = Math.floor(Math.random() * (7 - 3 + 1)) + 3; // Random duration 3-7 days
        // capturedValue is already set when card was added to cabinet, this is the pre-grade value.

        console.log(`Card ${cardToGrade.name} sent for grading. Cost: $${GRADING_COST}. Days: ${cardToGrade.daysUntilGraded}`);
        // GameState.addLog(`Sent ${cardToGrade.name} for grading. It will take ${cardToGrade.daysUntilGraded} days.`);

        // UIRenderer.renderAll(); // Or specific render for cabinet and player stats
        return true;
    },

    /**
     * Processes daily updates for cards currently being graded for a single day.
     * This should be called for each day that passes.
     * @returns {Array<Object>} An array of cabinet items (cards) that completed grading on this day.
     */
    processSingleDayGradingUpdate() {
        const newlyGradedCards = [];
        GameState.current.displayCabinet.forEach((card, index) => {
            if (card.isGrading && card.daysUntilGraded > 0) {
                card.daysUntilGraded--;
                if (card.daysUntilGraded === 0) {
                    this.finalizeGrading(index); // finalizeGrading updates the card object in GameState
                    newlyGradedCards.push(card); // Add the now-finalized card to the list
                }
            }
        });
        return newlyGradedCards;
    },

    /**
     * Finalizes the grading process for a card.
     * Assigns a grade and calculates its new value.
     * (This function is mostly the same, just ensure it's correctly updating the card object)
     * @param {number} cabinetSlotIndex - The index of the card in the displayCabinet array.
     */
    finalizeGrading(cabinetSlotIndex) {
        const cabinet = GameState.current.displayCabinet;
        if (cabinetSlotIndex < 0 || cabinetSlotIndex >= cabinet.length) {
            console.error(`Invalid cabinetSlotIndex for finalizing grade: ${cabinetSlotIndex}`);
            return; // Return the original card object if invalid
        }

        const gradedCard = cabinet[cabinetSlotIndex]; // This is a reference to the object in GameState
        if (!gradedCard.isGrading || gradedCard.daysUntilGraded !== 0) {
            console.error("Card is not ready to be finalized for grading:", gradedCard);
            return;
        }

        const assignedGrade = getRandomGrade();

        gradedCard.isGrading = false;
        gradedCard.isGraded = true;
        gradedCard.gradeName = assignedGrade.name;
        gradedCard.gradeValue = assignedGrade.value;
        gradedCard.gradeMultiplier = assignedGrade.multiplier;
        // Ensure capturedValue is a number before multiplication
        const baseValue = Number(gradedCard.capturedValue) || 0;
        gradedCard.valueAfterGrading = Math.round(baseValue * assignedGrade.multiplier);

        console.log(`Card ${gradedCard.card.name} grading complete. Grade: ${gradedCard.gradeName} (${gradedCard.gradeValue}). New Value: $${gradedCard.valueAfterGrading}`);
        // GameLogger.addLogMessage(`${gradedCard.card.name} has been graded: ${gradedCard.gradeName}. New value: $${gradedCard.valueAfterGrading}.`);
        // The actual showing of the modal will be handled by GameController based on what processSingleDayGradingUpdate returns.
    }
};
// js/features/grading.js
// ... (rest of the file, imports, constants, initiateGrading method should be preserved)
// Note: The diff tool might require the full context. Assuming GRADING_COST, GRADING_SCALE, getRandomGrade, and initiateGrading are correctly maintained above this section.
