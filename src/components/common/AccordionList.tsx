import { FC } from 'react';
import Accordion from '@/components/reuseable/accordion';
// -------- data -------- //
const accordions = [
  {
    no: '1',
    expand: true,
    heading: 'Comprehensive Features',
    body: 'From Project setup to Task scheduling, Snatchi offers all the tools you need to manage AV projects efficiently.'
  },
  {
    no: '2',
    expand: false,
    heading: 'Enhanced Collaboration',
    body: 'Real-time updates and integrated communication tools keep your team, clients, and stakeholders on the same page.'
  },
  {
    no: '3',
    expand: false,
    heading: 'User-Friendly Design',
    body: 'Intuitive interfaces and customizable dashboards make Snatchi easy to use, saving time and boosting productivity.'
  },
  {
    no: '4',
    expand: false,
    heading: 'Exceptional Customer Support',
    body: 'Our dedicated support team is always ready to assist you. Whether you need technical guidance, troubleshooting, or personalized training, Snatchi ensures you never face challenges alone.'
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
