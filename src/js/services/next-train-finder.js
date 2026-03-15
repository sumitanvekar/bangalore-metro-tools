/**
 * Next Train Finder Service
 * Handles frequency-based schedules for all lines (Purple/Green/Yellow)
 */
import { dataStore } from '../data/data-store.js';
import { getDayType, getScheduleDayKey } from '../utils/date-utils.js';
import { calculateNextTrains, getNextTrainsFromSchedule } from '../utils/schedule-calculator.js';
import { getCurrentTimeMinutes } from '../utils/time-utils.js';

export class NextTrainFinder {
    /**
     * Get next trains for a station in a specific direction
     */
    getNextTrains(stationId, direction, currentTime = null, count = 5) {
        const station = dataStore.getStation(stationId);
        if (!station) {
            return { error: 'Station not found' };
        }

        const lineSchedule = dataStore.getLineSchedule(station.lineId);
        if (!lineSchedule) {
            return { error: 'Schedule not available for this line' };
        }

        // Yellow line uses different day keys (tuesday_to_saturday instead of tuesday_to_friday)
        const dayType = station.lineId === 'yellow' ? getScheduleDayKey() : getDayType();
        const daySchedule = lineSchedule[dayType];

        if (!daySchedule) {
            return { error: `No schedule available for ${dayType}` };
        }

        // All lines now use frequency-based schedule
        return this.getFrequencyBasedTrains(station, direction, daySchedule, currentTime, count);
    }

    /**
     * Get trains for frequency-based lines (Purple/Green/Yellow)
     */
    getFrequencyBasedTrains(station, direction, daySchedule, currentTime, count) {
        const time = currentTime || getCurrentTimeMinutes();

        // Determine direction key based on line
        let directionKey, firstTrain, lastTrain, peakHours;

        if (station.lineId === 'purple') {
            if (direction === 'east') {
                // Towards Whitefield
                const stationKey = this.getPurpleStationKey(station.name);
                if (daySchedule.key_stations?.[stationKey]) {
                    firstTrain = daySchedule.key_stations[stationKey].towards_whitefield?.first;
                    lastTrain = daySchedule.key_stations[stationKey].towards_whitefield?.last;
                }
                if (!firstTrain) {
                    firstTrain = daySchedule.direction_west_to_east.from_challaghatta.first_train;
                    lastTrain = daySchedule.direction_west_to_east.from_challaghatta.last_train;
                }
                peakHours = daySchedule.direction_west_to_east.from_challaghatta.peak_hours;
            } else {
                // Towards Challaghatta
                const stationKey = this.getPurpleStationKey(station.name);
                if (daySchedule.key_stations?.[stationKey]) {
                    firstTrain = daySchedule.key_stations[stationKey].towards_challaghatta?.first;
                    lastTrain = daySchedule.key_stations[stationKey].towards_challaghatta?.last;
                }
                if (!firstTrain) {
                    firstTrain = daySchedule.direction_west_to_east.from_whitefield.first_train;
                    lastTrain = daySchedule.direction_west_to_east.from_whitefield.last_train;
                }
                peakHours = daySchedule.direction_west_to_east.from_whitefield.peak_hours;
            }
        } else if (station.lineId === 'green') {
            if (direction === 'north') {
                // Towards Nagawara/Soladevanahalli
                const stationKey = this.getGreenStationKey(station.name);
                if (daySchedule.key_stations?.[stationKey]) {
                    firstTrain = daySchedule.key_stations[stationKey].towards_nagawara?.first;
                    lastTrain = daySchedule.key_stations[stationKey].towards_nagawara?.last;
                }
                if (!firstTrain) {
                    firstTrain = daySchedule.direction_south_to_north.from_silk_institute.first_train;
                    lastTrain = daySchedule.direction_south_to_north.from_silk_institute.last_train;
                }
                peakHours = daySchedule.direction_south_to_north.from_silk_institute.peak_hours;
            } else {
                // Towards Silk Institute
                const stationKey = this.getGreenStationKey(station.name);
                if (daySchedule.key_stations?.[stationKey]) {
                    firstTrain = daySchedule.key_stations[stationKey].towards_silk_institute?.first;
                    lastTrain = daySchedule.key_stations[stationKey].towards_silk_institute?.last;
                }
                if (!firstTrain) {
                    firstTrain = daySchedule.direction_south_to_north.from_nagawara.first_train;
                    lastTrain = daySchedule.direction_south_to_north.from_nagawara.last_train;
                }
                peakHours = daySchedule.direction_south_to_north.from_nagawara.peak_hours;
            }
        } else if (station.lineId === 'yellow') {
            if (direction === 'southeast') {
                // Towards Bommasandra
                firstTrain = daySchedule.direction_kr_road_to_bommasandra.from_kr_road.first_train;
                lastTrain = daySchedule.direction_kr_road_to_bommasandra.from_kr_road.last_train;
                peakHours = daySchedule.direction_kr_road_to_bommasandra.from_kr_road.peak_hours;
            } else {
                // Towards RV Road/BTM Layout
                firstTrain = daySchedule.direction_kr_road_to_bommasandra.from_bommasandra.first_train;
                lastTrain = daySchedule.direction_kr_road_to_bommasandra.from_bommasandra.last_train;
                peakHours = daySchedule.direction_kr_road_to_bommasandra.from_bommasandra.peak_hours;
            }
        }

        if (!firstTrain || !lastTrain || !peakHours) {
            return { error: 'Schedule data incomplete' };
        }

        const trains = calculateNextTrains(firstTrain, lastTrain, peakHours, time, count);

        return {
            station: station.name,
            line: station.lineName,
            direction,
            trains,
            scheduleType: 'frequency-based'
        };
    }

