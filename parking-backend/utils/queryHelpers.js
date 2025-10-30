const moment = require('moment-timezone');
function getDayRange(date, timezone = 'UTC') {
  const start = moment.tz(date, timezone).startOf('day').utc().toDate();
  const end = moment.tz(date, timezone).endOf('day').utc().toDate();
  return { start, end };
}
function toUTC(localTime, timezone = 'UTC') {
  return moment.tz(localTime, timezone).utc().toDate();
}
function fromUTC(utcTime, timezone = 'UTC') {
  return moment.utc(utcTime).tz(timezone).format('YYYY-MM-DD HH:mm');
}
async function getBookingsForDate(Booking, date, timezone = 'UTC') {
  const { start, end } = getDayRange(date, timezone);
  return await Booking.find({
    startTime: { $gte: start, $lte: end }
  });
}
module.exports = {
  getDayRange,
  toUTC,
  fromUTC,
  getBookingsForDate
};