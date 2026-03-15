/**
 * Station Dropdown Component - Searchable, grouped by line
 */
import { dataStore } from '../data/data-store.js';

export class StationDropdown extends HTMLElement {
    constructor() {
        super();
        this.selectedStation = null;
        this.focusedIndex = -1;
        this.filteredStations = [];
        this.isOpen = false;
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || 'Select a station';
        const excludeStation = this.getAttribute('exclude-station');

        this.innerHTML = `
            <div class="station-dropdown">
                <input
                    type="text"
                    class="dropdown-input"
                    placeholder="${placeholder}"
                    autocomplete="off"
                    role="combobox"
                    aria-expanded="false"
                    aria-autocomplete="list"
                />
                <div class="dropdown-list hidden" role="listbox"></div>
            </div>
        `;

        this.input = this.querySelector('.dropdown-input');
        this.dropdown = this.querySelector('.dropdown-list');
        this.excludeStationId = excludeStation;
    }

    attachEventListeners() {
        // Input events
        this.input.addEventListener('focus', () => this.openDropdown());
        this.input.addEventListener('input', (e) => this.filterStations(e.target.value));
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    openDropdown() {
        this.isOpen = true;
        this.input.setAttribute('aria-expanded', 'true');
        this.filterStations(this.input.value);
        this.dropdown.classList.remove('hidden');
    }

    closeDropdown() {
        this.isOpen = false;
        this.input.setAttribute('aria-expanded', 'false');
        this.dropdown.classList.add('hidden');
        this.focusedIndex = -1;
    }

    filterStations(query) {
        const stationsGrouped = dataStore.getStationsGroupedByLine();
        this.filteredStations = [];

        const lowerQuery = query.toLowerCase();

        this.dropdown.innerHTML = '';

        Object.keys(stationsGrouped).forEach(lineId => {
            const stations = stationsGrouped[lineId].filter(station => {
                // Exclude specified station
                if (this.excludeStationId && station.id === this.excludeStationId) {
                    return false;
                }
                // Filter by search query
                if (query && !station.name.toLowerCase().includes(lowerQuery)) {
                    return false;
                }
                return true;
            });

            if (stations.length > 0) {
                this.renderGroup(lineId, stations);
                this.filteredStations.push(...stations);
            }
        });

        if (this.filteredStations.length === 0) {
            this.dropdown.innerHTML = '<div class="empty-state" style="padding: 1rem;">No stations found</div>';
        }
    }

    renderGroup(lineId, stations) {
        const lineColors = {
            purple: '#9B59B6',
            green: '#27AE60',
            yellow: '#F1C40F'
        };

        const groupDiv = document.createElement('div');
        groupDiv.className = 'dropdown-group';

        const label = document.createElement('div');
        label.className = 'dropdown-group-label';
        label.innerHTML = `
            <div class="line-indicator ${lineId}" style="background-color: ${lineColors[lineId]}"></div>
            <span>${stations[0].lineName}</span>
        `;
        groupDiv.appendChild(label);

        stations.forEach(station => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-station-id', station.id);

            const isInterchange = dataStore.isInterchange(station.id);

            item.innerHTML = `
                <div class="line-indicator ${lineId}" style="background-color: ${lineColors[lineId]}"></div>
                <span class="station-name">${station.name}</span>
                <div class="station-badges">
                    ${isInterchange ? '<span class="interchange-badge">⇄ Interchange</span>' : ''}
                </div>
            `;

            item.addEventListener('click', () => this.selectStation(station));
            groupDiv.appendChild(item);
        });

        this.dropdown.appendChild(groupDiv);
    }

    selectStation(station) {
        this.selectedStation = station;
        this.input.value = station.name;
        this.closeDropdown();

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('station-selected', {
            detail: { station },
            bubbles: true
        }));
    }

    handleKeydown(e) {
        if (!this.isOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.openDropdown();
            }
            return;
        }

        const items = this.dropdown.querySelectorAll('.dropdown-item');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusedIndex = Math.min(this.focusedIndex + 1, items.length - 1);
                this.updateFocus(items);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
                this.updateFocus(items);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.focusedIndex >= 0 && items[this.focusedIndex]) {
                    const stationId = items[this.focusedIndex].getAttribute('data-station-id');
                    const station = dataStore.getStation(stationId);
                    if (station) {
                        this.selectStation(station);
                    }
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.closeDropdown();
                break;
        }
    }

    updateFocus(items) {
        items.forEach((item, index) => {
            if (index === this.focusedIndex) {
                item.classList.add('focused');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('focused');
            }
        });
    }

    getSelectedStation() {
        return this.selectedStation;
    }

    reset() {
        this.selectedStation = null;
        this.input.value = '';
        this.closeDropdown();
    }

    setValue(station) {
        if (station) {
            this.selectedStation = station;
            this.input.value = station.name;
        }
    }
}

customElements.define('station-dropdown', StationDropdown);
