/**
 * Schedule Viewer Component
 */
import { scheduleService } from '../services/schedule-service.js';
import './simple-dropdown.js';

export class ScheduleViewer extends HTMLElement {
    constructor() {
        super();
        this.selectedLine = 'purple';
    }

    async connectedCallback() {
        this.render();

        // Wait for data to be loaded
        const { dataStore } = await import('../data/data-store.js');
        if (!dataStore.loaded) {
            await dataStore.loadData();
        }

        this.initializeFilters();
        this.attachEventListeners();
        this.loadSchedule();
    }

    initializeFilters() {
        const lineFilter = this.querySelector('#lineFilter');

        // Set line options
        lineFilter.setOptions([
            { value: 'purple', label: 'Purple Line' },
            { value: 'green', label: 'Green Line' },
            { value: 'yellow', label: 'Yellow Line' }
        ], this.selectedLine);
    }

    render() {
        this.innerHTML = `
            <div class="schedule-viewer" class="component-padding">
                <div class="card">
                    <!-- Filters -->
                    <div class="filters">
                        <div class="filter-group">
                            <label class="filter-label">Line</label>
                            <simple-dropdown id="lineFilter" placeholder="Select line"></simple-dropdown>
                        </div>
                    </div>

                    <!-- Schedule Display -->
                    <div id="scheduleContent" class="mt-6"></div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const lineFilter = this.querySelector('#lineFilter');

        lineFilter.addEventListener('dropdown-change', (e) => {
            this.selectedLine = e.detail.value;
            this.loadSchedule();
        });
    }

    loadSchedule() {
        const scheduleContent = this.querySelector('#scheduleContent');

        // Get all available day types for this line
        const availableDays = scheduleService.getAvailableDayTypes(this.selectedLine);

        if (availableDays.length === 0) {
            scheduleContent.innerHTML = '<div class="empty-state">No schedule data available</div>';
            return;
        }

        // Build HTML for all day types
        let html = '';

        availableDays.forEach((dayInfo, index) => {
            const scheduleData = scheduleService.getLineSchedule(this.selectedLine, dayInfo.value);

            if (scheduleData && scheduleData.schedule) {
                // Add separator between day types
                if (index > 0) {
                    html += '<div style="height: var(--spacing-xl); border-top: 2px solid var(--border); margin: var(--spacing-xl) 0;"></div>';
                }

                // Add day type header
                html += `
                    <div class="mb-4">
                        <h3 class="text-lg font-bold flex items-center gap-2">
                            <span class="line-badge ${this.selectedLine}">${scheduleData.line}</span>
                            <span class="text-gray-600 text-sm ml-2">${dayInfo.label}</span>
                        </h3>
                    </div>
                `;

                // Add schedule content (all lines now use frequency format)
                html += this.getFrequencyScheduleHTML(scheduleData, dayInfo.value);
            }
        });

        scheduleContent.innerHTML = html;
    }

    getFrequencyScheduleHTML(scheduleData, dayType) {
        const formatted = scheduleService.formatFrequencySchedule(scheduleData.schedule);
        let html = '';

        formatted.forEach(origin => {
            html += `
                <div class="mb-6 pb-6 border-b last:border-0">
                    <h4 class="font-semibold text-gray-800 mb-3">${origin.origin}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-xs text-gray-600 mb-1">First Train</div>
                            <div class="text-xl font-bold text-green-600 font-mono">${origin.firstTrain}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-xs text-gray-600 mb-1">Last Train</div>
                            <div class="text-xl font-bold text-red-600 font-mono">${origin.lastTrain}</div>
                        </div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-700 mb-2">Frequency Throughout Day</div>
                        <div class="space-y-2">
                            ${origin.peakHours.map(period => `
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span class="text-sm text-gray-700 font-mono">${period.period}</span>
                                    <span class="font-semibold text-purple-600">Every ${period.frequency}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

        // Key stations
        const keyStations = scheduleService.getKeyStationTimes(this.selectedLine, dayType);
        if (keyStations.length > 0) {
            html += `
                <div class="mt-6 pt-6 border-t">
                    <h4 class="font-semibold text-gray-800 mb-4">Key Station Times</h4>
                    <div class="space-y-3">
                        ${keyStations.map(station => this.renderKeyStation(station)).join('')}
                    </div>
                </div>
            `;
        }

        // Short loops
        const shortLoops = scheduleService.getShortLoops(this.selectedLine, dayType);
        if (shortLoops && shortLoops.length > 0) {
            html += `
                <div class="mt-6 pt-6 border-t">
                    <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>Short Loops</span>
                        <span class="text-xs font-normal text-gray-600">(Trains between intermediate stations)</span>
                    </h4>
                    <div class="space-y-4">
                        ${shortLoops.map(loop => this.renderShortLoop(loop)).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    }

    getFixedScheduleHTML(scheduleData) {
        const formatted = scheduleService.formatFixedSchedule(scheduleData.schedule);
        let html = '';

        formatted.forEach(origin => {
            html += `
                <div class="mb-6 pb-6 border-b last:border-0">
                    <h4 class="font-semibold text-gray-800 mb-3">${origin.origin}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-xs text-gray-600 mb-1">First Train</div>
                            <div class="text-xl font-bold text-green-600 font-mono">${origin.firstTrain}</div>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <div class="text-xs text-gray-600 mb-1">Last Train</div>
                            <div class="text-xl font-bold text-red-600 font-mono">${origin.lastTrain}</div>
                        </div>
                    </div>
                    <div>
                        <div class="text-sm font-semibold text-gray-700 mb-2">Departure Times (${origin.frequency})</div>
                        <div class="grid grid-cols-4 md:grid-cols-6 gap-2">
                            ${origin.trains.map(time => `
                                <div class="p-2 bg-gray-50 rounded text-center font-mono text-sm">${time}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

        return html;
    }

    renderKeyStation(station) {
        const directions = Object.keys(station.times);

        return `
            <div class="bg-gray-50 p-3 rounded-lg">
                <div class="font-semibold text-gray-800 mb-2">${station.station}</div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    ${directions.map(dir => `
                        <div>
                            <div class="text-xs text-gray-600">${this.formatDirection(dir)}</div>
                            <div class="font-mono">${station.times[dir].first || '-'} - ${station.times[dir].last || '-'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderShortLoop(loop) {
        return `
            <div class="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                <div class="flex items-start justify-between gap-4 mb-3">
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800 mb-1">
                            ${this.formatStationName(loop.from)} → ${this.formatStationName(loop.to)}
                        </div>
                        <div class="text-xs text-orange-700">
                            ${loop.times.length} train${loop.times.length > 1 ? 's' : ''} • Short loop service
                        </div>
                    </div>
                    <span class="short-loop-badge">Short Loop</span>
                </div>
                <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    ${loop.times.map(time => `
                        <div class="p-2 bg-white rounded text-center font-mono text-sm font-semibold text-orange-800 border border-orange-200">
                            ${time}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    formatStationName(stationKey) {
        const nameMap = {
            'nadaprabhu_kempegowda_majestic': 'Majestic',
            'mahatma_gandhi_road': 'MG Road',
            'pattandur_agrahara': 'Pattandur Agrahara',
            'baiyappanahalli': 'Baiyappanahalli',
            'mysuru_road': 'Mysuru Road',
            'whitefield': 'Whitefield',
            'challaghatta': 'Challaghatta',
            'kengeri': 'Kengeri'
        };
        return nameMap[stationKey] || stationKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatDayType(dayType) {
        const map = {
            'monday': 'Monday',
            'tuesday_to_friday': 'Tuesday to Friday',
            'tuesday_to_saturday': 'Tuesday to Saturday',
            'saturday': 'Saturday',
            'sunday': 'Sunday'
        };
        return map[dayType] || dayType;
    }

    formatDirection(direction) {
        return direction
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
}

customElements.define('schedule-viewer', ScheduleViewer);
