/**
 * Date utility functions
 */

/**
 * Get day type for schedule lookup
 */
export function getDayType(date = new Date()) {
    const day = date.getDay();
    if (day === 0) return 'sunday';
    if (day === 1) return 'monday';
    if (day === 6) return 'saturday';
    return 'tuesday_to_friday';
}

/**
 * Get day name
 */
export function getDayName(date = new Date()) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

/**
 * Format date
 */
export function formatDate(date = new Date()) {
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get schedule day key (used in Yellow line schedules)
 */
export function getScheduleDayKey(date = new Date()) {
    const day = date.getDay();
    if (day === 0) return 'sunday';
    if (day === 1) return 'monday';
    // Tuesday to Saturday use same schedule
    return 'tuesday_to_saturday';
}

/**
 * Check if it's a weekday
 */
export function isWeekday(date = new Date()) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

/**
 * Check if it's weekend
 */
export function isWeekend(date = new Date()) {
    const day = date.getDay();
    return day === 0 || day === 6;
}
