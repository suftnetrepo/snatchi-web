import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { Datepicker } from './Datepicker';
import { dateConverter } from '../../../utils/helper';

const DateTimePicker = ({
  onDateChange,
  defaultDate = false,
  value,
  label,
  localFormat = 'en-GB',
  errorMessage,
  successMessage,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState();

  useEffect(() => {
    defaultDate && setSelectedDate(dateConverter(new Date().toLocaleDateString(localFormat)));
  }, [defaultDate]);

  const handleButtonClick = () => {
    setShowPicker(!showPicker);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowPicker(false);
    onDateChange(date);
  };

  return (
    <div className="position-relative">
      {label && <label>{label}</label>}
      <div
        className={classnames(
          `flex-row justify-content-start align-items-center pointer datepicker-selected ${
            errorMessage ? 'is-invalid' : null
          }`,
        )}
        onClick={handleButtonClick}
      >
        <FaRegCalendarAlt size={25} />
        <p className="text-date-picker ms-xl-2">{value || selectedDate}</p>
      </div>
      {errorMessage ? (
        <div className={'invalid-feedback'}>{errorMessage}</div>
      ) : null}
      {successMessage ? (
        <div className={'valid-feedback'}>{successMessage}</div>
      ) : null}

      {showPicker && (
        <div className="datepicker-container-position">
          <Datepicker
            onDateChange={(date) =>
              handleDateChange(               
                dateConverter(date?.toLocaleDateString(localFormat))
              )
            }
          />
        </div>
      )}
    </div>
  );
};

export { DateTimePicker, Datepicker };
