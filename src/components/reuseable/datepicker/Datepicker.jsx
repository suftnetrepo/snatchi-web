import React, { useState, useCallback } from "react";
import { MonthView } from "./MonthView";
import { MonthListView } from "./MonthListView";
import { YearListView } from "./YearListView";
import { DatepickerView, useDatepickerView } from "./useDatepickerView";
import {
  defaultRenderTitle,
  defaultRenderMonthName,
  defaultRenderWeekdayShort
} from "./defaultRenders";
import { useVisibleDate } from "./useVisibleDate";

import {
  DatepickerRangeValue,
  DatepickerSimpleValue,
  DatepickerValue,
  DatepickerOnChange
} from "./types";

import { useDatepickerValue } from "./useDatepickerValue";

const getInitVisibleDate = (initDate, isRange, value) => {
  if (initDate) {
    return initDate;
  }

  if (isRange && value && value.from) {
    return value.from;
  }

  if (!isRange && value) {
    return value;
  }

  return new Date();
};

export const Datepicker = (props) => {
  const view = useDatepickerView();
  const [mouseOverDate, setMouseOverDate] = useState(null);

  const {
    renderTitle = defaultRenderTitle,
    renderMonthName = defaultRenderMonthName,
    renderWeekdayShort = defaultRenderWeekdayShort,
    onDateChange: onChangeProp,
    value: controlledValue,
    isRange,
    minDate,
    maxDate,
    weekdayOffset,
    initialVisibleDate
  } = props;

  const { value, setValue } = useDatepickerValue(
    controlledValue,
    isRange,
    onChangeProp
  );

  const initVisibleDate = getInitVisibleDate(
    initialVisibleDate,
    isRange,
    value
  );

  const {
    handleMonthSelect,
    handleYearSelect,
    handleNext,
    handlePrev,
    visibleDate
  } = useVisibleDate(initVisibleDate, view);

  const handleDateSelect = useCallback(
    (date) => {
      if (isRange === true) {
        const { from, to } = value;
        const onChangeValue = setValue;
        if (from && !to && from.getTime() <= date.getTime()) {
          onChangeValue({ from, to: date });
        } else {
          setMouseOverDate(null);
          onChangeValue({ from: date, to: null });
        }
      } else {
        const onChangeValue = setValue;
        onChangeValue(date);
      }
    },
    [value]
  );

  const dateValue = !value
    ? (isRange && { from: null, to: null }) || null
    : value;

  const from = !isRange
    ? dateValue
    : dateValue.from;
  const to = !isRange
    ? dateValue
    : dateValue.to;

  const handleMouseOver =
    from && isRange && !to
      ? (date) => {
          setMouseOverDate(date);
        }
      : undefined;

  const onMouseLeave =
    from && isRange && !to
      ? () => {
          setMouseOverDate(undefined);
        }
      : undefined;

  const dayProps = {
    handleDateSelect: handleDateSelect,
    selectedDateFrom: from,
    selectedDateTo: to,
    minDate,
    maxDate,
    handleMouseOver,
    onMouseLeave,
    mouseOverDate
  };

  return (
    <div className={"datepicker"}>
      <div className={"datepicker-header"}>
        <button onClick={handlePrev} className={"datepicker-nav-btn"}>
          ←
        </button>
        <button
          className={"datepicker-title-btn"}
          type="button"
          onClick={view.setPrevView}
        >
          {renderTitle(visibleDate, view.activeView)}
        </button>
        <button onClick={handleNext} className={"datepicker-nav-btn"}>
          →
        </button>
      </div>

      <div className={"datepicker-view-container"}>
        {view.activeView === DatepickerView.yearList && (
          <YearListView
            handleYearSelect={handleYearSelect}
            visibleDate={visibleDate}
            minDate={minDate}
            maxDate={maxDate}
          />
        )}
        {view.activeView === DatepickerView.monthList && (
          <MonthListView
            handleMonthSelect={handleMonthSelect}
            visibleDate={visibleDate}
            renderMonthName={renderMonthName}
            minDate={minDate}
            maxDate={maxDate}
          />
        )}
        {view.activeView === DatepickerView.month && (
          <MonthView
            dayProps={dayProps}
            renderWeekdayShort={renderWeekdayShort}
            visibleDate={visibleDate}
            weekdayOffset={weekdayOffset}
          />
        )}
      </div>
    </div>
  );
};

Datepicker.displayName = "Datepicker";
