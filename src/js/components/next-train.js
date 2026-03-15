/**
 * Next Train Component
 */
import { nextTrainFinder } from '../services/next-train-finder.js';
import { formatCountdown, getUrgencyLevel } from '../utils/time-utils.js';
import { getDayName } from '../utils/date-utils.js';
import './station-dropdown.js';
import './direction-dropdown.js';

export class NextTrain extends HTMLElement {
    constructor() {
        super();
        this.selectedStation = null;
        this.selectedDirection = null;
        this.selectedDirectionLabel = null;
        this.trains = [];
        this.updateInterval = null;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    disconnectedCallback() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    render() {
        this.innerHTML = `
            <div class="next-train" class="component-padding">
                <div class="card">

                    <div class="flex-col-gap">
                        <!-- Station Selection -->
                        <div>
                            <label class="form-label">
                                Select Station
                            </label>
                            <station-dropdown
                                id="stationSelect"
                                placeholder="Choose a station"
                            ></station-dropdown>
                        </div>

                        <!-- Direction Selection -->
                        <div id="directionContainer" class="hidden">
                            <label class="form-label">
                                Direction
                            </label>
                            <direction-dropdown
                                id="directionSelect"
                                placeholder="Choose direction"
                            ></direction-dropdown>
                        </div>

                        <!-- Get Trains Button -->
                        <button
                            id="getTrainsBtn"
                            class="btn btn-primary full-width"
                            disabled
                        >
                            Get Next Trains
                        </button>
                    </div>
                </div>

                <!-- Trains Display -->
                <div id="trainsResult" class="mt-4"></div>
            </div>
        `;
    }

    attachEventListeners() {
        const stationDropdown = this.querySelector('#stationSelect');
        const directionContainer = this.querySelector('#directionContainer');
        const directionDropdown = this.querySelector('#directionSelect');
        const getTrainsBtn = this.querySelector('#getTrainsBtn');

        stationDropdown.addEventListener('station-selected', (e) => {
            this.selectedStation = e.detail.station;
            this.loadDirections();
            directionContainer.classList.remove('hidden');
            this.updateUI();
        });

        directionDropdown.addEventListener('direction-selected', (e) => {
            this.selectedDirection = e.detail.direction.value;
            this.selectedDirectionLabel = e.detail.direction.label;
            this.updateUI();
        });

        getTrainsBtn.addEventListener('click', () => {
            this.getNextTrains();
        });
    }

    loadDirections() {
        if (!this.selectedStation) return;

        const directions = nextTrainFinder.getDirectionOptions(this.selectedStation.id);
        const directionDropdown = this.querySelector('#directionSelect');

        // Set directions in the custom dropdown
        directionDropdown.setDirections(directions);

        // Auto-select first direction (component handles this internally now)
        if (directions.length > 0) {
            this.selectedDirection = directions[0].value;
            this.selectedDirectionLabel = directions[0].label;
        }
    }

    updateUI() {
        const getTrainsBtn = this.querySelector('#getTrainsBtn');
        getTrainsBtn.disabled = !(this.selectedStation && this.selectedDirection);
    }

    getNextTrains() {
        if (!this.selectedStation || !this.selectedDirection) return;

        const trainsResult = this.querySelector('#trainsResult');

        // Show loading
        trainsResult.innerHTML = '<div class="card text-center py-8"><div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div><p class="mt-4 text-gray-600">Finding trains...</p></div>';

        // Get trains
        setTimeout(() => {
            const result = nextTrainFinder.getNextTrains(
                this.selectedStation.id,
                this.selectedDirection
            );

            if (result.error) {
                trainsResult.innerHTML = `
                    <div class="card error-state">
                        <p>${result.error}</p>
                    </div>
                `;
                return;
            }

            this.trains = result.trains;
            this.displayTrains(result);

            // Start auto-refresh
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            this.updateInterval = setInterval(() => {
                this.refreshTrains();
            }, 60000); // Update every minute
        }, 300);
    }

    displayTrains(result) {
        const trainsResult = this.querySelector('#trainsResult');

        if (result.trains.length === 0) {
            trainsResult.innerHTML = `
                <div class="card empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="mt-4">No trains available at this time</p>
                </div>
            `;
            return;
        }

        trainsResult.innerHTML = `
            <div class="card">
                <div class="mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${result.station}</h3>
                    <p class="text-sm text-gray-600">${this.selectedDirectionLabel || 'Direction'}</p>
                    <p class="text-xs text-gray-500 mt-1">${getDayName()} • ${result.scheduleType === 'frequency-based' ? 'Frequency-based schedule' : 'Fixed schedule'}</p>
                </div>

                <div class="train-list">
                    ${result.trains.map((train, index) => this.renderTrain(train, index === 0)).join('')}
                </div>

                <div class="mt-4 pt-4 border-t text-center text-xs text-gray-500">
                    Times are approximate. Updates every minute.
                </div>
            </div>
        `;
    }

    renderTrain(train, isNext) {
        const urgency = getUrgencyLevel(train.minutesUntil);

        return `
            <div class="train-item ${isNext ? 'next-train' : ''}">
                <div>
                    <div class="train-time ${isNext ? 'text-accent' : ''}">${train.time}</div>
                    ${isNext ? '<div class="next-train-label">NEXT TRAIN</div>' : ''}
                </div>
                <div class="train-countdown ${urgency}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>${formatCountdown(train.minutesUntil)}</span>
                </div>
            </div>
        `;
    }

    refreshTrains() {
        // Refresh train times without full reload
        if (!this.selectedStation || !this.selectedDirection) return;

        const result = nextTrainFinder.getNextTrains(
            this.selectedStation.id,
            this.selectedDirection
        );

        if (!result.error && result.trains.length > 0) {
            this.trains = result.trains;
            this.displayTrains(result);
        }
    }
}

customElements.define('next-train', NextTrain);
