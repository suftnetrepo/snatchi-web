'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Offcanvas, Button, Form, Alert } from 'react-bootstrap';
import { MdCalendarMonth, MdCancel, MdChat } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import DeleteConfirmation from '../../../../src/components/elements/ConfirmDialogue';
import { OkDialogue } from '../../../../src/components/elements/ConfirmDialogue';
import styles from './scheduleBooking.module.scss';

const WEEKDAYS = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' }
];

const getBookingDates = (startDate, endDate, selectedDays) => {
  if (!startDate || !endDate) return [];
  const start = new Date(`${startDate.split('T')[0]}T12:00:00`);
  const end = new Date(`${endDate.split('T')[0]}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const dates = [];
  let inspectedDays = 0;
  for (const cursor = new Date(start); cursor <= end && dates.length <= 31 && inspectedDays <= 366; cursor.setDate(cursor.getDate() + 1)) {
    inspectedDays += 1;
    if (selectedDays.includes(cursor.getDay())) {
      dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`);
    }
  }
  return dates;
};

const RenderScheduleOffcanvas = ({
  errorMessages,
  show,
  handleClose,
  handleSubmit,
  fields,
  error,
  handleChange,
  handleDelete,
  success,
  loading = false,
  engineerServiceRates = [],
  engineerServiceRatesLoading = false
}) => {
  const router = useRouter();
  const [bookingMode, setBookingMode] = useState('single');
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const submissionLock = useRef(false);
  const isEditing = Boolean(fields?._id);
  const bookingDates = useMemo(
    () => bookingMode === 'multiple' ? getBookingDates(fields.startDate, fields.endDate, selectedDays) : [],
    [bookingMode, fields.startDate, fields.endDate, selectedDays]
  );
  const totalOffer = fields.price_offer ? Number(fields.price_offer) * bookingDates.length : null;

  useEffect(() => {
    if (!show) {
      submissionLock.current = false;
      setBookingMode('single');
      setSelectedDays([1, 2, 3, 4, 5]);
    }
  }, [show]);

  const handleRateChange = (rateId) => {
    handleChange('service_rate', rateId);

    // Auto-populate price_offer with the selected rate's amount
    const selectedRate = engineerServiceRates.find((rate) => rate._id === rateId);
    if (selectedRate) {
      handleChange('price_offer', selectedRate.rate);
    }
  };

  const handleOpenConversation = () => {
    if (fields.chat_id) {
      router.push(`/protected/integrator/chat?i=${fields.chat_id}`);
    }
  };

  const toggleDay = (day) => setSelectedDays((current) =>
    current.includes(day) ? current.filter((value) => value !== day) : [...current, day]
  );

  const submitBooking = async () => {
    if (submissionLock.current || loading) return;
    submissionLock.current = true;

    try {
      const saved = bookingMode === 'multiple' && !isEditing
        ? await handleSubmit({ bookingDates })
        : await handleSubmit();
      if (!saved) submissionLock.current = false;
    } catch (error) {
      submissionLock.current = false;
    }
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" className={styles.offcanvas}>
      <div className="d-flex flex-row justify-content-between align-items-center p-7">
        <div className="d-flex flex-column justify-content-start align-items-start">
          <p className="text-dark fw-bold fs-18"> Job Scheduler</p>
        </div>
        <div>
          <MdCancel size={48} color="black" onClick={handleClose} className="pointer" />
        </div>
      </div>
      <Offcanvas.Body>
        {error && (
          <div className="row">
            <div className="col-md-12">
              <Alert variant={'danger'}>{error}</Alert>
            </div>
          </div>
        )}
        <Form>
          {!isEditing && (
            <div className={styles.modePanel}>
              <span className={styles.sectionLabel}>Booking duration</span>
              <div className={styles.modeSwitch}>
                <button type="button" className={bookingMode === 'single' ? styles.activeMode : ''} onClick={() => setBookingMode('single')}>Single day</button>
                <button type="button" className={bookingMode === 'multiple' ? styles.activeMode : ''} onClick={() => setBookingMode('multiple')}>Multiple days</button>
              </div>
              {bookingMode === 'multiple' && (
                <p className={styles.modeHint}>Creates a separate, manageable booking for every selected working day.</p>
              )}
            </div>
          )}
          <div className="row">
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-12">
                  <Form.Group controlId="formTitle" className="mb-3">
                    <Form.Label className="text-dark"> Title</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Enter job title"
                      name="title"
                      value={fields?.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="border-dark"
                    />
                    {errorMessages?.title?.message && (
                      <span className="text-danger fs-13 ms-2">{errorMessages?.title?.message}</span>
                    )}
                  </Form.Group>
                </div>
              </div>
            </div>
            <div className="col-md-6"></div>
          </div>

          {/* Suggested Rate Section */}
          <div className="row mb-3">
            <div className="col-md-12">
              <Form.Group controlId="formSuggestedRate">
                <Form.Label className="text-dark">Suggested Rate</Form.Label>
                <Form.Select
                  className="border-dark"
                  value={fields?.service_rate || ''}
                  onChange={(e) => handleRateChange(e.target.value)}
                  disabled={engineerServiceRatesLoading}
                >
                  <option value="">Select Rate</option>
                  {engineerServiceRates.map((rate) => (
                    <option key={rate._id} value={rate._id}>
                      {rate.service_name} - £{rate.rate.toFixed(2)}
                    </option>
                  ))}
                </Form.Select>
                {engineerServiceRatesLoading && <small className="text-muted">Loading rates...</small>}
              </Form.Group>
            </div>
          </div>
          {bookingMode === 'multiple' && !isEditing && (
            <div className={styles.daysPanel}>
              <span className={styles.sectionLabel}>Working days</span>
              <div className={styles.weekdays}>
                {WEEKDAYS.map((day) => (
                  <button
                    type="button"
                    key={day.value}
                    className={selectedDays.includes(day.value) ? styles.selectedDay : ''}
                    onClick={() => toggleDay(day.value)}
                  >{day.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Price Offer Section */}
          <div className="row mb-3">
            <div className="col-md-12">
              <Form.Group controlId="formPriceOffer">
                <Form.Label className="text-dark">Offer (£)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter offer amount"
                  name="price_offer"
                  value={fields?.price_offer !== null && fields?.price_offer !== undefined ? fields.price_offer : ''}
                  onChange={(e) => handleChange('price_offer', e.target.value ? parseFloat(e.target.value) : null)}
                  className="border-dark"
                  min="0"
                  step="0.01"
                />
                {errorMessages?.price_offer?.message && (
                  <span className="text-danger fs-13 ms-2">{errorMessages?.price_offer?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group controlId="formStartDate">
                    <Form.Label className="text-dark">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={fields.startDate ? fields.startDate.split('T')[0] : ''}
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
                      type="date"
                      value={fields.endDate ? fields.endDate.split('T')[0] : ''}
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
          <div className="row mb-3">
            <div className="col-md-12">
              <div className="row">
                <div className="col-md-6">
                  <Form.Group controlId="formStartTime">
                    <Form.Label className="text-dark">Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={fields.startTime || ''}
                      onChange={(e) => handleChange('startTime', e.target.value)}
                      className="border-dark"
                    />
                  </Form.Group>
                  {errorMessages?.startTime?.message && (
                    <span className="text-danger fs-13">{errorMessages?.startTime?.message}</span>
                  )}
                </div>
                <div className="col-md-6">
                  <Form.Group controlId="formEndTime">
                    <Form.Label className="text-dark">End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={fields.endTime || ''}
                      onChange={(e) => handleChange('endTime', e.target.value)}
                      className="border-dark"
                    />
                  </Form.Group>
                  {errorMessages?.endTime?.message && (
                    <span className="text-danger fs-13">{errorMessages?.endTime?.message}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <Form.Group className="mb-3">
                <Form.Label className="text-dark">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter short note"
                  value={fields.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="border-dark"
                />
                {errorMessages?.description?.message && (
                  <span className="text-danger fs-13">{errorMessages.description?.message}</span>
                )}
              </Form.Group>
            </div>
          </div>
          <div className="col-md-6">
            <Form.Group controlId="formEmail" className="mb-3">
              <Form.Label className="text-dark">Status</Form.Label>
              <Form.Select
                className="border-dark"
                value={fields?.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option>Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </Form.Select>
              {errorMessages?.status?.message && (
                <span className="text-danger fs-13">{errorMessages?.status?.message}</span>
              )}
            </Form.Group>
          </div>
          {bookingMode === 'multiple' && !isEditing && (
            <div className={styles.summary}>
              <div className={styles.summaryIcon}><MdCalendarMonth /></div>
              <div>
                <strong>{bookingDates.length} daily booking{bookingDates.length === 1 ? '' : 's'}</strong>
                <p>{bookingDates.length ? `${bookingDates[0]}${bookingDates.length > 1 ? ` to ${bookingDates.at(-1)}` : ''} · ${fields.startTime || '--:--'}–${fields.endTime || '--:--'}` : 'Select a valid date range and working days.'}</p>
                {totalOffer !== null && <small>Estimated total offer: £{totalOffer.toFixed(2)}</small>}
              </div>
            </div>
          )}
          <div className="d-flex justify-content-start gap-2">
            <Button
              type="button"
              variant="primary"
              disabled={loading || (bookingMode === 'multiple' && !isEditing && (bookingDates.length < 2 || bookingDates.length > 31))}
              onClick={submitBooking}
            >
              {loading ? 'Checking availability…' : bookingMode === 'multiple' && !isEditing ? `Create ${bookingDates.length} bookings` : 'Save Changes'}
            </Button>
            {fields.chat_id && (
              <Button
                type="button"
                variant="info"
                onClick={handleOpenConversation}
                className="d-flex align-items-center gap-2"
              >
                <MdChat size={18} />
                Open Conversation
              </Button>
            )}
            {isEditing && (
              <DeleteConfirmation
                onConfirm={async (id) => {
                  handleDelete(id);
                  handleClose();
                }}
                onCancel={() => {}}
                itemId={fields._id}
              >
                <Button type="button" variant="outline-danger" className="ms-2" onClick={handleClose}>
                  Delete
                </Button>
              </DeleteConfirmation>
            )}

            <Button type="button" variant="secondary" className="ms-2" onClick={handleClose}>
              Close
            </Button>
          </div>
        </Form>
      </Offcanvas.Body>
      {success && (
        <OkDialogue
          show={success}
          message="Your changes was save successfully"
          onConfirm={() => {
            handleClose();
          }}
        />
      )}
    </Offcanvas>
  );
};

export { RenderScheduleOffcanvas };
