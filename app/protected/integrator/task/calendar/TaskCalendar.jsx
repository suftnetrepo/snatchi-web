'use client';

import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Row, Col, Button, ButtonGroup } from 'react-bootstrap';

const localizer = momentLocalizer(moment);

const TaskCalendar = ({ 
    setShow,
  data,
  handleSelect 
}) => {
  const handleSelectEvent = (event) => {
    setShow(true);
    if (event.id) {
      handleSelect(event.id);
    }
  };

  const handleSelectSlot = (event) => {
    setShow(true);
    if (event.id) {
      handleSelect(event.id);
    }
  };

  return (
    <div className="mt-4">
      <Row>
        <Col>
          <Calendar
            localizer={localizer}
            startAccessor="start"
            endAccessor="end"
            events={data}
            style={{ height: 500 }}
            views={['month']}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            components={{
              toolbar: ({ label, onNavigate }) => (
                <div className="d-flex justify-content-between mb-2">
                  <ButtonGroup>
                    <Button variant="primary" onClick={() => onNavigate('PREV')}>
                      &larr; Prev
                    </Button>
                    <Button variant="primary" onClick={() => onNavigate('TODAY')}>
                      Today
                    </Button>
                    <Button variant="primary" onClick={() => onNavigate('NEXT')}>
                      Next &rarr;
                    </Button>
                  </ButtonGroup>
                  <h5 className="m-0">{label}</h5>
                </div>
              )
            }}
            className="bg-light shadow-sm p-4"
          />
        </Col>
      </Row>
     
    </div>
  );
};

export default TaskCalendar;
