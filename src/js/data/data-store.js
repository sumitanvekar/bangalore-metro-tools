/**
 * DataStore - Singleton that loads and provides indexed access to metro data
 */
class DataStore {
    constructor() {
        if (DataStore.instance) {
            return DataStore.instance;
        }

        this.routes = null;
        this.schedules = null;
        this.stationIndex = new Map(); // Map<stationId, stationData>
        this.interchangeStations = [];
        this.loaded = false;

        DataStore.instance = this;
    }

    /**
     * Load both JSON files and build indexes
     */
    async loadData() {
        if (this.loaded) {
            return;
        }

        try {
            const baseUrl = import.meta.env.BASE_URL;
            
            const [routesResponse, schedulesResponse] = await Promise.all([
                fetch('data/metro-routes.json'),
                fetch('data/metro-schedules.json')
            ]);

            if (!routesResponse.ok || !schedulesResponse.ok) {
                throw new Error('Failed to load metro data');
            }

            this.routes = await routesResponse.json();
            this.schedules = await schedulesResponse.json();

            this.buildIndexes();
            this.loaded = true;

            console.log('✓ Metro data loaded successfully');
            console.log(`  - ${this.stationIndex.size} stations indexed`);
            console.log(`  - ${this.interchangeStations.length} interchange stations`);
        } catch (error) {
            console.error('Error loading metro data:', error);
            throw error;
        }
    }

    /**
     * Build station and interchange indexes for fast lookups
     */
    buildIndexes() {
        // Index all stations by ID
        this.routes.routes.forEach(route => {
            const lineId = route.id;
            const lineColor = route.color;
            const lineName = route.name;

            // Index main stations
            route.stations.forEach((station, index) => {
                this.stationIndex.set(station.id, {
                    ...station,
                    lineId,
                    lineColor,
                    lineName,
                    position: index
                });
            });

            // Index branch stations (for Green Line extension)
            if (route.branches) {
                route.branches.forEach(branch => {
                    branch.stations.forEach((station, index) => {
                        this.stationIndex.set(station.id, {
                            ...station,
                            lineId,
                            lineColor,
                            lineName,
                            position: route.stations.length + index,
                            branch: branch.name
                        });
                    });
                });
            }
        });

        // Index interchange stations
        this.interchangeStations = this.routes.interchangeStations.map(interchange => ({
            ...interchange,
            stationIds: this.findStationIdsByName(interchange.name)
        }));
    }

    /**
     * Find station IDs by name (for interchange lookup)
     */
    findStationIdsByName(name) {
        const ids = [];
        for (const [id, station] of this.stationIndex) {
            if (station.name === name) {
                ids.push(id);
            }
        }
        return ids;
    }

    /**
     * Get station by ID
     */
    getStation(stationId) {
        return this.stationIndex.get(stationId);
    }

    /**
     * Get all stations (for dropdowns)
     */
    getAllStations() {
        return Array.from(this.stationIndex.values());
    }

    /**
     * Get stations grouped by line
     */
    getStationsGroupedByLine() {
        const grouped = {
            purple: [],
            green: [],
            yellow: []
        };

        for (const station of this.stationIndex.values()) {
            if (grouped[station.lineId]) {
                grouped[station.lineId].push(station);
            }
        }

        // Sort by position on line
        Object.keys(grouped).forEach(lineId => {
            grouped[lineId].sort((a, b) => a.position - b.position);
        });

        return grouped;
    }

    /**
     * Get interchange stations
     */
    getInterchangeStations() {
        return this.interchangeStations;
    }

    /**
     * Check if a station is an interchange
     */
    isInterchange(stationId) {
        const station = this.getStation(stationId);
        if (!station) return false;

        return station.type === 'interchange' ||
               this.interchangeStations.some(interchange =>
                   interchange.stationIds.includes(stationId)
               );
    }

    /**
     * Get stations for a specific line
     */
    getLineStations(lineId) {
        const stations = [];
        const route = this.routes.routes.find(r => r.id === lineId);

        if (!route) return stations;

        // Add main stations
        route.stations.forEach(station => {
            stations.push(this.getStation(station.id));
        });

        // Add branch stations
        if (route.branches) {
            route.branches.forEach(branch => {
                branch.stations.forEach(station => {
                    stations.push(this.getStation(station.id));
                });
            });
        }

        return stations;
    }

    /**
     * Get route metadata
     */
    getRoute(lineId) {
        return this.routes.routes.find(r => r.id === lineId);
    }

    /**
     * Get all routes
     */
    getAllRoutes() {
        return this.routes.routes;
    }

    /**
     * Get schedules for a line
     */
    getLineSchedule(lineId) {
        if (!this.schedules) {
            console.warn('Schedules not loaded yet');
            return null;
        }
        const lineKey = `${lineId}_line`;
        return this.schedules.schedules[lineKey];
    }

    /**
     * Get last updated date
     */
    getLastUpdated() {
        return this.routes.metroSystem.lastUpdated;
    }

    /**
     * Get adjacent stations (for route finding)
     */
    getAdjacentStations(stationId) {
        const station = this.getStation(stationId);
        if (!station) return [];

        const lineStations = this.getLineStations(station.lineId);
        const currentIndex = lineStations.findIndex(s => s.id === stationId);

        if (currentIndex === -1) return [];

        const adjacent = [];

        // Previous station
        if (currentIndex > 0) {
            adjacent.push(lineStations[currentIndex - 1]);
        }

        // Next station
        if (currentIndex < lineStations.length - 1) {
            adjacent.push(lineStations[currentIndex + 1]);
        }

        // If it's an interchange, add stations from other lines
        if (this.isInterchange(stationId)) {
            const interchange = this.interchangeStations.find(i =>
                i.stationIds.includes(stationId)
            );

            if (interchange) {
                interchange.stationIds.forEach(id => {
                    if (id !== stationId) {
                        const otherStation = this.getStation(id);
                        if (otherStation) {
                            adjacent.push(otherStation);
                        }
                    }
                });
            }
        }

        return adjacent;
    }
}

// Export singleton instance
export const dataStore = new DataStore();
