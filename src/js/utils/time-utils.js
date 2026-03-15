/**
 * Time utility functions
 */

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to HH:MM
 */
export function formatTime(minutes) {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get current time in minutes since midnight
 */
export function getCurrentTimeMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

/**
 * Calculate difference between two times in minutes
 * Handles midnight crossover correctly
 */
export function timeDifference(time1Minutes, time2Minutes) {
    let diff = time2Minutes - time1Minutes;

    // If negative, the time crossed midnight
    // Example: from 23:45 (1425 min) to 00:30 (30 min)
    // diff = 30 - 1425 = -1395
    // diff + 1440 = 45 minutes (correct)
    if (diff < 0) {
        diff += 24 * 60; // Add 24 hours in minutes (1440)
    }

    return diff;
}

/**
 * Format duration in minutes to readable format
 */
export function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Parse frequency string (e.g., "10 mins") to number
 */
export function parseFrequency(frequencyStr) {
    const match = frequencyStr.match(/(\d+)\s*min/);
    return match ? parseInt(match[1]) : 15;
}

/**
 * Check if current time is within a period (e.g., "06:00-09:00")
 */
export function isWithinPeriod(currentMinutes, periodStr) {
    const [start, end] = periodStr.split('-').map(parseTime);
    return currentMinutes >= start && currentMinutes < end;
}

/**
 * Format countdown time
 */
export function formatCountdown(minutes) {
    if (minutes < 1) {
        return 'Departing now';
    }
    if (minutes < 60) {
        return `in ${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `in ${hours}h ${mins}m`;
}

/**
 * Get urgency level for countdown
 */
export function getUrgencyLevel(minutes) {
    if (minutes < 5) return 'urgent';
    if (minutes < 15) return 'soon';
    return 'normal';
}

/**
 * Add minutes to a time
 */
export function addMinutes(timeStr, minutesToAdd) {
    const minutes = parseTime(timeStr);
    return formatTime(minutes + minutesToAdd);
}

/**
 * Compare two times
 */
export function compareTime(time1, time2) {
    return parseTime(time1) - parseTime(time2);
}
