export const getDaysInMonth = (date) => {
    const d = new Date(date);
    d.setMonth(date.getMonth() + 1);
    d.setDate(0);
    return d.getDate();
  };
  
  export const getMonthStartDay = (date) => {
    const d = new Date(date);
    d.setDate(1);
    return d.getDay() - 1; // Monday is 0
  };
  
  export const generateArrayOfLen = (len, startNumber = 1) => {
    let index = 0;
    const arr = [];
    while (index < len) {
      arr.push(index + startNumber);
      index += 1;
    }
  
    return arr;
  };
  
  export const isDateSelected = (
    date,
    selectedDateFrom,
    selectedDateTo,
    selectedDate
  ) => {
    if (!date) {
      return false;
    }
  
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      return true;
    }
  
    if (
      selectedDateFrom &&
      selectedDateTo &&
      selectedDateFrom.getTime() <= date.getTime() &&
      selectedDateTo.getTime() >= date.getTime()
    ) {
      return true;
    }
  
    return false;
  };
  
  export const isDateInRange = (date, from, to) => {
    if (!date || !from || !to) {
      return false;
    }
  
    if (to.getTime() >= date.getTime() && date.getTime() >= from.getTime()) {
      return true;
    }
    return false;
  };
  
  export const isDateSelectedFirst = (date, selectedDateFrom, selectedDate) => {
    if (!date) {
      return false;
    }
  
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      return true;
    }
  
    if (selectedDateFrom && selectedDateFrom.getTime() === date.getTime()) {
      return true;
    }
  
    return false;
  };
  
  export const isDateSelectedLast = (
    date,
    selectedDateFrom,
    selectedDateTo,
    selectedDate
  ) => {
    if (!date) {
      return false;
    }
  
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      return true;
    }
  
    if (selectedDateTo && selectedDateTo.getTime() === date.getTime()) {
      return true;
    }
  
    if (
      selectedDateFrom &&
      selectedDateFrom.getTime() === date.getTime() &&
      !selectedDateTo
    ) {
      return true;
    }
  
    return false;
  };

  export const isDayDisabled = (date, minDate, maxDate) => {
    if (!maxDate && !minDate) {
      return false;
    }
  
    if (maxDate && maxDate.getTime() < date.getTime()) {
      return true;
    }
  
    if (minDate && minDate.getTime() > date.getTime()) {
      return true;
    }
  
    return false;
  };

  export const isMonthDisabled = (date, minDate, maxDate) => {
    if (!maxDate && !minDate) {
      return false;
    }
  
    const year = date.getFullYear();
    const month = date.getMonth();
  
    if (maxDate) {
      const maxDateYear = maxDate.getFullYear();
      const maxDateMonth = maxDate.getMonth();
      if (maxDateYear < year || (maxDateYear === year && maxDateMonth < month)) {
        return true;
      }
    }
    if (minDate) {
      const minDateYear = minDate.getFullYear();
      const minDateMonth = minDate.getMonth();
      if (minDateYear > year || (minDateYear === year && minDateMonth > month)) {
        return true;
      }
    }
  
    return false;
  };
  
  export const isYearDisabled = (date, minDate, maxDate) => {
    if (!maxDate && !minDate) {
      return false;
    }
  
    const year = date.getFullYear();
  
    if (maxDate) {
      const maxDateYear = maxDate.getFullYear();
      if (maxDateYear < year) {
        return true;
      }
    }
    if (minDate) {
      const minDateYear = minDate.getFullYear();
      if (minDateYear > year) {
        return true;
      }
    }
  
    return false;
  };