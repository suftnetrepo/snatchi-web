'use client';

import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import Editor from '../../../../src/components/reuseable/editor';
import 'react-datetime/css/react-datetime.css';
import FindAddress from '../../../share/findAddress';
import MultiSelectDropdown from './MultiSelectDropdown';
import { ppeOptions } from '@/utils/helpers';

const ProjectForm = ({ errorMessages, handleSubmit, handleChange, fields, handleSelectedAddress }) => {
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (!!fields?.first_name || !!fields?.last_name) {
      setShowContact(true);
    }
  }, [fields?.first_name, fields?.last_name]);

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    handleChange('description', pastedText);
    e.preventDefault();
  };

  const handlePPEChange = (values) => {
    handleChange('ppe', values);
  };

  return (
    <Form>
      <div className="row">
        <div className="col-md-6">
          <Form.Group controlId="formName" className="mb-3">
            <Form.Label className="text-dark">Project Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter project name"
              name="name"
              value={fields?.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="border-dark"
            />
            {errorMessages?.name?.message && (
              <span className="text-danger fs-13 ms-2">{errorMessages?.name?.message}</span>
            )}
          </Form.Group>
        </div>

        <div className="col-md-6"></div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formManager" className="mb-3">
                <Form.Label className="text-dark">Project Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter project number"
                  name="project_number"
                  value={fields?.project_number}
                  onChange={(e) => handleChange('project_number', e.target.value)}
                  className="border-dark"
                />
                {errorMessages?.project_number?.message && (
                  <span className="text-danger fs-13">{errorMessages?.project_number?.message}</span>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">

            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formStartDate">
                <Form.Label className="text-dark">Start Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={fields?.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="border-dark"
                />
              </Form.Group>
              {errorMessages?.startDate?.message && (
                <span className="text-danger fs-13">{errorMessages?.startDate?.message}</span>
              )}
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formEndDate">
                <Form.Label className="text-dark">End Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={fields?.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="border-dark"
                />
              </Form.Group>
              {errorMessages?.endDate?.message && (
                <span className="text-danger fs-13">{errorMessages?.endDate?.message}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Form.Group>
        <div className="d-flex align-items-center justify-content-start mt-2 mb-1">
          <Form.Check
            type="switch"
            id="custom-switch"
            checked={showContact}
            value={fields?.siteContact}
            onChange={(e) => {
              setShowContact(e.target.checked);
            }}
            className="custom-switch"
          />
          <span className="text-dark ms-1">{'Site Contact'}</span>
        </div>
      </Form.Group>
      <div>
        {showContact && (
          <>
            <div className="col-md-12">
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formFirstname" className="mb-3">
                      <Form.Label className="text-dark">Firstname</Form.Label>
                      <Form.Control
                        type="firstname"
                        placeholder="Enter firstname"
                        name="firstname"
                        value={fields?.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.first_name?.message && (
                        <span className="text-danger fs-13">{errorMessages?.first_name?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group controlId="formLastname" className="mb-3">
                      <Form.Label className="text-dark">Lastname</Form.Label>
                      <Form.Control
                        type="last_name"
                        placeholder="Enter last_name"
                        name="last_name"
                        value={fields?.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.last_name?.message && (
                        <span className="text-danger fs-13">{errorMessages?.last_name?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formMobile" className="mb-3">
                      <Form.Label className="text-dark">Mobile</Form.Label>
                      <Form.Control
                        type="mobile"
                        placeholder="Enter mobile"
                        name="mobile"
                        value={fields?.mobile}
                        onChange={(e) => handleChange('mobile', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.mobile?.message && (
                        <span className="text-danger fs-13">{errorMessages?.mobile?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group controlId="formEmail" className="mb-3">
                      <Form.Label className="text-dark">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        name="email"
                        value={fields?.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.email?.message && (
                        <span className="text-danger fs-13">{errorMessages?.email?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="row mt-1">
        <div className="col-md-12">
          <div className="row">
            <div className="col-md-6">
              <FindAddress handleSelectedAddress={handleSelectedAddress} />
              {fields?.completeAddress && <span>{fields.completeAddress}</span>}
            </div>
          </div>
        </div>

        {fields?.completeAddress && (
          <>
            <div className="col-md-12">
              <div className="col-md-6">
                <div className="mb-3">
                  <Form.Group controlId="formAddressLine1" className="mb-3">
                    <Form.Label className="text-dark">AddressLine1</Form.Label>
                    <Form.Control
                      type="addressLine1"
                      placeholder="Enter addressLine1"
                      name="addressLine1"
                      value={fields?.addressLine1}
                      onChange={(e) => handleChange('addressLine1', e.target.value)}
                      className="border-dark"
                    />
                    {errorMessages?.addressLine1?.message && (
                      <span className="text-danger fs-13">{errorMessages?.addressLine1?.message}</span>
                    )}
                  </Form.Group>
                </div>
              </div>
            </div>

            <div className="col-md-12">
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formTown" className="mb-3">
                      <Form.Label className="text-dark">Town</Form.Label>
                      <Form.Control
                        type="town"
                        placeholder="Enter town"
                        name="town"
                        value={fields?.town}
                        onChange={(e) => handleChange('town', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.town?.message && (
                        <span className="text-danger fs-13">{errorMessages?.town?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group controlId="formCounty" className="mb-3">
                      <Form.Label className="text-dark">County</Form.Label>
                      <Form.Control
                        type="county"
                        placeholder="Enter county"
                        name="county"
                        value={fields?.county}
                        onChange={(e) => handleChange('county', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.county?.message && (
                        <span className="text-danger fs-13">{errorMessages?.county?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-12">
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group controlId="formPostcode" className="mb-3">
                      <Form.Label className="text-dark">Post code</Form.Label>
                      <Form.Control
                        type="postcode"
                        placeholder="Enter postcode"
                        name="postcode"
                        value={fields?.postcode}
                        onChange={(e) => handleChange('postcode', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.postcode?.message && (
                        <span className="text-danger fs-13">{errorMessages?.postcode?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group controlId="formCountry" className="mb-3">
                      <Form.Label className="text-dark">Country</Form.Label>
                      <Form.Control
                        type="country"
                        placeholder="Enter country"
                        name="country"
                        value={fields?.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        className="border-dark"
                      />
                      {errorMessages?.country?.message && (
                        <span className="text-danger fs-13">{errorMessages?.country?.message}</span>
                      )}
                    </Form.Group>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="row">
        <div className="col-md-12">
          <Form.Group controlId="formFirstName" className="mb-3 mt-3">
            <Form.Label className="text-dark">Scope of Work</Form.Label>
            <Editor
              onChange={(e) => handleChange('description', e)}
              onPaste={handlePaste}
              value={fields?.description}
            />
            {errorMessages?.description?.message && (
              <span className="text-danger fs-13">{errorMessages.description?.message}</span>
            )}
          </Form.Group>
        </div>
      </div>

      <div className="row">
        <div className="col-md-3">
          <MultiSelectDropdown
            options={ppeOptions}
            label="PPE"
            selectedValues={fields?.ppe || []}
            onChange={handlePPEChange}
            placeholder="Select PPE..."
          />
        </div>
        <div className="col-md-9"></div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="row">
            <div className="col-md-6">
              <Form.Group controlId="formLastName" className="mb-3">
                <Form.Label className="text-dark">Status</Form.Label>
                <Form.Select
                  className="border-dark"
                  aria-label="Select Status"
                  value={fields?.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option>Select status</option>
                  <option value="Pending">Pending</option>
                  <option value="Progress">Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Canceled">Canceled</option>
                </Form.Select>
                {errorMessages?.status?.message && (
                  <span className="text-danger fs-13">{errorMessages?.status?.message}</span>
                )}
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group controlId="formEmail" className="mb-3">
                <Form.Label className="text-dark">Priority</Form.Label>
                <Form.Select
                  className="border-dark"
                  aria-label="Select Priority"
                  value={fields?.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option>Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
                {errorMessages?.priority?.message && (
                  <span className="text-danger fs-13">{errorMessages?.priority?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <Form.Group>
            <div className="d-flex align-items-center justify-content-start mb-3">
              <Form.Check
                type="switch"
                id="notify-switch"
                checked={fields?.notify}
                value={fields?.notify}
                onChange={(e) => {
                 handleChange('notify', e.target.checked)
                }}
                className="custom-switch"
              />
              <span className="text-dark ms-1">{'Notify Engineers'}</span>
            </div>
          </Form.Group>
        </div>
      </div>
      <div className="d-flex justify-content-start">
        <Button type="button" variant="primary" onClick={() => handleSubmit()}>
          Save Changes
        </Button>
      </div>
    </Form>
  );
};

export default ProjectForm;
