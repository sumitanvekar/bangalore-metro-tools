/**
 * Schedule calculation utilities
 */
import { parseTime, formatTime, getCurrentTimeMinutes, timeDifference } from './time-utils.js';

/**
 * Calculate next train times based on frequency
 * Handles midnight crossover for late-night services
 */
export function calculateNextTrains(firstTrain, lastTrain, peakHours, currentTime, count = 5, destination = null) {
    const trains = [];
    const currentMinutes = typeof currentTime === 'number' ? currentTime : getCurrentTimeMinutes();

    // Validate inputs
    if (!firstTrain || !lastTrain || !peakHours || !Array.isArray(peakHours)) {
        return trains;
    }

    const lastTrainMinutes = parseTime(lastTrain);
    const firstTrainMinutes = parseTime(firstTrain);

    // Check if service crosses midnight (last train is after midnight, e.g., 00:00)
    const crossesMidnight = lastTrainMinutes < firstTrainMinutes;

    // Helper function to get frequency for a specific time
    function getFrequencyAtTime(timeMinutes) {
        for (const period of peakHours) {
            const [start, end] = period.period.split('-').map(parseTime);

            if (start <= end) {
                // Normal period
                if (timeMinutes >= start && timeMinutes < end) {
                    const match = period.frequency.match(/[\d.]+/);
                    return match ? parseFloat(match[0]) : 15;
                }
            } else {
                // Period crosses midnight
                if (timeMinutes >= start || timeMinutes < end) {
                    const match = period.frequency.match(/[\d.]+/);
                    return match ? parseFloat(match[0]) : 15;
                }
            }
        }
        return 15; // default
    }

    // Normal service within same day
    if (currentMinutes < firstTrainMinutes) {
        // Before first train - start from first train
        let nextTrainMinutes = firstTrainMinutes;

        while (trains.length < count && nextTrainMinutes <= lastTrainMinutes) {
            trains.push({
                time: formatTime(nextTrainMinutes),
                minutesUntil: timeDifference(currentMinutes, nextTrainMinutes),
                destination: destination,
                isShortLoop: false
            });

            const freq = getFrequencyAtTime(nextTrainMinutes);
            nextTrainMinutes += freq;
        }
    } else if (currentMinutes > lastTrainMinutes) {
        // After last train - no more trains today
        return trains;
    } else {
        // During service hours - find next train from current time
        let nextTrainMinutes = firstTrainMinutes;

        // Find the first train after current time
        while (nextTrainMinutes <= lastTrainMinutes) {
            if (nextTrainMinutes >= currentMinutes) {
                trains.push({
                    time: formatTime(nextTrainMinutes),
                    minutesUntil: timeDifference(currentMinutes, nextTrainMinutes),
                    destination: destination,
                    isShortLoop: false
                });

                if (trains.length >= count) {
                    break;
                }
            }

            const freq = getFrequencyAtTime(nextTrainMinutes);
            nextTrainMinutes += freq;

            // Safety check
            if (nextTrainMinutes > lastTrainMinutes + 60) {
                break;
            }
        }
    }

    return trains;
}

/**
 * Get next trains from fixed schedule
 * Handles schedules that cross midnight
 */
export function getNextTrainsFromSchedule(schedule, currentTime, count = 5) {
    const trains = [];
    const currentMinutes = typeof currentTime === 'number' ? currentTime : getCurrentTimeMinutes();

    // First pass: find trains after current time today
    for (const timeStr of schedule) {
        const trainMinutes = parseTime(timeStr);
        if (trainMinutes >= currentMinutes) {
            trains.push({
                time: timeStr,
                minutesUntil: timeDifference(currentMinutes, trainMinutes),
                isFixedSchedule: true
            });

            if (trains.length >= count) {
                return trains;
            }
        }
    }

    // Second pass: if we don't have enough trains, check early morning trains (past midnight)
    // These are trains that are technically "tomorrow" but should show up as next trains
    if (trains.length < count) {
        for (const timeStr of schedule) {
            const trainMinutes = parseTime(timeStr);

            // Only consider times that are early morning (before 6 AM typically)
            // These likely belong to late-night service from previous day
            if (trainMinutes < 360) { // Before 6:00 AM
                const minutesUntil = timeDifference(currentMinutes, trainMinutes);

                // Only add if it makes sense (not showing trains many hours away)
                if (minutesUntil < 720) { // Less than 12 hours away
                    trains.push({
                        time: timeStr,
                        minutesUntil: minutesUntil,
                        isFixedSchedule: true,
                        nextDay: true // Flag to indicate this is tomorrow
                    });

                    if (trains.length >= count) {
                        break;
                    }
                }
            }
        }
    }

    return trains;
}

/**
 * Calculate travel time between stations
 */
export function calculateTravelTime(stationCount, transferCount = 0) {
    const AVG_TIME_PER_STATION = 3; // minutes
    const TRANSFER_TIME = 5; // minutes

    return (stationCount * AVG_TIME_PER_STATION) + (transferCount * TRANSFER_TIME);
}

/**
 * Get direction name for a route
 */
export function getDirectionName(fromStation, toStation, lineStations) {
    const fromIndex = lineStations.findIndex(s => s.id === fromStation.id);
    const toIndex = lineStations.findIndex(s => s.id === toStation.id);

    if (fromIndex < toIndex) {
        // Going towards end terminal
        return `Towards ${lineStations[lineStations.length - 1].name}`;
    } else {
        // Going towards start terminal
        return `Towards ${lineStations[0].name}`;
    }
}
