import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { Travel } from './travel.js';

/**
 * Events Module
 * Manages the triggering, execution, and effects of various random events that can occur
 * during gameplay, particularly when traveling. Events can be local (affecting the current location)
 * or remote (affecting other locations, potentially prompting player travel).
 */
export const Events = {
    // Checks if a travel event should occur based on GameConfig.travelEventChance.
    // If an event is triggered, it uses a weighted random selection from predefined local and remote event types.
    // Remote events are set as 'pendingEvent' in GameState, local events are executed immediately.
    checkForTravelEvent() {
        // Do not trigger a new travel event if one is already pending or if random chance fails.
        if (Math.random() > GameConfig.travelEventChance || GameState.current.pendingEvent) return;

        // Define possible local (current location) and remote (other locations) events with weights.
        // Higher weight means higher chance relative to other events.
        const localEvents = [{ type: 'player_sighting', weight: 30 }, { type: 'found_card', weight: 30 }];
        const remoteEvents = [{ type: 'card_show', weight: 20 }, { type: 'market_flood', weight: 20 }];
        const allEvents = [...localEvents, ...remoteEvents]; // Combine for weighted selection.
        
        const totalWeight = allEvents.reduce((sum, event) => sum + event.weight, 0);
        let random = Math.random() * totalWeight; // Random value within the total weight range.
        
        // Determine which event to trigger based on weights.
        for (const event of allEvents) {
            random -= event.weight;
            if (random <= 0) {
                // Check if the selected event is a remote type.
                if (remoteEvents.find(e => e.type === event.type)) {
                    // Select a random location different from the current one for the remote event.
                    const otherLocations = GameData.locations.filter(l => l.id !== GameState.current.currentLocationId);
                    // Ensure there are other locations to target.
                    if (otherLocations.length === 0) return; // Cannot trigger remote event if no other locations.
                    const eventLocation = otherLocations[Math.floor(Math.random() * otherLocations.length)];
                    this.executeEvent(event.type, eventLocation.id, true); // True for isRemote.
                } else {
                    // Execute local event at the current location.
                    this.executeEvent(event.type, GameState.current.currentLocationId, false); // False for isRemote.
                }
                return; // Event triggered, exit.
            }
        }
    },

    // Dispatches to the appropriate event execution function based on eventType.
    // locationId is where the event occurs. isRemote indicates if it's a pending event for another location.
    executeEvent(eventType, locationId, isRemote) {
        switch (eventType) {
            case 'card_show':
                return this.executeCardShow(locationId, isRemote);
            case 'market_flood':
                return this.executeMarketFlood(locationId, isRemote);
            case 'player_sighting':
                return this.executePlayerSighting(); // Local event, locationId is implicitly current.
            case 'found_card':
                return this.executeFoundCard(); // Local event, locationId is implicitly current.
        }
    },

    /**
     * Event: Card Show.
     * Simulates a card show event at the target location, increasing prices of selected valuable cards.
     * If remote, it becomes a pending event. If local, effects are applied immediately.
     * `eventData` structure: { type, location, affectedCards: [{cardId}], message }
     */
    executeCardShow(locationId, isRemote) {
        const targetLocation = GameData.locations.find(loc => loc.id === locationId);
        if (!targetLocation) return; // Safety check

        const numCards = Math.floor(Math.random() * 3) + 3; // 3-5 cards affected
        const selectedCards = [];
        // Filter for cards with basePrice >= 50 to be affected by a card show
        const availableCards = GameData.tradableCards.filter(c => c.basePrice >= 50);
        
        // Randomly select unique cards to be affected.
        for (let i = 0; i < numCards && availableCards.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            const card = availableCards.splice(randomIndex, 1)[0];
            selectedCards.push({ cardId: card.id });
        }

        if (selectedCards.length === 0) return; // No eligible cards to affect.
        
        const eventData = {
            type: 'card_show',
            location: locationId,
            affectedCards: selectedCards,
            message: `Word is a Card Show is happening over at ${targetLocation.name}, causing some prices to jump.`
        };
        
        if (isRemote) {
            GameState.current.pendingEvent = eventData;
            this.showAnnouncementModal(eventData);
        } else {
            GameState.current.activeEvents.push(eventData);
            this.applyEventEffects(eventData);
            const cardNames = selectedCards.map(sc => GameState.getCardDetails(sc.cardId)?.name || 'Unknown Card').join(', ');
            this.showEventModal({
                title: "Card Show in Town!",
                message: `A traveling card show has arrived! The following cards have increased in value: ${cardNames}`
            });
        }
    },

    /**
     * Event: Market Flood.
     * Simulates a discovery that floods the market for a specific card, decreasing its price.
     * If remote, it's a pending event. If local, effects are immediate.
     * `eventData` structure: { type, location, affectedCard: cardId, message }
     */
    executeMarketFlood(locationId, isRemote) {
        const targetLocation = GameData.locations.find(loc => loc.id === locationId);
        if (!targetLocation) return; // Safety check

        // Filter for cards with basePrice >= 20 to be affected by a market flood
        const availableCards = GameData.tradableCards.filter(c => c.basePrice >= 20);
        if (availableCards.length === 0) return; // No eligible cards.

        const targetCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        if (!targetCard) return; // Should not happen if availableCards is not empty.
        
        const eventData = {
            type: 'market_flood',
            location: locationId,
            affectedCard: targetCard.id,
            message: `You hear a rumor that a huge collection was found near ${targetLocation.name}, flooding the market for ${targetCard.name} cards.`
        };

        if (isRemote) {
            GameState.current.pendingEvent = eventData;
            this.showAnnouncementModal(eventData);
        } else {
            GameState.current.activeEvents.push(eventData);
            this.applyEventEffects(eventData);
            this.showEventModal({
                title: "Market Flooded!",
                message: `A large collection of ${targetCard.name} cards was just discovered! Prices have dropped.`
            });
        }
    },

// Applies the market effects of events like 'card_show' or 'market_flood'.
// It modifies the price of affected cards in GameState.market and sets an 'eventModified' flag.
// This flag is crucial to prevent regular market updates from overwriting event-driven prices
// until the event is cleared (e.g., by clearOldEvents).
applyEventEffects(eventData) {
    const locationMarket = GameState.market[eventData.location];
    if (!locationMarket) return;

    if (eventData.type === 'card_show') {
        eventData.affectedCards.forEach(({ cardId }) => {
            if (locationMarket[cardId]) {
                const card = GameState.getCardDetails(cardId);
                if (!card) return;

                const boostMultiplier = Math.random() * 1.0 + 1.5;
                const newPrice = Math.round(card.basePrice * boostMultiplier);
                
                locationMarket[cardId].price = newPrice;
                locationMarket[cardId].eventModified = true;
            }
        });
    } else if (eventData.type === 'market_flood') {
        const cardId = eventData.affectedCard;
        if (locationMarket[cardId]) {
            const card = GameState.getCardDetails(cardId);
            if (!card) return;

            const dropPercent = Math.random() * 0.25 + 0.50;
            const newPrice = Math.round(card.basePrice * (1 - dropPercent));

            locationMarket[cardId].price = Math.max(1, newPrice);
            locationMarket[cardId].eventModified = true;
        }
    }
},

    /**
     * Event: Player Sighting. A local event that occurs at the player's current location.
     * If player has common singles, one is exchanged for an autographed common (more valuable).
     * Otherwise, player gets a small cash bonus as a consolation.
     */
    executePlayerSighting() {
        const commonSingles = GameState.current.inventory.find(item => item.cardId === 'common_single');
        if (!commonSingles || commonSingles.quantity < 1) {
            const bonus = Math.floor(Math.random() * 50) + 25;
            GameState.current.cash += bonus;
            this.showEventModal({
                title: "Near Miss!",
                message: `You spotted a famous player but had no cards to sign! A fan gave you $${bonus} for pointing them out.`
            });
            return;
        }
        
        commonSingles.quantity--;
        if (commonSingles.quantity <= 0) {
            GameState.current.inventory = GameState.current.inventory.filter(item => item.cardId !== 'common_single');
        }
        
        let autographedItem = GameState.current.inventory.find(item => item.cardId === 'autographed_common');
        if (autographedItem) {
            autographedItem.quantity++;
        } else {
            GameState.current.inventory.push({ cardId: 'autographed_common', quantity: 1, totalCost: 0 });
        }

        this.showEventModal({
            title: "Player Sighting!",
            message: "You spotted a famous player at a café! They signed one of your common cards, transforming it into an Autographed Common Card!"
        });
        UIRenderer.renderAll();
    },

    /**
     * Event: Found Card. A local event where the player stumbles upon a random card.
     * The card's rarity/value is determined by a weighted loot table.
     * Player is presented with a choice to keep the card or return it to a store for a small reward.
     */
    executeFoundCard() {
        const lootTable = [];
        GameData.tradableCards.forEach(card => {
            let weight = 1;
            if (card.basePrice < 50) weight = 10;
            else if (card.basePrice < 100) weight = 5;
            else if (card.basePrice < 200) weight = 2;
            for (let i = 0; i < weight; i++) lootTable.push(card);
        });
        
        if (lootTable.length === 0) return; // Should not happen if tradableCards exist.

        const foundCard = lootTable[Math.floor(Math.random() * lootTable.length)];
        GameState.current.tempFoundCard = foundCard;
        
        this.showEventModal({
            title: "Lucky Find!",
            message: `You found a ${foundCard.name} on the ground! Keep it or return it to the store?`,
            showChoices: true,
            type: 'found_card'
        });
    },

    /**
     * Handles the player's choice to keep a card found via the 'Found Card' event.
     * Adds the card to the player's inventory.
     */
    keepFoundCard() {
        const foundCard = GameState.current.tempFoundCard;
        if (!foundCard) return;
        
        let inventoryItem = GameState.current.inventory.find(item => item.cardId === foundCard.id);
        if (inventoryItem) {
            inventoryItem.quantity++;
        } else {
            GameState.current.inventory.push({ cardId: foundCard.id, quantity: 1, totalCost: 0 });
        }
        
        GameLogger.addLogMessage(`You kept the ${foundCard.name}!`);
        delete GameState.current.tempFoundCard;
        UIElements.eventModal.classList.add('hidden');
        UIRenderer.renderAll();
    },

    /**
     * Handles the player's choice to return a card found via the 'Found Card' event.
     * Grants the player a temporary store discount for the current day.
     */
    returnFoundCard() {
        const foundCard = GameState.current.tempFoundCard;
        if (!foundCard) return;
        
        let discountPercent; // Discount varies by the value of the returned card.
        if (foundCard.basePrice < 50) discountPercent = Math.random() * 2 + 3;       // 3-5%
        else if (foundCard.basePrice < 200) discountPercent = Math.random() * 3 + 5; // 5-8%
        else discountPercent = Math.random() * 3 + 7;                               // 7-10%
        
        GameState.current.storeDiscount = discountPercent;
        
        GameLogger.addLogMessage(`You returned the ${foundCard.name} to the store. They gave you a ${Math.round(discountPercent)}% discount for today!`);
        delete GameState.current.tempFoundCard;
        UIElements.eventModal.classList.add('hidden');
        UIRenderer.renderAll();
    },

    // Clears event-related modifications from a specific location's market data.
    // This function is CRITICAL for resetting event-driven price changes.
    // It should be called when appropriate, for example:
    // - When the player leaves a location where an event was active.
    // - After a certain number of days if events are time-limited (not implemented here).
    // - Potentially at the start of a new day for the current location if events are daily.
    // Currently, it also clears ALL activeEvents globally, which might be too broad if multiple
    // events in different locations were meant to persist simultaneously.
    clearOldEvents(locationId) {
        const locationMarket = GameState.market[locationId];
        if (!locationMarket) return;

        Object.keys(locationMarket).forEach(cardId => {
            if (locationMarket[cardId] && locationMarket[cardId].eventModified) {
                delete locationMarket[cardId].eventModified;
            }
        });
        GameState.current.activeEvents = [];
    },

    // Displays a modal for local events (Player Sighting, Found Card, or local Card Show/Market Flood).
    // Handles showing choices for 'found_card' type events.
    showEventModal(eventResult) {
        if (!UIElements.eventModal || !document.getElementById('event-title') || !document.getElementById('event-message') || !UIElements.closeEventModalBtn) {
            console.error("Event modal UI elements not found.");
            return;
        }
        document.getElementById('event-title').textContent = eventResult.title;
        document.getElementById('event-message').textContent = eventResult.message;
        
        const modalContent = UIElements.eventModal.querySelector('.modal-content');
        if (!modalContent) return;

        const existingChoices = modalContent.querySelector('.event-choices');
        if (existingChoices) existingChoices.remove();
        
        if (eventResult.showChoices && eventResult.type === 'found_card') {
            UIElements.closeEventModalBtn.style.display = 'none';
            
            const choicesDiv = document.createElement('div');
            choicesDiv.className = 'event-choices flex gap-4 justify-center mt-4';
            
            const keepBtn = document.createElement('button');
            keepBtn.className = 'btn btn-success';
            keepBtn.textContent = 'Keep It';
            keepBtn.onclick = () => this.keepFoundCard();
            
            const returnBtn = document.createElement('button');
            returnBtn.className = 'btn btn-primary';
            returnBtn.textContent = 'Return to Store';
            returnBtn.onclick = () => this.returnFoundCard();
            
            choicesDiv.appendChild(keepBtn);
            choicesDiv.appendChild(returnBtn);
            modalContent.appendChild(choicesDiv);
        } else {
            UIElements.closeEventModalBtn.style.display = 'inline-block';
        }
        
        UIElements.eventModal.classList.remove('hidden');
    },

    // Displays an announcement modal for remote events (Card Show or Market Flood in another town).
    // Provides choices to travel to the event location or ignore the event.
    showAnnouncementModal(eventData) {
        if (!UIElements.announcementModal || !document.getElementById('announcement-title') || !document.getElementById('announcement-message') || !document.getElementById('announcement-choices')) {
            console.error("Announcement modal UI elements not found.");
            return;
        }
        document.getElementById('announcement-title').textContent = 
            (eventData.type === 'card_show') ? "Card Show Announced!" : "Market Flood Rumor!";
        document.getElementById('announcement-message').textContent = eventData.message;
        
        const choicesDiv = document.getElementById('announcement-choices');
        choicesDiv.innerHTML = '';

        const travelBtn = document.createElement('button');
        travelBtn.className = 'btn btn-success';
        const eventLocationDetails = GameData.locations.find(l => l.id === eventData.location);
        travelBtn.textContent = `Travel to ${eventLocationDetails?.name || 'Unknown Location'}`;
        travelBtn.onclick = () => {
            UIElements.announcementModal.classList.add('hidden');
            Travel.travelTo(eventData.location);
        };

        const ignoreBtn = document.createElement('button');
        ignoreBtn.className = 'btn btn-danger';
        ignoreBtn.textContent = 'Ignore';
        ignoreBtn.onclick = () => {
            GameState.current.pendingEvent = null;
            UIElements.announcementModal.classList.add('hidden');
        };

        choicesDiv.appendChild(travelBtn);
        choicesDiv.appendChild(ignoreBtn);

        UIElements.announcementModal.classList.remove('hidden');
    }
};
