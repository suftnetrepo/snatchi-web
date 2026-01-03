import { faFilePdf, faFileWord, faImage } from '@fortawesome/free-solid-svg-icons';

const getAggregate = (data, status) => {
  {
    const result = (data || []).find((j) => j.status === status);
    return result ? result.count : 0;
  }
};

const getAdminAggregate = (data, status) => {
  {
    const result = (data || []).find((j) => j._id === status);
    return result ? result.count : 0;
  }
};

const dateFormatted = (str) => {
  const date0 = new Date(str);
  date0.setHours(date0.getHours() + 5);
  date0.setMinutes(date0.getMinutes() + 30);
  const month = `0${date0.getMonth() + 1}`.slice(-2);
  const day = `0${date0.getDate()}`.slice(-2);
  return [day, month, date0.getFullYear()].join('-');
};

function getSortedCounts(data) {
  if (!Array.isArray(data)) {
    throw new Error('Input must be an array');
  }

  data.sort((a, b) => a?._id.localeCompare(b?._id));
  return data.map((item) => item.count);
}

function convertDatesForMongoDB({ current_period_start, current_period_end }) {
  return {
    current_period_start: new Date(current_period_start * 1000), // Convert to milliseconds
    current_period_end: new Date(current_period_end * 1000) // Convert to milliseconds
  };
}

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

function convertToShortDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return date.toLocaleDateString(undefined, options);
}

function completeAddress(address) {
  if (!address) return;
  let completeAddress = '';

  if (address.addressLine1) {
    completeAddress += address.addressLine1 + ', ';
  }

  if (address.town) {
    completeAddress += address.town + ', ';
  }

  if (address.county) {
    completeAddress += address.county + ', ';
  }

  if (address.country) {
    completeAddress += address.country + ', ';
  }

  if (address.postcode) {
    completeAddress += address.postcode;
  }

  return completeAddress;
}

