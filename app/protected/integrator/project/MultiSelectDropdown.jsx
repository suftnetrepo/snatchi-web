
import React, { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';

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
  const [allOptions, setAllOptions] = useState(options || []);

  useEffect(() => {
    setAllOptions(options || []);
  }, [options]);

  useEffect(() => {
    // Build selected option objects from selectedValues; create option objects for values not present in options
    const selectedOptions = (selectedValues || []).map((val) => {
      const found = (allOptions || []).find((opt) => opt.value === val);
      if (found) return found;
      // create a label from the value (capitalize first letter)
      const label = String(val)
        .split('_')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
      return { value: val, label };
    });
    setSelected(selectedOptions);
  }, [selectedValues, allOptions]);

  const handleChange = (selectedOptions) => {
    setSelected(selectedOptions || []);
    const selectedValues = (selectedOptions || []).map((opt) => opt.value);
    onChange(selectedValues);
  };

  const handleCreate = (inputValue) => {
    if (!inputValue) return;
    const newOption = { value: inputValue, label: inputValue };
    setAllOptions((prev) => [...prev, newOption]);
    const newSelected = [...(selected || []), newOption];
    setSelected(newSelected);
    onChange(newSelected.map((o) => o.value));
  };

  return (
    <div className="mb-3">
      {label && <label className="form-label text-dark">{label}</label>}
      <CreatableSelect
        options={allOptions}
        value={selected}
        isMulti
        styles={customStyles}
        className="basic-multi-select"
        classNamePrefix="select"
        placeholder={placeholder}
        onChange={handleChange}
        onCreateOption={handleCreate}
      />
    </div>
  );
};

export default MultiSelectDropdown;
