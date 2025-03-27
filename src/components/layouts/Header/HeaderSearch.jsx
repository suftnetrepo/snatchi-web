import React, { useState } from 'react';
import { InputGroup, FormControl } from 'react-bootstrap';

const HeaderSearch = ({ onSearch, placeholder = 'Search ...' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onSearch && searchTerm) {
        onSearch(searchTerm);
      }
    }
  };

  return (
    <div className="d-flex justify-content-center px-3 mb-2">
      <InputGroup
        size="sm"
        className="w-100 w-md-75 w-lg-50"
        style={{
          borderRadius: '30px',
          border: '2px solid #f2f2f2',
          overflow: 'hidden',
          backgroundColor: '#fff'
        }}
      >
        <InputGroup.Text id="basic-addon1" style={{ backgroundColor: 'transparent', border: 'none' }}>
          <i className="bi bi-search" style={{ fontSize: '20px', color: '#ccc' }}></i>
        </InputGroup.Text>

        <FormControl
          placeholder={placeholder}
          aria-label={placeholder}
          value={searchTerm}
          maxLength={50}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ border: 'none', boxShadow: 'none' }}
        />
      </InputGroup>
    </div>
  );
};

export default HeaderSearch;
