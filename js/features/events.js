import { GameState } from '../core/gameState.js';
import { GameConfig } from '../config/gameConfig.js';
import { GameData } from '../config/gameData.js';
import { GameLogger } from '../core/gameLogger.js';
import { UIElements } from '../ui/uiElements.js';
import { UIRenderer } from '../ui/uiRenderer.js';
import { Travel } from './travel.js';

export const Events = {
    checkForTravelEvent() {
        if (Math.random() > GameConfig.travelEventChance || GameState.current.pendingEvent) return;

        const localEvents = [{ type: 'player_sighting', weight: 30 }, { type: 'found_card', weight: 30 }];
        const remoteEvents = [{ type: 'card_show', weight: 20 }, { type: 'market_flood', weight: 20 }];
        const allEvents = [...localEvents, ...remoteEvents];
        
        const totalWeight = allEvents.reduce((sum, event) => sum + event.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const event of allEvents) {
            random -= event.weight;
            if (random <= 0) {
                if (remoteEvents.find(e => e.type === event.type)) {
                    const otherLocations = GameData.locations.filter(l => l.id !== GameState.current.currentLocationId);
                    const eventLocation = otherLocations[Math.floor(Math.random() * otherLocations.length)];
                    this.executeEvent(event.type, eventLocation.id, true);
                } else {
                    this.executeEvent(event.type, GameState.current.currentLocationId, false);
                }
                return;
            }
        }
    },

    executeEvent(eventType, locationId, isRemote) {
        switch (eventType) {
            case 'card_show':
                return this.executeCardShow(locationId, isRemote);
            case 'market_flood':
                return this.executeMarketFlood(locationId, isRemote);
            case 'player_sighting':
                return this.executePlayerSighting();
            case 'found_card':
                return this.executeFoundCard();
        }
    },

    executeCardShow(locationId, isRemote) {
        const targetLocation = GameData.locations.find(loc => loc.id === locationId);
        const numCards = Math.floor(Math.random() * 3) + 3;
        const selectedCards = [];
        const availableCards = GameData.tradableCards.filter(c => c.basePrice >= 50);
        
        for (let i = 0; i < numCards && i < availableCards.length; i++) {
            const randomIndex = Math.floor(Math.random() * availableCards.length);
            const card = availableCards.splice(randomIndex, 1)[0];
            selectedCards.push({ cardId: card.id });
        }
        
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
            const cardNames = selectedCards.map(sc => GameState.getCardDetails(sc.cardId).name).join(', ');
            this.showEventModal({
                title: "Card Show in Town!",
                message: `A traveling card show has arrived! The following cards have increased in value: ${cardNames}`
            });
        }
    },

    executeMarketFlood(locationId, isRemote) {
        const targetLocation = GameData.locations.find(loc => loc.id === locationId);
        const availableCards = GameData.tradableCards.filter(c => c.basePrice >= 20);
        const targetCard = availableCards[Math.floor(Math.random() * availableCards.length)];
        
        const eventData = {
            type: 'market_flood',
            location: locationId,
            affectedCard: targetCard.id,
            message: `You hear a rumor that a huge collection was found near ${targetLocation.name}, flooding the market.`
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

    applyEventEffects(eventData) {
        const locationMarket = GameState.market[eventData.location];
        if (!locationMarket) return;

        if (eventData.type === 'card_show') {
            eventData.affectedCards.forEach(({ cardId }) => {
                if (locationMarket[cardId]) {
                    const boostPercent = Math.random() * 20 + 10;
                    locationMarket[cardId].price = Math.round(locationMarket[cardId].price * (1 + boostPercent / 100));
                    locationMarket[cardId].eventModified = true;
                }
            });
        } else if (eventData.type === 'market_flood') {
            if (locationMarket[eventData.affectedCard]) {
                const dropPercent = Math.random() * 30 + 20;
                locationMarket[eventData.affectedCard].price = Math.round(locationMarket[eventData.affectedCard].price * (1 - dropPercent / 100));
                locationMarket[eventData.affectedCard].eventModified = true;
            }
        }
    },

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

    executeFoundCard() {
        const lootTable = [];
        GameData.tradableCards.forEach(card => {
            let weight = 1;
            if (card.basePrice < 50) weight = 10;
            else if (card.basePrice < 100) weight = 5;
            else if (card.basePrice < 200) weight = 2;
            for (let i = 0; i < weight; i++) lootTable.push(card);
        });
        
        const foundCard = lootTable[Math.floor(Math.random() * lootTable.length)];
        GameState.current.tempFoundCard = foundCard;
        
        this.showEventModal({
            title: "Lucky Find!",
            message: `You found a ${foundCard.name} on the ground! Keep it or return it to the store?`,
            showChoices: true,
            type: 'found_card'
        });
    },

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

    returnFoundCard() {
        const foundCard = GameState.current.tempFoundCard;
        if (!foundCard) return;
        
        let discountPercent;
        if (foundCard.basePrice < 50) discountPercent = Math.random() * 2 + 3;
        else if (foundCard.basePrice < 200) discountPercent = Math.random() * 3 + 5;
        else discountPercent = Math.random() * 3 + 7;
        
        GameState.current.storeDiscount = discountPercent;
        
        GameLogger.addLogMessage(`You returned the ${foundCard.name} to the store. They gave you a ${Math.round(discountPercent)}% discount for today!`);
        delete GameState.current.tempFoundCard;
        UIElements.eventModal.classList.add('hidden');
        UIRenderer.renderAll();
    },

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

    showEventModal(eventResult) {
        document.getElementById('event-title').textContent = eventResult.title;
        document.getElementById('event-message').textContent = eventResult.message;
        
        const modalContent = UIElements.eventModal.querySelector('.modal-content');
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

    showAnnouncementModal(eventData) {
        document.getElementById('announcement-title').textContent = 
            (eventData.type === 'card_show') ? "Card Show Announced!" : "Market Flood Rumor!";
        document.getElementById('announcement-message').textContent = eventData.message;
        
        const choicesDiv = document.getElementById('announcement-choices');
        choicesDiv.innerHTML = '';

        const travelBtn = document.createElement('button');
        travelBtn.className = 'btn btn-success';
        travelBtn.textContent = `Travel to ${GameData.locations.find(l => l.id === eventData.location).name}`;
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
