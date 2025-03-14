const dayjs = require('dayjs');
const moment = require('moment');

const formatDate = (date = null, format) => {
  let dateFormat = dayjs();
  if (date) {
    dateFormat = dayjs(date);
  }
  return dateFormat.format(format);
};

const momentDateFormat = (date, format) => moment.unix(date).format(format);

const formatUnixDate = (date = null, format) => {
  const dateFormat = dayjs.unix(date);
  return dateFormat.format(format);
};

const formatUnix = (date, format) => {
  const dateFormat = new Date(date * 1000).toString(format);
  return dateFormat;
};

const convertToUnixTimestamp = (timestampString) => {
  const timestamp = parseInt(timestampString) * 1000;
  return new Date(timestamp);
};

function getDayStartEnd(dateString) {
  if (!dateString) throw new Error("Date is required");

  // Check if date is in DD-MM-YYYY format
  const dateParts = dateString.split("-");
  if (dateParts.length === 3) {
    // Convert from DD-MM-YYYY to YYYY-MM-DD
    dateString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }

  // Parse the date
  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) throw new Error("Invalid date format");

  // Format as YYYY-MM-DD
  const formattedDate = parsedDate.toISOString().split("T")[0];

  // Create start and end of the day timestamps
  const startDate = new Date(`${formattedDate}T00:00:00.000Z`);
  const endDate = new Date(`${formattedDate}T23:59:59.999Z`);

  return { startDate, endDate };
}

export { getDayStartEnd, convertToUnixTimestamp, formatUnix, formatUnixDate, momentDateFormat, formatDate }
