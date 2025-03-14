import { DatepickerView } from "./useDatepickerView";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export const getMonthText = (date) => {
  const monthNumber = date.getMonth();
  return months[monthNumber];
};

export const getMonthTextByMonthNumber = (monthNumber) => {
  return months[monthNumber];
};

const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const defaultRenderTitle = (visibleDate, activeView) => {
  switch (activeView) {
    case DatepickerView.month:
      return `${getMonthText(visibleDate)} ${visibleDate.getFullYear()}`;
    case DatepickerView.monthList:
      return visibleDate.getFullYear();
    default:
      return "Select Year";
  }
};

export const defaultRenderMonthName = (monthNumber) =>
  getMonthTextByMonthNumber(monthNumber);

export const defaultRenderWeekdayShort = (weekdayNumber) => {
  return weekdaysShort[weekdayNumber];
};
