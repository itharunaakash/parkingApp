const moment = require('moment');
function parseDateTime(input) {
    if (!input) return null;
    if (input instanceof Date) return input;
    let date = moment(input);
    if (!date.isValid()) {
        date = moment(input, ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD', 'MM/DD/YYYY HH:mm', 'MM/DD/YYYY']);
    }
    if (!date.isValid()) {
        throw new Error(`Invalid date format: ${input}. Use YYYY-MM-DD HH:mm or ISO format`);
    }
    return date.toDate();
}
function formatDateTime(date) {
    return moment(date).format('YYYY-MM-DD HH:mm');
}
function calculateHours(startTime, endTime) {
    return moment(endTime).diff(moment(startTime), 'hours', true);
}
function validateBookingTime(startTime, endTime) {
    const start = parseDateTime(startTime);
    const end = parseDateTime(endTime);
    const now = new Date();
    if (start >= end) {
        throw new Error('End time must be after start time');
    }
    if (start < now) {
        throw new Error('Cannot book in the past');
    }
    return { start, end };
}
module.exports = {
    parseDateTime,
    formatDateTime,
    calculateHours,
    validateBookingTime
};