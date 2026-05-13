'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { Button } from 'react-bootstrap';
import { MdArrowBack } from 'react-icons/md';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enGB from 'date-fns/locale/en-GB';
import { useRouter, useSearchParams } from 'next/navigation';
import { useScheduler } from '../../../../hooks/useScheduler';
import { RenderScheduleOffcanvas } from './renderScheduleOffcanvas';
import { chose, capitalize } from '../../../../utils/utils';
import { validate } from '../../../../validator/validator';

const locales = {
  'en-GB': enGB
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

export default function Scheduler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const engineerId = searchParams.get('engineerId');
  const firstName = searchParams.get('first_name');
  const lastName = searchParams.get('last_name');
  const searchQuery = searchParams.get('searchQuery');
  const {
    data,
    error,
    fields,
    rules,
    handleSave,
    handleChange,
    handleSelection,
    handleDelete,
    handleReset,
    handleEdit,
    success,
    handleProjectSelect
  } = useScheduler(engineerId);
  const [show, setShow] = useState(false);
  const [errorMessages, setErrorMessages] = useState({});

  console.log('Scheduler fields:', fields, projectId);

  // Project selection effect
  useEffect(() => {
    if (projectId) {
      handleProjectSelect(projectId);
    }
  }, [projectId]); 

  const handleClose = () => {
    setShow(false);
    handleReset();
  };

  const handleSelect = (slotInfo) => {
    handleSelection(slotInfo.start, slotInfo.end, engineerId, projectId);
    setShow(true);
  }

  const handleSubmit = async () => {
    setErrorMessages({});

    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const body = chose(fields, ['_id', 'title', 'startDate', 'endDate', 'startTime', 'endTime', 'status', 'engineer', 'project', 'description']);

    if (fields._id) {
      await handleEdit(body, fields._id);
    } else {
      delete body._id;
      await handleSave(body);
    }
  };

  return (
    <div className="py-0">
      <div className="calendar-wrapper">
        <div className="d-flex justify-content-start align-items-center mb-3">
          <Button
            variant="outline-secondary"
            onClick={() => router.push(`/protected/integrator/search-engineers?projectId=${projectId}&searchQuery=${searchQuery}`)}
          >
            <MdArrowBack size={24} /> Back
          </Button>
          <h3 className="card-title ms-2">{`${capitalize(firstName)} ${capitalize(lastName)}`}</h3>
        </div>
        <Calendar
          localizer={localizer}
          events={data}
          startAccessor="startDate"
          endAccessor="endDate"
          defaultView="week"
          views={['week', 'day']}
          selectable
          step={15}
          timeslots={4}
          onSelectSlot={(slotInfo) => handleSelect(slotInfo)}
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      <RenderScheduleOffcanvas
        error={error}
        fields={fields}
        errorMessages={errorMessages}
        handleChange={handleChange}
        success={success}
        handleSubmit={handleSubmit}
        show={show}
        handleClose={handleClose}
        handleDelete={handleDelete}
      />
    </div>
  );
}
