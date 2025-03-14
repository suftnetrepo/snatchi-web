import { FC } from 'react';
import Accordion from '@/components/reuseable/accordion';

const FAQ: FC = () => {
   const accordions = [
     {
       no: '1',
       expand: false,
       heading: 'Can I cancel my subscription?',
       body: 'Yes, you can cancel your subscription at any time through your account settings. Once canceled, your subscription will remain active until the end of your billing cycle. If you encounter any issues, our support team is ready to assist.'
     },
     {
       no: '2',
       expand: false,
       heading: 'Which payment methods do you accept?',
       body: 'We accept major credit and debit cards, including Visa, MasterCard, and American Express, powered by Stripe. Stripe ensures secure and seamless payment processing. For more details, please visit our payment page.'
     },
     {
       no: '3',
       expand: false,
       heading: 'How can I manage my Account?',
       body: 'You can manage your account settings by logging into the platform and navigating to the “Account” section. Here, you can update your profile, change your subscription plan, review your billing history, and access support. If you need further assistance, feel free to contact our support team.'
     },
     {
       no: '4',
       expand: false,
       heading: 'Is my credit card information secure?',
       body: `Yes, your credit card information is highly secure. We use Stripe, a PCI DSS-compliant payment platform, ensuring all payment data is encrypted and handled with the highest level of security. Your details are never stored on our servers and are processed directly through Stripe's secure gateway.`
     }
   ];
 
  return (
    <div className="container pt-15 pt-md-17 pb-13 pb-md-15">
      <h2 className="fs-15 text-uppercase text-muted mb-3 text-center">FAQ</h2>
      <h3 className="display-4 mb-10 px-lg-12 px-xl-15 text-center">
        If you don't see an answer to your question, you can send us an email from our contact form.
      </h3>

      <div className="accordion-wrapper" id="accordion">
        <div className="row justify-content-center">
          <div className="col-md-8">
            {accordions.map((item) => (
              <Accordion key={item.no} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
