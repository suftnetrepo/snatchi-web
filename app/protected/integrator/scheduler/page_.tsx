// 'use client';

// import React, { useEffect, useState } from 'react';
// import { DayPilot, DayPilotScheduler } from '@daypilot/daypilot-lite-react';
// import { validate } from '@/validator/validator';
// import { useScheduler } from '../../../../hooks/useScheduler';
// import { RenderScheduleOffcanvas } from './renderScheduleOffcanvas';
// import { chose } from '../../../../utils/utils';

// const initialConfig: DayPilot.SchedulerConfig = {
//   startDate: new Date().toISOString().split('T')[0],
//   days: 60,
//   scale: 'Day',
//   timeHeaders: [{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }],
//   eventHeight: 30,
//   cellWidth: 40,
//   durationBarVisible: false,
//   rowHeaderWidth: 160,
// };

// interface MyEventData extends DayPilot.EventData {
//   status?: 'Accepted' | 'Declined' | 'Neutral' | 'Pending';
//   lock?: boolean;
//   moveDisabled?: boolean;
//   resizeDisabled?: boolean;
//   clickDisabled?: boolean;
//   deleteDisabled?: boolean;
// }

// export default function Scheduler() {
//   const [config, setConfig] = useState(initialConfig);
//   const [scheduler, setScheduler] = useState<DayPilot.Scheduler>();
//   const [errorMessages, setErrorMessages] = useState({});
//   const {
//     handleSelectedUpdate,
//     events,
//     resources,
//     error,
//     fields,
//     rules,
//     handleSave,
//     handleChange,
//     handleSelection,
//     handleDelete,
//     handleReset,
//     handleEdit,
//     handleResizeUpdate,
//     success
//   } = useScheduler();
//   const [show, setShow] = useState(false);

//   const handleClose = () => {
//     setShow(false);
//     handleReset();
//   };

//   const handleSubmit = async () => {
//     setErrorMessages({});

//     const validationResult = validate(fields, rules);

//     if (validationResult.hasError) {
//       setErrorMessages(validationResult.errors);
//       return;
//     }

//     const body = chose(fields, ['_id', 'title', 'startDate', 'endDate', 'status', 'user', 'description']);

//     if (fields._id) {
//       await handleEdit(body, fields._id);
//     } else {
//       delete body._id;
//       await handleSave(body);
//     }
//   };

//   useEffect(() => {
//     if (!scheduler || scheduler?.disposed()) {
//       return;
//     }

//     scheduler.update({ resources, events });
//   }, [scheduler, events, resources]);

//   const onTimeRangeSelected = async (args: DayPilot.SchedulerTimeRangeSelectedArgs) => {
//     setShow(true);
//     scheduler?.clearSelection();

//     handleSelection(args.start.addDays(1).toDate(), args.end.toDate(), args.resource.toString());
//   };

//   const onBeforeEventRender = (args: { data: MyEventData }) => {
//     args.data.cssClass = 'rounded-event'; // custom class
//     args.data.borderColor = '#ff66cc';

//     args.data.areas = [
//       {
//         right: 10,
//         top: 'calc(50% - 7px)',
//         backColor: '#cccccc',
//         fontColor: '#ffffff',
//         padding: 1,
//         style: 'border-radius: 50%'
//       }
//     ];

//     if (args.data.status === 'Accepted') {
//       args.data.areas.push({ right: 26, top: 6, width: 24, height: 24, padding: 4, style: 'border-radius: 50%' });

//       args.data.backColor = '#33cc33';
//       args.data.borderColor = '#33cc33';
//       args.data.fontColor = '#ffffff';
//     }

//     if (args.data.status === 'Declined') {
//       args.data.areas.push({ right: 26, top: 6, width: 24, height: 24, padding: 4, style: 'border-radius: 50%' });

//       args.data.backColor = '#f87171';
//       args.data.borderColor = '#f87171';
//       args.data.fontColor = '#ffffff';
//     }

//     if (args.data.status === 'Pending') {
//       args.data.areas.push({ right: 26, top: 6, width: 24, height: 24, padding: 4, style: 'border-radius: 50%' });

//       args.data.backColor = '#d97706';
//       args.data.borderColor = '#d97706';
//       args.data.fontColor = '#ffffff';
//     }

//     if (args.data.lock) {
//       args.data.areas.push({ right: 26, top: 6, width: 24, height: 24, padding: 4, style: 'border-radius: 50%' });

//       args.data.backColor = '#a1a1aa';
//       args.data.borderColor = '#a1a1aa';
//       args.data.fontColor = '#000000';
//       args.data.moveDisabled = true;
//       args.data.resizeDisabled = true;
//       args.data.clickDisabled = true;
//       args.data.deleteDisabled = true;
//     }
//   };

//   const onBeforeRowHeaderRender = (args: DayPilot.SchedulerBeforeRowHeaderRenderArgs) => {
//     args.row.backColor = '#ffffff';
//     args.row.html = `
//     <table style="width:100%; border-collapse:collapse;">
//       <tr>
    
//         <td style="padding:4px 6px; font-size:14px; font-weight:600; color:#333;">
//           ${args.row.name}
//         </td>
//       </tr>
//     </table>
//   `;
//   };

//   return (
// <div style={{ width: "100%", height: "100vh" }}>
//       <DayPilotScheduler
//         {...config}
//         onTimeRangeSelected={onTimeRangeSelected}
//         onBeforeEventRender={onBeforeEventRender}
//         onBeforeRowHeaderRender={onBeforeRowHeaderRender}
//         controlRef={setScheduler}
//         onEventClick={(args) => {
//           setShow(true);
//           handleSelectedUpdate(args.e.data);
//         }}
//         onEventResize={async (args) => {
//           let body = chose(args.e.data, ['_id', 'title', 'startDate', 'endDate', 'status', 'description']);
//           body.endDate = args.newEnd.toString();
//           body.startDate = args.newStart.toString();
//           await handleResizeUpdate(body, args.e.data._id);
//         }}
//       />
//       <RenderScheduleOffcanvas
//         error={error}
//         fields={fields}
//         errorMessages={errorMessages}
//         handleChange={handleChange}
//         success={success}
//         handleSubmit={handleSubmit}
//         show={show}
//         handleClose={handleClose}
//         handleDelete={handleDelete}
//       />
//     </div>
//   );
// }