    /**
     * Get trains for Yellow line (fixed schedule)
     */
    getYellowLineTrains(station, direction, daySchedule, currentTime, count) {
        const time = currentTime || getCurrentTimeMinutes();
        const dayKey = getScheduleDayKey();

        // Yellow line schedule structure is different
        const scheduleData = daySchedule.direction_kr_road_to_bommasandra;

        let schedule;
        if (direction === 'southeast') {
            // Towards Bommasandra
            schedule = scheduleData.from_kr_road?.schedule || scheduleData.from_bommasandra?.schedule;
        } else {
            // Towards BTM Layout (opposite direction)
            schedule = scheduleData.from_bommasandra?.schedule || scheduleData.from_kr_road?.schedule;
        }

        if (!schedule) {
            return { error: 'Schedule not available' };
        }

        const trains = getNextTrainsFromSchedule(schedule, time, count);

        return {
            station: station.name,
            line: station.lineName,
            direction,
            trains,
            scheduleType: 'fixed-schedule'
        };
    }

    /**
     * Convert station name to schedule key (Purple line)
     */
    getPurpleStationKey(stationName) {
        const keyMap = {
            'Nadaprabhu Kempegowda Station, Majestic': 'nadaprabhu_kempegowda_majestic',
            'Kengeri': 'kengeri',
            'Mysuru Road': 'mysuru_road',
            'Baiyappanahalli': 'baiyappanahalli',
            'Whitefield (Kadugodi)': 'whitefield'
        };
        return keyMap[stationName] || stationName.toLowerCase().replace(/\s+/g, '_').replace(/[,()]/g, '');
    }

    /**
     * Convert station name to schedule key (Green line)
     */
    getGreenStationKey(stationName) {
        const keyMap = {
            'Nadaprabhu Kempegowda Station, Majestic': 'nadaprabhu_kempegowda_majestic',
            'Silk Institute': 'silk_institute',
            'Banashankari': 'banashankari',
            'Yelachenahalli': 'yelachenahalli',
            'Nagawara': 'nagawara'
        };
        return keyMap[stationName] || stationName.toLowerCase().replace(/\s+/g, '_').replace(/[,()]/g, '');
    }

    /**
     * Get direction options for a station
     */
    getDirectionOptions(stationId) {
        const station = dataStore.getStation(stationId);
        if (!station) return [];

        const route = dataStore.getRoute(station.lineId);
        if (!route) return [];

        if (station.lineId === 'purple') {
            return [
                { value: 'east', label: `Towards ${route.terminals.east}` },
                { value: 'west', label: `Towards ${route.terminals.west}` }
            ];
        } else if (station.lineId === 'green') {
            return [
                { value: 'north', label: `Towards ${route.terminals.north}` },
                { value: 'south', label: `Towards ${route.terminals.south}` }
            ];
        } else if (station.lineId === 'yellow') {
            return [
                { value: 'southeast', label: `Towards ${route.terminals.southeast}` },
                { value: 'northwest', label: `Towards ${route.terminals.northwest}` }
            ];
        }

        return [];
    }
}

export const nextTrainFinder = new NextTrainFinder();
