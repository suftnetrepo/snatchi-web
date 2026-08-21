import { FC } from 'react';
import Email from '@/icons/lineal/Email';
import ContactForm from '@/components/common/ContactForm';

const Contact: FC = () => (
  <section className="wrapper bg-light">
    <div className="card bg-soft-primary mb-0">
      <div className="card-body p-8 p-md-12 container">
        <div className="row gx-md-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6">
            <Email />
            <h2 className="display-4 mb-3 pe-lg-10">Need help choosing a plan?</h2>
            <p className="lead pe-lg-12 mb-0">Tell us about your team and project workload. We’ll help you choose the right capacity.</p>
          </div>
          <div className="col-lg-6"><ContactForm compact /></div>
        </div>
      </div>
    </div>
  </section>
);

export default Contact;
