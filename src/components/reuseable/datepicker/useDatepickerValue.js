import React from "react";

const getValue = (value, isRange) => {
  if (!!isRange && !value) {
    return { from: undefined, to: undefined };
  }

  return value;
};

export const useDatepickerValue = (
  controlledValue,
  isRange,
  onDateChange
) => {
  const defaultValue = getValue(controlledValue, isRange);

  const [innerValue, setInnerValue] = React.useState(defaultValue);

  const value =
    typeof controlledValue === "undefined" ? innerValue : controlledValue;

  const setValue = (value) => {
    setInnerValue(value);
    if (onDateChange) {
      onDateChange(value);
    }
  };

  return {
    value,
    setValue
  };
};