async function searchAddress(query) {
  const params = {
    q: query,
    format: 'json',
    addressdetails: 1,
    polygon_geojson: 0
  };

  const queryString = new URLSearchParams(params).toString();
  const requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${queryString}`, requestOptions);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error while fetching address:', error);
    return null;
  }
}

function formatAddressParts(address) {
  const { suburb, city, state, postcode, country, country_code, place } = address;
  const addressPartsToInclude = [];

  if (country_code === 'us' || country_code === 'gb') {
    const postcodeOrZipCode = postcode || '';
    addressPartsToInclude.push(suburb, city, state, postcodeOrZipCode, country);
  } else {
    addressPartsToInclude.push(place, city, state, country);
  }

  return addressPartsToInclude.join(', ');
}

const customStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'white',
    color: 'black'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'white'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'white' : 'white',
    color: 'black',
    '&:hover': {
      backgroundColor: 'darkgray'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'black'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#808080'
  })
};

const addressStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'white',
    color: 'black'
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'black'
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? 'white' : 'black',
    color: 'white',
    '&:hover': {
      backgroundColor: 'black'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'black'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#808080'
  })
};

const formatTimeForObject = (lastUpdated) => {
  if (lastUpdated && lastUpdated.seconds !== undefined) {
    const milliseconds = lastUpdated.seconds * 1000 + Math.floor(lastUpdated.nanoseconds / 1e6);
    const date = new Date(milliseconds);

    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return formattedTime;
  }

  return null;
};

const formattedTime = (time) => {
  if (!time) return null;

  try {
    let date;
    // Handle string time format (HH:mm)
    if (typeof time === 'string' && time.includes(':')) {
      date = new Date(`2000-01-01T${time}`);
    } else {
      // Handle full date string or timestamp
      date = new Date(time);
    }

    if (isNaN(date.getTime())) {
      return time;
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {

    return time;
  }
};

function convertTimestampToTime(timestamp) {
  if (!timestamp) return;
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

const formatDateTime = (isoString) => {
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const convertTimestampToDate = (timestamp) => {
  if (!timestamp) return;
  const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );
    const json = await response.json();

    return formatAddressParts(json.address);
  } catch (error) { }
};

function formatCurrency(currencySymbol, amount) {
  const numericAmount = parseFloat(amount);

  if (isNaN(numericAmount)) {
    return amount;
  }

  const formattedAmount = currencySymbol + numericAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');

  return formattedAmount;
}

function currencySymbolMapper(currencySymbol) {
  const currencyMap = {
    '£': 'gbp',
    $: 'usd',
    aed: 'aed',
    afn: 'afn',
    all: 'all',
    amd: 'amd',
    usdc: 'usdc',
    btn: 'btn',
    ghs: 'ghs',
    eek: 'eek',
    lvl: 'lvl',
    svc: 'svc',
    vef: 'vef',
    ltl: 'ltl',
    sll: 'sll'
  };

  if (currencySymbol in currencyMap) {
    return currencyMap[currencySymbol];
  } else {
    return 'gbp';
  }
}

function formatReadableDate(isoDate) {
  const date = new Date(isoDate);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function haversineDistance(coords1, coords2) {
  function toRad(x) {
    return (x * Math.PI) / 180;
  }
  const R = 6371; // Earth radius in km
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);

  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  const formattedDistance = distance > 1 ? `${distance.toFixed(2)} km` : `${Math.round(distance * 1000)} meters`;
  return {
    formattedDistance,
    distance
  };
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const ppeOptions = [
  { value: 'helmet', label: '🪖 Helmet' },
  { value: 'goggles', label: '👓 Safety Goggles' },
  { value: 'gloves', label: '🧤 Protective Gloves' },
  { value: 'boots', label: '🥾 Steel-Toe Boots' },
  { value: 'earplugs', label: '🦻 Earplugs' },
  { value: 'earmuffs', label: '🎧 Earmuffs' },
  { value: 'mask', label: '😷 Respirator Mask' },
  { value: 'vest', label: '🦺 Reflective Safety Vest' },
  { value: 'coveralls', label: '🧥 Protective Coveralls' },
  { value: 'face_shield', label: '🛡️ Face Shield' },
  { value: 'safety_harness', label: '⛓️ Safety Harness' },
  { value: 'lab_coat', label: '🔬 Lab Coat' },
  { value: 'chemical_apron', label: '🧪 Chemical Resistant Apron' },
  { value: 'dust_mask', label: '🌫️ Dust Mask' },
  { value: 'knee_pads', label: '🦵 Knee Pads' },
  { value: 'welding_shield', label: '🔥 Welding Shield' },
  { value: 'anti_static_wristband', label: '🖐️ Anti-static Wristband' },
  { value: 'insulated_gloves', label: '🧤 Insulated Gloves' },
  { value: 'cut_resistant_gloves', label: '✂️ Cut-Resistant Gloves' },
  { value: 'fall_arrest_kit', label: '🪢 Fall Arrest Kit' }
];

function getHourAndMinutes(dateString) {
  if (!dateString) return ''; // Or return '--:--' or something default
  const date = new Date(dateString);
  if (isNaN(date)) return ''; // Date is invalid
  return date.toISOString().split('T')[1].slice(0, 5);
}

function getTimeFromDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[1].split('.')[0];
}

const truncate = (str, max = 100) => (str?.length > max ? str.slice(0, max) + '…' : str);

const getStatusColorCode = (status) => {
  const colors = {
    canceled: 'bg-danger',
    unpaid: 'bg-warning',
    inactive: 'bg-info',
    active: 'bg-primary',
    past_due: 'bg-secondary',
    progress: 'bg-warning',
    pending: 'bg-info',
    completed: 'bg-secondary'
  };

  return colors[status?.toLowerCase()] || 'bg-secondary';
};

const getRandomColor = () => {
  const colors = ['primary', 'info', 'success', 'warning', 'danger', 'secondary'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getInitials = (name) => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const getDaysLeftColor = (days) => {
  if (days <= 2) return 'text-danger';
  if (days <= 5) return 'text-warning';
  return 'text-primary';
};

const avatar = ({ index }) => {
  const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
  return (
    <div
      className={`rounded-circle ${colors[index % colors.length]} text-white d-flex align-items-center justify-content-center`}
      style={{ width: '32px', height: '32px', fontSize: '14px' }}
    >
      {String.fromCharCode(65 + index)}
    </div>
  );
};

const daysLeft = (project) => {
  const result = Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return result;
};

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'In Progress':
      return 'primary';
    default:
      return 'secondary';
  }
};

const getPriorityBadgeVariant = (priority) => {
  switch (priority) {
    case 'High':
      return 'danger';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'info';
    default:
      return 'secondary';
  }
};

const getIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return faFilePdf;
    case 'word':
      return faFileWord;
    case 'image':
      return faImage;
    default:
      return faFilePdf;
  }
};

const getIconColor = (type) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return '#ff6699';
    case 'word':
      return '#1a8cff';
    case 'image':
      return '#00b3b3';
    default:
      return faFilePdf;
  }
};

const getFenceStatusColorCode = (status) => {
  const colors = {
    Exit: 'bg-danger',
    Enter: 'bg-success',
  };
  return colors[status] || 'bg-danger';
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
};

const getPriorityStatusColorCode = (priority) => {
  const colors = {
    High: 'bg-success',
    Low: 'bg-warning',
    Medium: 'bg-info'
  };
  return colors[priority] || 'bg-secondary';
};

function getTimeOnly(timestamp) {
  return new Date(timestamp).toISOString().slice(11, 19);
}

export {
  formatRelativeTime,
  getIconColor,
  getIcon,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
  getRandomColor,
  getInitials,
  getDaysLeftColor,
  avatar,
  daysLeft,
  getStatusColorCode,
  truncate,
  getTimeFromDate,
  getHourAndMinutes,
  ppeOptions,
  haversineDistance,
  formatReadableDate,
  formatCurrency,
  currencySymbolMapper,
  reverseGeocode,
  convertTimestampToTime,
  formatTimeForObject,
  addressStyles,
  customStyles,
  getAdminAggregate,
  completeAddress,
  formatAddressParts,
  searchAddress,
  convertToShortDate,
  formatUnixDate,
  formatUnix,
  convertToUnixTimestamp,
  convertDatesForMongoDB,
  getAggregate,
  dateFormatted,
  getSortedCounts,
  formatDateTime,
  capitalizeFirstLetter,
  convertTimestampToDate,
  formattedTime,
  getFenceStatusColorCode,
  getPriorityStatusColorCode,
  getTimeOnly
};
