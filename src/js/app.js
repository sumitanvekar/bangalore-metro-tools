/**
 * Main App Entry Point
 */
import { dataStore } from './data/data-store.js';
import { Navigation } from './components/navigation.js';

// Import all components to register them
import './components/station-dropdown.js';
import './components/journey-planner.js';
import './components/next-train.js';
import './components/schedule-viewer.js';
import './components/route-display.js';

class App {
    constructor() {
        this.navigation = null;
        this.deferredPrompt = null;
    }

    async init() {
        try {
            // Load metro data
            await dataStore.loadData();

            // Initialize navigation
            this.navigation = new Navigation();

            // Update last updated date
            this.updateLastUpdated();

            // Hide loading, show content
            this.showContent();

            // Setup PWA install prompt
            this.setupPWA();

            console.log('✓ App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load metro data. Please refresh the page.');
        }
    }

    showContent() {
        const loadingState = document.getElementById('loadingState');
        const tabContent = document.getElementById('tabContent');

        if (loadingState) {
            loadingState.classList.add('hidden');
        }

        if (tabContent) {
            tabContent.classList.remove('hidden');
        }
    }

    showError(message) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="error-state max-w-md mx-auto">
                    <svg class="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-lg font-semibold">${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary mt-4">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    updateLastUpdated() {
        const lastUpdated = dataStore.getLastUpdated();
        const element = document.getElementById('lastUpdated');
        if (element) {
            element.textContent = lastUpdated;
        }
    }

    setupPWA() {
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            // Show install button
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.classList.remove('hidden');

                installBtn.addEventListener('click', async () => {
                    if (!this.deferredPrompt) return;

                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;

                    console.log(`User ${outcome} the install prompt`);

                    if (outcome === 'accepted') {
                        installBtn.classList.add('hidden');
                    }

                    this.deferredPrompt = null;
                });
            }
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('✓ PWA installed successfully');
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.classList.add('hidden');
            }
        });

        // Service Worker registered by vite-plugin-pwa
        if ('serviceWorker' in navigator) {
            console.log('✓ Service Worker will be registered by Vite PWA plugin');
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}

export default App;
