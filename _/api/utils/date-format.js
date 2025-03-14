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

export { convertToUnixTimestamp, formatUnix, formatUnixDate, momentDateFormat, formatDate }
