'use client';

import React, { useEffect, useState } from 'react';
import { DayPilot, DayPilotScheduler } from 'daypilot-pro-react';
import { useScheduler } from '../../../../hooks/useScheduler';
import { RenderTeamOffcanvas } from './renderTeamOffcanvas';
import { useAppContext } from '@/Store/AppContext';

export default function Scheduler() {
  const { updateSelectedDate } = useAppContext();
  const [scheduler, setScheduler] = useState<DayPilot.Scheduler>();
  const { data, resources, error, handleSelection } = useScheduler();
  const [showTeamOffcanvas, setShowTeamOffcanvas] = useState(false);

  const handleCloseTeamOffcanvas = () => {
    setShowTeamOffcanvas(false);
  };
  const handleShowTeamOffcanvas = () => {
    setShowTeamOffcanvas(true);
  };

  console.log('........................data', data);
  console.log('...............resources', resources);

  const initialConfig: DayPilot.SchedulerConfig = {
    startDate: new Date().toISOString().split('T')[0],
    days: 366,
    scale: 'Day',
    timeHeaders: [{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }],
    rowHeaderColumns: [{ text: 'Engineers', width: 100 }]
  };

  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    if (!scheduler || scheduler?.disposed()) {
      return;
    }

    const events = [
      {
        id: 1,
        text: 'Delivery 1',
        start: '2024-01-03T00:00:00',
        end: '2024-01-13T00:00:00',
        resource: 'B',
        barColor: '#5bbe2d'
      },
      {
        id: 2,
        text: 'Delivery 2',
        start: '2024-01-05T00:00:00',
        end: '2024-01-10T00:00:00',
        resource: 'D',
        barColor: '#f1c232'
      }
    ];
    scheduler.update({ resources, events });
  }, [scheduler, data, resources]);

  const onTimeRangeSelected = async (args: DayPilot.SchedulerTimeRangeSelectedArgs) => {
    setShowTeamOffcanvas(true);
    scheduler?.clearSelection();
    updateSelectedDate(args.start.toDate(), args.end.toDate(), DayPilot.guid());
  };

  const onBeforeEventRender = (args: DayPilot.SchedulerBeforeEventRenderArgs) => {
    args.data.areas = [
      {
        right: 10,
        top: 'calc(50% - 7px)',
        width: 18,
        height: 18,
        symbol: '/daypilot.svg#checkmark-2',
        backColor: '#999999',
        fontColor: '#ffffff',
        padding: 2,
        style: 'border-radius: 50%'
      }
    ];
  };

  const onBeforeRowHeaderRender = (args: DayPilot.SchedulerBeforeRowHeaderRenderArgs) => {
    // args.row.columns[1].horizontalAlignment = "center";
    // if (args.row.data.status === "locked") {
    //     args.row.columns[2].areas = [
    //         {left: "calc(50% - 8px)", top: 10, width: 20, height: 20, symbol: "/daypilot.svg#padlock", fontColor: "#777777"}
    //     ];
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
      />
      <RenderTeamOffcanvas show={showTeamOffcanvas} handleClose={handleCloseTeamOffcanvas} />
    </div>
  );
}
