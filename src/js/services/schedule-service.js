/**
 * Schedule Service - Format and provide schedule data
 */
import { dataStore } from '../data/data-store.js';
import { getDayType, getScheduleDayKey } from '../utils/date-utils.js';

export class ScheduleService {
    /**
     * Get formatted schedule for a line
     */
    getLineSchedule(lineId, dayType = null) {
        // Yellow line uses different day keys (tuesday_to_saturday instead of tuesday_to_friday)
        const day = dayType || (lineId === 'yellow' ? getScheduleDayKey() : getDayType());
        const lineSchedule = dataStore.getLineSchedule(lineId);

        if (!lineSchedule || !lineSchedule[day]) {
            return null;
        }

        const route = dataStore.getRoute(lineId);
        return {
            line: route.name,
            lineId,
            color: route.color,
            dayType: day,
            schedule: lineSchedule[day],
            terminals: route.terminals
        };
    }

    /**
     * Get all schedules grouped by line
     */
    getAllSchedules(dayType = null) {
        const routes = dataStore.getAllRoutes();

        return routes.map(route => {
            // Yellow line uses different day keys
            const day = dayType || (route.id === 'yellow' ? getScheduleDayKey() : getDayType());
            return {
                line: route.name,
                lineId: route.id,
                color: route.color,
                dayType: day,
                schedule: dataStore.getLineSchedule(route.id)?.[day],
                terminals: route.terminals
            };
        });
    }

    /**
     * Format frequency schedule for display
     */
    formatFrequencySchedule(schedule) {
        if (!schedule) return [];

        const formatted = [];

        // Get direction data
        const directionKey = Object.keys(schedule).find(key => key.startsWith('direction_'));
        if (!directionKey) return formatted;

        const directionData = schedule[directionKey];

        // Format each origin point
        Object.keys(directionData).forEach(origin => {
            const data = directionData[origin];
            if (data.first_train && data.last_train) {
                formatted.push({
                    origin: this.formatOriginName(origin),
                    firstTrain: data.first_train,
                    lastTrain: data.last_train,
                    peakHours: data.peak_hours || []
                });
            }
        });

        return formatted;
    }

    /**
     * Format fixed schedule for display
     */
    formatFixedSchedule(schedule) {
        if (!schedule) return [];

        const formatted = [];
        const directionKey = Object.keys(schedule).find(key => key.startsWith('direction_'));
        if (!directionKey) return formatted;

        const directionData = schedule[directionKey];

        Object.keys(directionData).forEach(origin => {
            const data = directionData[origin];
            if (data.schedule) {
                formatted.push({
                    origin: this.formatOriginName(origin),
                    firstTrain: data.first_train,
                    lastTrain: data.last_train,
                    trains: data.schedule,
                    frequency: data.frequency
                });
            }
        });

        return formatted;
    }

    /**
     * Get key station times
     */
    getKeyStationTimes(lineId, dayType = null) {
        // Yellow line uses different day keys
        const day = dayType || (lineId === 'yellow' ? getScheduleDayKey() : getDayType());
        const lineSchedule = dataStore.getLineSchedule(lineId);

        if (!lineSchedule || !lineSchedule[day]) {
            return [];
        }

        const keyStations = lineSchedule[day].key_stations;
        if (!keyStations) return [];

        return Object.keys(keyStations).map(stationKey => ({
            station: this.formatStationKey(stationKey),
            times: keyStations[stationKey]
        }));
    }

    /**
     * Format origin name for display
     */
    formatOriginName(origin) {
        return origin
            .replace(/^from_/, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format station key for display
     */
    formatStationKey(key) {
        const nameMap = {
            'nadaprabhu_kempegowda_majestic': 'Majestic',
            'kengeri': 'Kengeri',
            'mysuru_road': 'Mysuru Road',
            'baiyappanahalli': 'Baiyappanahalli',
            'whitefield': 'Whitefield',
            'silk_institute': 'Silk Institute',
            'banashankari': 'Banashankari',
            'yelachenahalli': 'Yelachenahalli',
            'nagawara': 'Nagawara'
        };

        return nameMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Get available day types for a specific line
     */
    getAvailableDayTypes(lineId) {
        const lineSchedule = dataStore.getLineSchedule(lineId);
        if (!lineSchedule) return [];

        const dayTypeMap = {
            'monday': 'Monday',
            'tuesday_to_friday': 'Tuesday to Friday',
            'tuesday_to_saturday': 'Tuesday to Saturday',
            'saturday': 'Saturday',
            'sunday': 'Sunday'
        };

        // Return only day types that exist in the schedule
        return Object.keys(lineSchedule)
            .filter(key => dayTypeMap[key]) // Only include known day types
            .map(key => ({
                value: key,
                label: dayTypeMap[key]
            }));
    }

    /**
     * Get day type options for filter
     */
    getDayTypeOptions() {
        return [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday_to_friday', label: 'Tuesday to Friday' },
            { value: 'saturday', label: 'Saturday' },
            { value: 'sunday', label: 'Sunday' }
        ];
    }

    /**
     * Get line options for filter
     */
    getLineOptions() {
        return dataStore.getAllRoutes().map(route => ({
            value: route.id,
            label: route.name,
            color: route.color
        }));
    }
}

export const scheduleService = new ScheduleService();
