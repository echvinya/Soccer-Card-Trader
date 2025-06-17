// js/features/grading.js
import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
// import { UIRenderer } from '../ui/uiRenderer.js'; // May need later for modals
// import { GameController } from '../core/gameController.js'; // May need later

export const GRADING_COST = 75; // Fixed cost as per user feedback

export const GRADING_SCALE = [
    { value: 1, name: "Poor", multiplier: 0.5 },
    { value: 2, name: "Fair", multiplier: 0.7 },
    { value: 3, name: "Good", multiplier: 1.0 },
    { value: 4, name: "Very Good", multiplier: 1.2 },
    { value: 5, name: "Fine", multiplier: 1.5 },
    { value: 6, name: "Very Fine", multiplier: 2.0 },
    { value: 7, name: "Near Mint", multiplier: 2.5 },
    { value: 8, name: "Near Mint/Mint", multiplier: 3.0 },
    { value: 9, name: "Mint", multiplier: 4.0 },
    { value: 10, name: "Gem Mint", multiplier: 5.0 }
];

// Helper function to get a random grade.
// For now, it's a simple random choice. Could be weighted later.
function getRandomGrade() {
    const randomIndex = Math.floor(Math.random() * GRADING_SCALE.length);
    return GRADING_SCALE[randomIndex];
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
     * Processes daily updates for cards currently being graded.
     * This should be called at the end of each day.
     */
    processDailyGradingUpdate() {
        let gradingCompletedThisDay = false;
        GameState.current.displayCabinet.forEach((card, index) => {
            if (card.isGrading && card.daysUntilGraded > 0) {
                card.daysUntilGraded--;
                if (card.daysUntilGraded === 0) {
                    this.finalizeGrading(index);
                    gradingCompletedThisDay = true;
                }
            }
        });
        // if (gradingCompletedThisDay) {
        //     // UIRenderer.showModal(...) or trigger event for GameController to handle modal
        //     console.log("A card has finished grading today!");
        // }
    },

    /**
     * Finalizes the grading process for a card.
     * Assigns a grade and calculates its new value.
     * @param {number} cabinetSlotIndex - The index of the card in the displayCabinet array.
     */
    finalizeGrading(cabinetSlotIndex) {
        const cabinet = GameState.current.displayCabinet;
        if (cabinetSlotIndex < 0 || cabinetSlotIndex >= cabinet.length) {
            console.error(`Invalid cabinetSlotIndex for finalizing grade: ${cabinetSlotIndex}`);
            return;
        }

        const gradedCard = cabinet[cabinetSlotIndex];
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
        gradedCard.valueAfterGrading = Math.round(gradedCard.capturedValue * assignedGrade.multiplier);

        console.log(`Card ${gradedCard.name} grading complete. Grade: ${gradedCard.gradeName} (${gradedCard.gradeValue}). New Value: $${gradedCard.valueAfterGrading}`);
        // GameState.addLog(`${gradedCard.name} has been graded: ${gradedCard.gradeName}. New value: $${gradedCard.valueAfterGrading}.`);

        // This is where we'd trigger the modal to show the user the graded card.
        // For now, we'll just log it. The GameController will likely manage showing the modal.
        // GameController.triggerGradingCompleteModal(gradedCard);

        // UIRenderer.renderAll(); // Or specific render for cabinet
    }
};
