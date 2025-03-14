import React from 'react';

import { generateArrayOfLen, isYearDisabled } from './utils';

export const YearListView = (props) => {
  const { visibleDate, handleYearSelect, minDate, maxDate } = props;
  const currentYear = visibleDate.getFullYear();
  const startYear = currentYear - (currentYear % 12);
  return (
    <div className={'datepicker-year-list'}>
      {generateArrayOfLen(12, startYear).map(yearNumber => {
        const onClickMonth = () => {
          handleYearSelect(yearNumber);
        };
        return (
          <button
            type="button"
            key={yearNumber}
            onClick={onClickMonth}
            className={'datepicker-year-list-item'}
            disabled={isYearDisabled(
              new Date(yearNumber, 1, 1),
              minDate,
              maxDate
            )}
          >
            {yearNumber}
          </button>
        );
      })}
    </div>
  );
};

YearListView.displayName = 'YearListView';
