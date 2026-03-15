/**
 * Route Display Component - Visualizes journey route
 */
import { formatDuration } from '../utils/time-utils.js';

export class RouteDisplay extends HTMLElement {
    constructor() {
        super();
        this.route = null;
        this.fromStation = null;
        this.toStation = null;
    }

    connectedCallback() {
        if (this.route) {
            this.render();
        }
    }

    setRoute(route, fromStation, toStation) {
        this.route = route;
        this.fromStation = fromStation;
        this.toStation = toStation;
        this.render();
    }

    render() {
        if (!this.route) return;

        this.innerHTML = `
            <div class="card route-container">
                <!-- Route Header -->
                <div class="route-header">
                    <h3 class="text-xl font-bold text-gray-800">Route Details</h3>
                    <div class="route-time">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="font-semibold">${formatDuration(this.route.estimatedTime)}</span>
                    </div>
                </div>

                <!-- Route Summary -->
                <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex justify-around text-center">
                        <div>
                            <div class="text-2xl font-bold text-purple-600">${this.route.totalStations}</div>
                            <div class="text-sm text-gray-600">Stations</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-purple-600">${this.route.transfers}</div>
                            <div class="text-sm text-gray-600">Transfer${this.route.transfers !== 1 ? 's' : ''}</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-purple-600">${formatDuration(this.route.estimatedTime)}</div>
                            <div class="text-sm text-gray-600">Est. Time</div>
                        </div>
                    </div>
                </div>

                <!-- Route Path -->
                <div class="route-path mt-6">
                    ${this.renderSegments()}
                </div>
            </div>
        `;
    }

    renderSegments() {
        let html = '';
        let isFirstSegment = true;

        this.route.segments.forEach((segment, index) => {
            if (segment.type === 'transfer') {
                html += this.renderTransfer(segment);
            } else {
                html += this.renderRouteSegment(segment, isFirstSegment, index === this.route.segments.length - 1);
                isFirstSegment = false;
            }
        });

        return html;
    }

    renderRouteSegment(segment, isFirst, isLast) {
        const lineClass = segment.line;

        return `
            <div class="route-segment">
                <div class="route-line-indicator">
                    <div class="route-dot ${lineClass}"></div>
                    ${!isLast ? `<div class="route-line ${lineClass}"></div>` : ''}
                </div>
                <div class="route-content">
                    <div class="station-info">${segment.from.name}</div>
                    <div class="station-details">
                        <span class="line-badge ${lineClass}">${segment.lineName}</span>
                        <span class="text-gray-600 ml-2">${segment.direction}</span>
                    </div>
                    ${isLast ? `
                        <div class="mt-4 pt-4 border-t">
                            <div class="station-info">${segment.to.name}</div>
                            <div class="station-details text-green-600 font-semibold">
                                <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Destination
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderTransfer(segment) {
        const fromLine = segment.fromLine;
        const toLine = segment.toLine;

        return `
            <div class="route-segment">
                <div class="route-line-indicator">
                    <div class="route-dot ${toLine}" style="border-width: 4px;"></div>
                    <div class="route-line ${toLine}"></div>
                </div>
                <div class="route-content">
                    <div class="transfer-info">
                        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                        <div>
                            <div class="font-semibold">Transfer at ${segment.station.name}</div>
                            <div class="text-xs mt-1">Allow ~5 minutes for platform change</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('route-display', RouteDisplay);
