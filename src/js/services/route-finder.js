/**
 * Route Finder Service - BFS algorithm for optimal routes
 */
import { dataStore } from '../data/data-store.js';
import { calculateTravelTime, getDirectionName } from '../utils/schedule-calculator.js';

export class RouteFinder {
    /**
     * Find optimal route between two stations
     */
    findRoute(fromStationId, toStationId) {
        const fromStation = dataStore.getStation(fromStationId);
        const toStation = dataStore.getStation(toStationId);

        if (!fromStation || !toStation) {
            return null;
        }

        if (fromStationId === toStationId) {
            return null;
        }

        // Check for direct route (same line)
        if (fromStation.lineId === toStation.lineId) {
            return this.buildDirectRoute(fromStation, toStation);
        }

        // Use BFS to find route with transfers
        return this.findRouteWithTransfers(fromStation, toStation);
    }

    /**
     * Build direct route on same line
     */
    buildDirectRoute(fromStation, toStation) {
        const lineStations = dataStore.getLineStations(fromStation.lineId);
        const fromIndex = lineStations.findIndex(s => s.id === fromStation.id);
        const toIndex = lineStations.findIndex(s => s.id === toStation.id);

        const stationsInBetween = Math.abs(toIndex - fromIndex);
        const direction = getDirectionName(fromStation, toStation, lineStations);

        return {
            type: 'direct',
            segments: [
                {
                    from: fromStation,
                    to: toStation,
                    line: fromStation.lineId,
                    lineColor: fromStation.lineColor,
                    lineName: fromStation.lineName,
                    stations: stationsInBetween + 1,
                    direction
                }
            ],
            totalStations: stationsInBetween + 1,
            transfers: 0,
            estimatedTime: calculateTravelTime(stationsInBetween, 0)
        };
    }

    /**
     * Find route with transfers using BFS
     */
    findRouteWithTransfers(fromStation, toStation) {
        const queue = [{
            station: fromStation,
            path: [fromStation],
            lines: [fromStation.lineId]
        }];

        const visited = new Set([fromStation.id]);
        const maxTransfers = 2; // Limit to 2 transfers

        while (queue.length > 0) {
            const current = queue.shift();
            const currentStation = current.station;

            // Check if we reached destination
            if (currentStation.id === toStation.id) {
                return this.buildRouteFromPath(current.path, current.lines);
            }

            // Skip if too many transfers
            const transfers = new Set(current.lines).size - 1;
            if (transfers > maxTransfers) {
                continue;
            }

            // Get adjacent stations
            const adjacent = dataStore.getAdjacentStations(currentStation.id);

            for (const nextStation of adjacent) {
                if (!visited.has(nextStation.id)) {
                    visited.add(nextStation.id);

                    const newLines = [...current.lines];
                    if (nextStation.lineId !== currentStation.lineId) {
                        newLines.push(nextStation.lineId);
                    }

                    queue.push({
                        station: nextStation,
                        path: [...current.path, nextStation],
                        lines: newLines
                    });
                }
            }
        }

        // No route found
        return null;
    }

    /**
     * Build route object from path
     */
    buildRouteFromPath(path, lines) {
        const segments = [];
        let currentLine = path[0].lineId;
        let segmentStart = path[0];
        let stationCount = 0;

        for (let i = 1; i < path.length; i++) {
            const station = path[i];

            // Check if we're changing lines (transfer point)
            if (station.lineId !== currentLine) {
                // Save current segment
                const lineStations = dataStore.getLineStations(currentLine);
                const direction = getDirectionName(segmentStart, path[i - 1], lineStations);

                segments.push({
                    from: segmentStart,
                    to: path[i - 1],
                    line: currentLine,
                    lineColor: segmentStart.lineColor,
                    lineName: segmentStart.lineName,
                    stations: stationCount + 1,
                    direction
                });

                // Transfer point
                segments.push({
                    type: 'transfer',
                    station: path[i - 1],
                    fromLine: currentLine,
                    toLine: station.lineId
                });

                // Start new segment
                currentLine = station.lineId;
                segmentStart = station;
                stationCount = 0;
            } else {
                stationCount++;
            }
        }

        // Add final segment
        const lineStations = dataStore.getLineStations(currentLine);
        const direction = getDirectionName(segmentStart, path[path.length - 1], lineStations);

        segments.push({
            from: segmentStart,
            to: path[path.length - 1],
            line: currentLine,
            lineColor: segmentStart.lineColor,
            lineName: segmentStart.lineName,
            stations: stationCount + 1,
            direction
        });

        // Calculate totals
        const totalStations = path.length;
        const transfers = segments.filter(s => s.type === 'transfer').length;
        const estimatedTime = calculateTravelTime(totalStations - 1, transfers);

        return {
            type: transfers > 0 ? 'with-transfers' : 'direct',
            segments,
            totalStations,
            transfers,
            estimatedTime,
            path
        };
    }

    /**
     * Get all possible routes (alternative routes)
     */
    getAllRoutes(fromStationId, toStationId, maxRoutes = 3) {
        // For now, return single optimal route
        // Could be extended to find alternative routes
        const route = this.findRoute(fromStationId, toStationId);
        return route ? [route] : [];
    }
}

export const routeFinder = new RouteFinder();
