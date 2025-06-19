// js/ui/mobileNavigation.js
import { UIRenderer } from './uiRenderer.js'; // Import UIRenderer
import { UIElements } from './uiElements.js'; // Import UIElements for mobileMainContent

// Placeholder for view rendering functions (to be implemented in UIRenderer.js later)
// const renderMobileMarketView = (container) => { container.innerHTML = '<p class="text-xl font-semibold text-center">Market View Loaded</p>'; }; // Now in UIRenderer
const renderMobileInventoryView = (container) => { container.innerHTML = '<p class="text-xl font-semibold text-center">Inventory View Loaded</p>'; };
const renderMobileTravelView = (container) => { container.innerHTML = '<p class="text-xl font-semibold text-center">Travel View Loaded (Modal)</p>'; /* Will trigger modal */ };
const renderMobileLogView = (container) => { container.innerHTML = '<p class="text-xl font-semibold text-center">Log View Loaded (Modal)</p>'; /* Will trigger modal */ };
const renderMobileCabinetView = (container) => { container.innerHTML = '<p class="text-xl font-semibold text-center">Cabinet View Loaded (Modal)</p>'; /* Will trigger modal */ };


export const MobileNavigation = {
    navButtons: [],
    mainContentContainer: null,
    currentView: 'market', // Default view
    activeButtonClasses: ['text-red-500', 'bg-gray-700'], // Classes for active nav button
    inactiveButtonClasses: ['text-gray-400', 'hover:text-red-400', 'bg-gray-800'], // Classes for inactive nav button (bg-gray-800 to revert active bg)

    init() {
        this.mainContentContainer = UIElements.mobileMainContent; // Use UIElements
        const navContainer = document.getElementById('mobile-bottom-nav');

        if (!navContainer || !this.mainContentContainer) {
            console.error("Mobile navigation elements not found!");
            return;
        }

        this.navButtons = Array.from(navContainer.getElementsByTagName('button'));

        this.navButtons.forEach(button => {
            button.addEventListener('click', () => this.handleNavClick(button));
        });

        // Load initial view (e.g., market)
        const initialActiveButton = this.navButtons.find(btn => btn.classList.contains('text-red-500')); // Find based on initial active class
        if (initialActiveButton) {
            this.navigateToView(initialActiveButton.dataset.view);
        } else if (this.navButtons.length > 0) {
            this.handleNavClick(this.navButtons[0]); // Default to first button if none are pre-marked as active
        }
    },

    handleNavClick(clickedButton) {
        const viewName = clickedButton.dataset.view;
        if (!viewName) return;

        this.updateNavButtonStates(clickedButton);
        this.navigateToView(viewName, false); // false indicates not a refresh
    },

    updateNavButtonStates(activeButton) {
        this.navButtons.forEach(button => {
            if (button === activeButton) {
                button.classList.remove(...this.inactiveButtonClasses.filter(c => !c.startsWith('hover:')));
                button.classList.add(...this.activeButtonClasses);
            } else {
                button.classList.remove(...this.activeButtonClasses);
                button.classList.add(...this.inactiveButtonClasses.filter(c => !c.startsWith('hover:')));
                if (!button.classList.contains('hover:text-red-400') && this.inactiveButtonClasses.includes('hover:text-red-400')) {
                     button.classList.add('hover:text-red-400');
                }
            }
        });
    },

    getCurrentView() {
        return this.currentView;
    },

    navigateToView(viewName, isRefresh = false) {
        if (!this.mainContentContainer) return;

        // Only clear and update currentView if it's not a refresh of the same view
        // or if the view actually changes (for modal type views)
        if (!isRefresh || this.currentView !== viewName) {
            this.mainContentContainer.innerHTML = ''; // Clear previous content only if view changes or not a modal
        }

        if (viewName !== 'travel' && viewName !== 'log' && viewName !== 'cabinet') { // Non-modal views
            this.currentView = viewName;
        }


        // Call the appropriate rendering function based on viewName
        // These will be replaced with actual calls to UIRenderer methods later
        switch (viewName) {
            case 'market':
                UIRenderer.renderMobileMarketView(this.mainContentContainer); // Use actual renderer
                break;
            case 'inventory':
                UIRenderer.renderMobileInventoryView(this.mainContentContainer); // Use actual renderer
                break;
            case 'travel':
                UIRenderer.renderMobileTravelModal(); // Show the travel modal
                // The main content area remains as is (or could show a travel placeholder)
                // For now, we keep the previous view in main content.
                break;
            case 'log':
                UIRenderer.renderMobileLogModal(); // Show the log modal
                break;
            case 'cabinet':
                UIRenderer.renderMobileCabinetModal(); // Show the cabinet modal
                break;
            default:
                this.mainContentContainer.innerHTML = `<p>Unknown view: ${viewName}</p>`;
        }
    }
};
