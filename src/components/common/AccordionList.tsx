import { FC } from 'react';
import Accordion from '@/components/reuseable/accordion';
// -------- data -------- //
const accordions = [
  {
    no: '1',
    expand: true,
    heading: 'Focused AV workflows',
    body: 'Bring projects, engineer bookings, documents and team communication into one organisation workspace.'
  },
  {
    no: '2',
    expand: false,
    heading: 'Enhanced Collaboration',
    body: 'Shared schedules and communication tools help integrators, managers and engineers work from the same information.'
  },
  {
    no: '3',
    expand: false,
    heading: 'User-Friendly Design',
    body: 'Clear project, scheduling and member workflows help teams get started without complex configuration.'
  },
  {
    no: '4',
    expand: false,
    heading: 'Business-hours support',
    body: 'Contact the Snatchi team by email for account, billing and product assistance during business hours.'
  }
];

const AccordionList: FC = () => {
  return (
    <div className="accordion accordion-wrapper" id="accordionExample">
      {accordions.map((item) => (
        <Accordion type="plain" key={item.no} {...item} />
      ))}
    </div>
  );
};

export default AccordionList;
