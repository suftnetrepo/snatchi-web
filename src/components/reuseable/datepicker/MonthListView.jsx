import React from 'react';

import { generateArrayOfLen, isMonthDisabled } from './utils';

export const MonthListView = (props) => {
  const {
    handleMonthSelect,
    renderMonthName,
    minDate,
    maxDate,
    visibleDate
  } = props;

  const visibleYear = visibleDate.getFullYear();

  return (
    <div className={'datepicker-month-list'}>
      {generateArrayOfLen(12, 0).map(monthNumber => {
        const onClickMonth = () => {
          handleMonthSelect(monthNumber);
        };
        return (
          <button
            type="button"
            key={monthNumber}
            onClick={onClickMonth}
            className={'datepicker-month-list-item'}
            disabled={isMonthDisabled(
              new Date(visibleYear, monthNumber, 1),
              minDate,
              maxDate
            )}
          >
            {renderMonthName(monthNumber)}
          </button>
        );
      })}
    </div>
  );
};

MonthListView.displayName = 'MonthListView';
