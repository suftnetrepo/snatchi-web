import Target from 'icons/lineal/Target';
import AwardTwo from 'icons/lineal/AwardTwo';
import BarChart from 'icons/lineal/BarChart';
import Megaphone from 'icons/lineal/Megaphone';
import SettingsThree from 'icons/lineal/SettingsThree';

const clients = [
  { id: 1, image: '/img/brands/c1.png' },
  { id: 2, image: '/img/brands/c2.png' },
  { id: 3, image: '/img/brands/c3.png' },
  { id: 4, image: '/img/brands/c4.png' },
  { id: 5, image: '/img/brands/c5.png' },
  { id: 6, image: '/img/brands/c6.png' },
  { id: 7, image: '/img/brands/c7.png' },
  { id: 8, image: '/img/brands/c8.png' }
];

const whatWeAre = [
  { id: 1, Icon: Target, title: 'Our Mission', description: 'Dapibus eu leo quam ornare curabitur blandit tempus.' },
  { id: 2, Icon: AwardTwo, title: 'Our Values', description: 'Aenean lacinia bibendum nulla sed consectetur.' }
];

const services = [
  { id: 1, Icon: Megaphone, title: 'Marketing', description: 'Nulla vitae elit libero pharetra augue dapibus.' },
  { id: 2, Icon: Target, title: 'Strategy', description: 'Vivamus sagittis lacus augue laoreet vel.' },
  { id: 3, Icon: SettingsThree, title: 'Development', description: 'Cras mattis consectetur purus sit amet.' },
  { id: 4, Icon: BarChart, title: 'Data Analysis', description: 'Aenean lacinia bibendum nulla sed consectetur.' }
];

const teams = [
  {
    id: 1,
    name: 'Coriss Ambady',
    designation: 'Financial Analyst',
    image: { '1x': '/img/avatars/t1.jpg', '2x': '/img/avatars/t1@2x.jpg 2x' }
  },
  {
    id: 2,
    name: 'Cory Zamora',
    designation: 'Marketing Specialist',
    image: { '1x': '/img/avatars/t2.jpg', '2x': '/img/avatars/t2@2x.jpg 2x' }
  },
  {
    id: 3,
    name: 'Nikolas Brooten',
    designation: 'Sales Manager',
    image: { '1x': '/img/avatars/t3.jpg', '2x': '/img/avatars/t3@2x.jpg 2x' }
  },
  {
    id: 4,
    name: 'Jackie Sanders',
    designation: 'Investment Planner',
    image: { '1x': '/img/avatars/t4.jpg', '2x': '/img/avatars/t4@2x.jpg 2x' }
  }
];

const progressList = [
  { id: 1, percent: 100, title: 'Marketing' },
  { id: 2, percent: 80, title: 'Strategy' },
  { id: 3, percent: 85, title: 'Development' }
];

const pricingList = [
  {
    monthlyPrice: 19,
    yearlyPrice: 199,
    planName: 'Premium',
    features: ['5 Projects', '100K API Access', '200MB Storage', 'Weekly Reports', '7/24 Support']
  },
  {
    monthlyPrice: 49,
    yearlyPrice: 499,
    planName: 'Corporate',
    features: ['20 Projects', '300K API Access', '500MB Storage', 'Weekly Reports', '7/24 Support']
  }
];

