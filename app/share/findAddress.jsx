import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { Form, Button } from 'react-bootstrap';
import { searchAddress, formatAddressParts } from '../../utils/helpers';

const FindAddress = ({ label ='Find Site Address', handleSelectedAddress }) => {
  const [fields, setFields] = useState({
    status: false,
    query: '',
    place_id: 0
  });
  const [searchResults, setSearchResults] = useState([]);
  const [findAddressStatus, setFindAddressStatus] = useState(false);

  const handleFind = async (e) => {
    e.preventDefault();
    const results = await searchAddress(fields.query);
    if (results) {
      setSearchResults(results);
    }
  };

  const handleSelectAddress = async (place_id) => {
    const results = searchResults.find((address) => address.place_id === parseFloat(place_id));
    results && handleSelectedAddress(results);
  };

  return (
    <>
      <Form.Group>
        <div className="d-flex align-items-center justify-content-start mt-2 mb-3">
          <Form.Check
            type="switch"
            id="custom-switch"
            value={fields.status}
            onChange={(e) => {
              setFindAddressStatus(e.target.checked);
              setFields({ ...fields, status: e.target.checked });
            }}
          />
          <span className="text-dark ms-1">{label}</span>
        </div>
      </Form.Group>
      {findAddressStatus && (
        <>
          <div className="d-flex align-items-center justify-content-start mt-2 mb-3">
            <input
              id="find-address"
              name="find-address"
              placeholder="Enter street address or post code"
              value={fields.query}
              maxLength={50}
              onChange={(e) => setFields({ ...fields, query: e.target.value })}
              className="input-group form-control py-2 rounded-circle-30"
            />
            <Button className="ms-2" onClick={(e) => handleFind(e)}>
              <FaSearch size={18}></FaSearch>
            </Button>
          </div>
          {searchResults?.length !== 0 && (
            <div className="row mb-2">
              <div className="col-md-12">
                <Form.Group controlId="formName" className="mb-1">
                  <Form.Select
                    aria-label="Please select address"
                    onChange={(e) => {
                      setFields({ ...fields, place_id: e.target.value });
                      handleSelectAddress(e.target.value);
                    }}
                  >
                    <option>Please select address</option>
                    {searchResults.map((result, index) => {
                      return (
                        <option key={index} value={result.place_id}>
                          {formatAddressParts(result.address)}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default FindAddress;
