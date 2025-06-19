import { UIElements } from './uiElements.js';
import { UIRenderer } from './uiRenderer.js';

export const UITabs = {
    init() {
        this.marketTab = document.getElementById('market-tab');
        this.inventoryTab = document.getElementById('inventory-tab');
        this.marketSection = document.getElementById('market-section');
        this.inventorySection = document.getElementById('inventory-section');

        if (this.marketTab && this.inventoryTab && this.marketSection && this.inventorySection) {
            this.marketTab.addEventListener('click', () => this.showMarketTab());
            this.inventoryTab.addEventListener('click', () => this.showInventoryTab());
        } else {
            console.error("Failed to initialize tabs: One or more tab elements not found.");
        }
    },

    showMarketTab() {
        this.marketSection.classList.remove('hidden');
        this.inventorySection.classList.add('hidden');

        this.marketTab.classList.add('active-tab', 'text-red-400', 'border-red-400');
        this.marketTab.classList.remove('inactive-tab', 'text-gray-400', 'hover:text-gray-200');

        this.inventoryTab.classList.add('inactive-tab', 'text-gray-400', 'hover:text-gray-200');
        this.inventoryTab.classList.remove('active-tab', 'text-red-400', 'border-red-400');

        // It might be necessary to re-render market if its data can change while hidden
        // UIRenderer.renderMarket();
    },

    showInventoryTab() {
        this.inventorySection.classList.remove('hidden');
        this.marketSection.classList.add('hidden');

        this.inventoryTab.classList.add('active-tab', 'text-red-400', 'border-red-400');
        this.inventoryTab.classList.remove('inactive-tab', 'text-gray-400', 'hover:text-gray-200');

        this.marketTab.classList.add('inactive-tab', 'text-gray-400', 'hover:text-gray-200');
        this.marketTab.classList.remove('active-tab', 'text-red-400', 'border-red-400');

        // Inventory should be re-rendered each time it's shown to reflect latest data
        UIRenderer.renderInventory();
    }
};
