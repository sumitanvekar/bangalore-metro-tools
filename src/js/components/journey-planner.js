/**
 * Journey Planner Component
 */
import { routeFinder } from '../services/route-finder.js';
import './station-dropdown.js';
import './route-display.js';

export class JourneyPlanner extends HTMLElement {
    constructor() {
        super();
        this.fromStation = null;
        this.toStation = null;
        this.currentRoute = null;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="journey-planner" class="component-padding">
                <div class="card">

                    <div class="flex-col-gap">
                        <!-- From Station -->
                        <div>
                            <label class="form-label">
                                From
                            </label>
                            <station-dropdown
                                id="fromStation"
                                placeholder="Select starting station"
                            ></station-dropdown>
                        </div>

                        <!-- Swap Button -->
                        <div style="display: flex; justify-content: center;">
                            <button
                                id="swapBtn"
                                class="swap-button"
                                disabled
                            >
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- To Station -->
                        <div>
                            <label class="form-label">
                                To
                            </label>
                            <station-dropdown
                                id="toStation"
                                placeholder="Select destination station"
                            ></station-dropdown>
                        </div>

                        <!-- Find Route Button -->
                        <button
                            id="findRouteBtn"
                            class="btn btn-primary"
                            style="width: 100%; margin-top: var(--spacing-md);"
                            disabled
                        >
                            Find Route
                        </button>
                    </div>
                </div>

                <!-- Route Display -->
                <div id="routeResult" style="margin-top: var(--spacing-lg);"></div>
            </div>
        `;
    }

    attachEventListeners() {
        const fromDropdown = this.querySelector('#fromStation');
        const toDropdown = this.querySelector('#toStation');
        const swapBtn = this.querySelector('#swapBtn');
        const findRouteBtn = this.querySelector('#findRouteBtn');

        // Listen for station selections
        fromDropdown.addEventListener('station-selected', (e) => {
            this.fromStation = e.detail.station;
            this.updateUI();
            // Update To dropdown to exclude selected station
            toDropdown.setAttribute('exclude-station', this.fromStation.id);
        });

        toDropdown.addEventListener('station-selected', (e) => {
            this.toStation = e.detail.station;
            this.updateUI();
        });

        // Swap button
        swapBtn.addEventListener('click', () => {
            this.swapStations();
        });

        // Find route button
        findRouteBtn.addEventListener('click', () => {
            this.findRoute();
        });
    }

    updateUI() {
        const swapBtn = this.querySelector('#swapBtn');
        const findRouteBtn = this.querySelector('#findRouteBtn');

        // Enable swap button if both stations selected
        swapBtn.disabled = !(this.fromStation && this.toStation);

        // Enable find route button if both stations selected
        findRouteBtn.disabled = !(this.fromStation && this.toStation);
    }

    swapStations() {
        if (!this.fromStation || !this.toStation) return;

        const temp = this.fromStation;
        this.fromStation = this.toStation;
        this.toStation = temp;

        // Update dropdowns
        const fromDropdown = this.querySelector('#fromStation');
        const toDropdown = this.querySelector('#toStation');

        fromDropdown.setValue(this.fromStation);
        toDropdown.setValue(this.toStation);

        // Update exclusions
        toDropdown.setAttribute('exclude-station', this.fromStation.id);

        // Re-find route if one was already found
        if (this.currentRoute) {
            this.findRoute();
        }
    }

    findRoute() {
        if (!this.fromStation || !this.toStation) return;

        const routeResult = this.querySelector('#routeResult');

        // Show loading
        routeResult.innerHTML = '<div class="card text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div><p class="mt-4 text-gray-600">Finding route...</p></div>';

        // Find route (simulate async with setTimeout)
        setTimeout(() => {
            const route = routeFinder.findRoute(this.fromStation.id, this.toStation.id);

            if (!route) {
                routeResult.innerHTML = `
                    <div class="card error-state">
                        <p>No route found between ${this.fromStation.name} and ${this.toStation.name}.</p>
                    </div>
                `;
                return;
            }

            this.currentRoute = route;
            this.displayRoute(route);
        }, 300);
    }

    displayRoute(route) {
        const routeResult = this.querySelector('#routeResult');

        const routeDisplay = document.createElement('route-display');
        routeDisplay.setRoute(route, this.fromStation, this.toStation);

        routeResult.innerHTML = '';
        routeResult.appendChild(routeDisplay);
    }
}

customElements.define('journey-planner', JourneyPlanner);
