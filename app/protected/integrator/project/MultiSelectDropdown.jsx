
import React, { useEffect, useState } from 'react';
import Select from 'react-select';

const customStyles = {
  control: (provided, state) => ({
    ...provided,
    border: '1px solid #000000',
    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : 'none',
    borderRadius: '.375rem',
    padding: '2px 2px',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#0d6efd',
    color: 'white',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'white',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: 'white',
    ':hover': {
      backgroundColor: '#0a58ca',
      color: 'white',
    },
  }),
};

const MultiSelectDropdown = ({
  options = [],
  label = "Select Options",
  selectedValues = [],
  onChange,
  placeholder = "Choose...",
}) => {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));
    setSelected(selectedOptions);
  }, [selectedValues, options]);

  const handleChange = (selectedOptions) => {
    setSelected(selectedOptions);
    const selectedValues = selectedOptions.map((opt) => opt.value);
    onChange(selectedValues); 
  };

  return (
    <div className="mb-3">
      {label && <label className="form-label text-dark">{label}</label>}
      <Select
        options={options}
        value={selected}
        isMulti
        styles={customStyles}
        className="basic-multi-select"
        classNamePrefix="select"
        placeholder={placeholder}
        onChange={handleChange}
      />
    </div>
  );
};

export default MultiSelectDropdown;
