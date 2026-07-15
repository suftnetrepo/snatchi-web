'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { Button } from 'react-bootstrap';
import { MdArrowBack } from 'react-icons/md';
import { useSession } from 'next-auth/react';
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

const statusTheme = {
  Pending: {
    color: '#f59e0b',
    softBg: '#fef3c7'
  },
  Accepted: {
    color: '#2563eb',
    softBg: '#dbeafe'
  },
  Progress: {
    color: '#8b5cf6',
    softBg: '#ede9fe'
  },
  Completed: {
    color: '#16a34a',
    softBg: '#dcfce7'
  },
  Paid: {
    color: '#059669',
    softBg: '#d1fae5'
  },
  Declined: {
    color: '#dc2626',
    softBg: '#fee2e2'
  },
  Cancelled: {
    color: '#64748b',
    softBg: '#e2e8f0'
  }
};

const eventStyleGetter = (event) => {
  const theme = statusTheme[event.status] || statusTheme.Pending;

  return {
    style: {
      background: 'transparent',
      border: 'none',
      padding: 0,
      overflow: 'visible',
      color: 'inherit'
    },
    className: `calendar-event-shell`
  };
};

const PremiumCalendarEvent = ({ event }) => {
  const theme = statusTheme[event.status] || statusTheme.Pending;

  return (
    <div
      className="premium-event-card"
      style={{
        '--event-color': theme.color,
        '--event-soft-bg': theme.softBg
      }}
    >
      <div className="premium-event-top">
        <div className="premium-event-time">
          <span className="premium-event-clock">◷</span>
          <span>
            {event.startTime} - {event.endTime}
          </span>
        </div>

        <span className="premium-event-status">{event.status}</span>
      </div>

      <div className="premium-event-title">{event.title}</div>

      {event.description && <div className="premium-event-description">{event.description}</div>}

      <div className="premium-event-footer">
        <span className="premium-event-calendar">▣</span>
        <span>View details</span>
      </div>
    </div>
  );
};

function SchedulerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const engineerId = searchParams.get('engineerId');
  const firstName = searchParams.get('first_name');
  const lastName = searchParams.get('last_name');
  const searchQuery = searchParams.get('searchQuery');
  const from = searchParams.get('from');
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
    handleProjectSelect,
    handleViewEvent
  } = useScheduler(engineerId);
  const [show, setShow] = useState(false);
  const [errorMessages, setErrorMessages] = useState({});
  const { data: session } = useSession();

  useEffect(() => {
    if (projectId) {
      handleProjectSelect(projectId);
    }
  }, [projectId]);

  const handleClose = () => {
    setShow(false);
  };

  const handleSelect = (slotInfo) => {
    handleSelection(slotInfo.start, slotInfo.end, engineerId, projectId);
    setShow(true);
  };

  const handleEventClick = (event) => {
    if (event.integrator === session?.user?.integrator) {
      handleViewEvent(event);
    } else {
      handleSelection(event.startDate, event.endDate, engineerId, projectId);
    }

    setShow(true);
  };

  const handleSubmit = async () => {
    setErrorMessages({});

    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const body = chose(fields, [
      '_id',
      'title',
      'startDate',
      'endDate',
      'startTime',
      'endTime',
      'status',
      'engineer',
      'project',
      'description',
      'location'
    ]);

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
            onClick={() => {
              if (from === 'offcanvas') {
                router.back();
                return;
              }
              router.push(`/protected/integrator/search-engineers?projectId=${projectId}&searchQuery=${searchQuery}`);
            }}
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
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          components={{
            event: PremiumCalendarEvent
          }}
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

export default function Scheduler() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulerContent />
    </Suspense>
  );
}