const accordions = [
  [ 
  {
    no: 'Two',
    expand: false,
    heading: `How can I contribute to Tech First Foundation's mission if I don't have IT equipment to donate?`,
    body: `At Tech First Foundation, we deeply value every form of support, not just IT equipment donations. You can contribute to our mission by making a financial donation, spreading awareness about our cause on social media, or even volunteering your time and expertise. Every contribution, regardless of its form, helps us empower individuals and communities through technology and education.`
  },
  {
    no: 'Three',
    expand: false,
    heading: `I'm interested in donating financially. How will my contribution be used to support TFF's initiatives?`,
    body: `Your financial contribution is invaluable to us and will be used to support our various initiatives, one that we are currently undertaking is our opening project at Ansa-Ud Deen Nursery and Primary School located in Ilupeju region of Ekiti state, in Nigeria.`
  },
],[
  {
    no: 'Four',
    expand: false,
    heading:
      'What types of IT equipment does TFF accept for donation & are their any specific requirements/conditions?',
    body: `At Tech First Foundation, we accept donations of various IT equipment, including laptops, computers, printers, tablets, and other digital devices. We appreciate donations in working condition, but we also accept devices that may require refurbishment. If you have any specific questions or concerns about the condition of your donated IT equipment, please don't hesitate to reach out to us. We're here to ensure that your donation makes a positive impact in the communities we serve.`
  },
  {
    no: '5',
    expand: false,
    heading: 'How can I donate my old laptops or computers to TFF?',
    body: `Donating your old laptops or computers to Tech First Foundation is simple. You can reach out to us through our website, fill in our IT Equipment Donation Form or contact us directly via email or phone. We'll provide you with all the necessary information and instructions for donating your IT equipment. Our team will ensure that your donation is received and utilized effectively to support our educational initiatives.`
  },
  {
    no: '6',
    expand: false,
    heading: `Can I specify how I want my donation to be used within TFF's programs and projects?`,
    body: `Absolutely! At Tech First Foundation, we value transparency and accountability in how donations are utilized. You can specify how you want your donation to be used, whether it's to support a specific project, initiative, or program. We'll ensure that your donation is allocated according to your preferences and that you receive updates on the impact of your contribution.`
  },
],[
  {
    no: '7',
    expand: false,
    heading: `Does TFF provide regular updates or reports on how donations are utilized?`,
    body: `Yes, we believe in keeping our donors informed and engaged in our work. We provide regular updates and reports on how donations are utilized, including the progress of projects, initiatives supported, and the impact achieved. Our goal is to ensure transparency and accountability in our operations and to show donors the tangible difference their contributions make in the lives of individuals and communities.`
  },
  {
    no: '8',
    expand: false,
    heading: `Can I donate anonymously, if preferred?`,
    body: `Yes, we respect donors' privacy and understand that some may prefer to donate anonymously. If you wish to donate anonymously, simply indicate your preference when making your donation. Rest assured that we will honor your request and ensure that your contribution is acknowledged in a manner that respects your privacy while still expressing our gratitude for your generosity.
`
  },
  {
    no: '9',
    expand: false,
    heading: `What volunteer opportunities are available at Tech First Foundation?`,
    body: `At Tech First Foundation, we offer a wide range of volunteer opportunities to individuals passionate about transforming lives, while getting gaining valuabe experience. As our charity is in its infants stage, you would gain great value from the diverse range of roles and tasks you would undertake. You can volunteer to mentor young talents, assist in setting up computer labs, participate in online teaching programs, or support our professional development initiatives. This can be the opportunity not only to put your knowledge and education to great use, but also to explore different fields in our structure with the additional guidance and support from our expert. We welcome volunteers from diverse backgrounds and skill sets, and we're committed to providing a rewarding and impactful volunteer experience.
`
  },
],[
  {
    no: '10',
    expand: false,
    heading: `What skills or qualifications are required to volunteer with TFF?`,
    body: `While specific skills and qualifications may vary depending on the volunteer role, what matters most to us is your passion for our mission and your willingness to make a difference. Whether you're an IT professional, educator, or community organizer, there's a place for you at Tech First Foundation. We value diversity and believe that everyone has something valuable to contribute to our cause.`
  },
  {
    no: '11',
    expand: false,
    heading: `How can I apply to volunteer with TFF, and what is the process like?`,
    body: `Applying to volunteer with Tech First Foundation is easy and straightforward. You can visit our website and fill in our application form or contact us directly to express your interest in volunteering. Our team will guide you through the application process and help match you with a volunteer opportunity that aligns with your interests and skills. Once you're onboard, you'll receive training and support to ensure a fulfilling volunteer experience.`
  },
  {
    no: '12',
    expand: false,
    heading: `What kind of time commitment is expected from volunteers?`,
    body: `We understand that everyone has different schedules and commitments, which is why we offer flexible volunteer opportunities at Tech First Foundation. Whether you can volunteer for a few hours a week or dedicate more time to our initiatives, your contribution is valuable to us. We appreciate your willingness to volunteer your time and expertise to support our mission of transforming lives through technology and education.
`
  },
],[
  {
    no: '13',
    expand: false,
    heading: `Is there an opportunity for strategic partnership or sponsorship with TFF?`,
    body: `Yes, at Tech First Foundation, we actively seek partnerships with corporate organizations, governmental institutions and fellow chairites to maximize our impact and reach. Collaborating with like-minded partners allows us to leverage resources, expertise, and networks to implement large-scale initiatives that drive positive change. Strategic partnerships allow us to collaborate on long-term initiatives, while sponsorships provide opportunities for organizations to support specific projects or programs aligned with their corporate social responsibility goals. We tailor partnership and sponsorship opportunities to meet the unique needs and objectives of our partners, ensuring mutual benefits and shared impact.
`
  },
  {
    no: '14',
    expand: false,
    heading: `How can my Organizations or Institutions contribute IT equipment or financial support to TFF's initiatives?`,
    body: `Whether your organization has surplus IT equipment to donate or wants to make a financial contribution, we welcome your support. You can reach out to us directly to discuss donation options and partnership opportunities.`
  }
]
];

export { clients, whatWeAre, services, teams, progressList, pricingList, accordions };
