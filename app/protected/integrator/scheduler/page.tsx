'use client';

import React, { useEffect, useState } from 'react';
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-react';
import { validate } from '@/validator/validator';
import { useScheduler } from '../../../../hooks/useScheduler';
import { RenderScheduleOffcanvas } from './renderScheduleOffcanvas';
import { chose } from '../../../../utils/utils';

const initialConfig: DayPilot.SchedulerConfig = {
  startDate: new Date().toISOString().split('T')[0],
  days: 366,
  scale: 'Day',
  timeHeaders: [{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }],
  rowHeaderColumns: [{ text: 'Engineers', width: 100 }]
};

export default function Scheduler() {
  const [config, setConfig] = useState(initialConfig);
  const [scheduler, setScheduler] = useState<DayPilot.Scheduler>();
  const [errorMessages, setErrorMessages] = useState({});
  const {
    handleSelectedUpdate,
    events,
    resources,
    error,
    fields,
    rules,
    handleSave,
    handleChange,
    handleSelection,
    handleDelete,
    handleReset,
    handleEdit,
    handleResizeUpdate,
    success
  } = useScheduler();
  const [show, setShow] = useState(false);

  console.log('...............fields', fields);
  console.log('........................events', events);
  console.log('...............resources', resources);

  const handleClose = () => {
    setShow(false);
    handleReset();
  };

  const handleSubmit = async () => {
    setErrorMessages({});

    const validationResult = validate(fields, rules);

    if (validationResult.hasError) {
      setErrorMessages(validationResult.errors);
      return;
    }

    const body = chose(fields, ['_id', 'title', 'startDate', 'endDate', 'status', 'user', 'description']);

    if (fields._id) {
      await handleEdit(body, fields._id);
    } else {
      delete body._id;
      await handleSave(body);
    }
  };

  useEffect(() => {
    if (!scheduler || scheduler?.disposed()) {
      return;
    }

    scheduler.update({ resources, events });
  }, [scheduler, events, resources]);

  const onTimeRangeSelected = async (args: DayPilot.SchedulerTimeRangeSelectedArgs) => {
    setShow(true);
    scheduler?.clearSelection();

    console.log('onTimeRangeSelected', args.resource);
    handleSelection(args.start.toDate(), args.end.toDate(), args.resource.toString());
  };

  const onBeforeEventRender = (args: DayPilot.SchedulerBeforeEventRenderArgs) => {
    args.data.areas = [
      {
        right: 10,
        top: 'calc(50% - 7px)',
      
        backColor: '#cccccc',
        fontColor: '#ffffff',
        padding: 1,
        style: 'border-radius: 50%'
      }
    ];

    console.log('onBeforeEventRender', args.data);

    if (args.data.lock) {
      args.data.areas.push({
        right: 26,
        top: 6,
        width: 24,
        height: 24,
        padding: 4,
        style: 'border-radius: 50%'
      });

      args.data.backColor = '#cccccc';
      args.data.borderColor = '#cccccc';
      args.data.fontColor = '#000000';
      args.data.moveDisabled = true;
      args.data.resizeDisabled = true;
      args.data.clickDisabled = true;
      args.data.deleteDisabled = true;
    }
  };

  const onBeforeRowHeaderRender = (args: DayPilot.SchedulerBeforeRowHeaderRenderArgs) => {
    // args.row.columns[1].horizontalAlignment = "center";
    // if (args.row.data.status === 'Block') {
    //   args.row.columns[2].areas = [
    //     {
    //       left: 'calc(50% - 8px)',
    //       top: 10,
    //       width: 20,
    //       height: 20,
    //       symbol: '/daypilot.svg#padlock',
    //       fontColor: '#777777'
    //     }
    //   ];
    // }
  };

  return (
    <div>
      <DayPilotScheduler
        {...config}
        onTimeRangeSelected={onTimeRangeSelected}
        onBeforeEventRender={onBeforeEventRender}
        onBeforeRowHeaderRender={onBeforeRowHeaderRender}
        controlRef={setScheduler}
        onEventClick={(args) => {
          setShow(true);
          handleSelectedUpdate(args.e.data);
        }}
        onEventResize={async (args) => {
          let body = chose(args.e.data, ['_id', 'title', 'startDate', 'endDate', 'status', 'description']);
          body.endDate = args.newEnd.toString();
          body.startDate = args.newStart.toString();
          await handleResizeUpdate(body, args.e.data._id);
        }}
      />
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
function omit<T, U>(
  fields: Record<string, any>,
  arg1: string[]
): Partial<import('../../../../hooks/useScheduler').Schedule> {
  throw new Error('Function not implemented.');
}
