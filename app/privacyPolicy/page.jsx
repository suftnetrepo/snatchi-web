'use client'; 

import React from 'react';
import { Container, Card } from 'react-bootstrap';

const PrivacyPolicy = () => (
  <Container>
    <Card className='p-10 m-10'>
      <Card.Body>
        <Card.Title>Privacy Policy</Card.Title>
        <Card.Text>
          At PlasmPro, we are committed to safeguarding your privacy and ensuring that your personal information is
          handled securely. This Privacy Policy outlines how we collect, use, and protect your information when you use
          our app.
        </Card.Text>
        <h5>1. Information We Collect</h5>
        <p>When you use PlasmPro, we collect the following types of information:</p>
        <ul>
          <li>
            <strong>User Profile Information:</strong> We collect and update your profile with your first name, last name, email, and mobile number.
          </li>
          <li>
            <strong>App Usage Information:</strong> Data related to your interactions within the app, including booking
            history, chat messages, and preferences.
          </li>
          <li>
            <strong>Location Data:</strong> We collect your location via push notifications and store it in our Firebase
            database to provide real-time tracking and service efficiency.
          </li>
        </ul>
        <h5>2. How We Use Your Information</h5>
        <p>
          We use the collected information to enhance your experience on the platform, including but not limited to:
        </p>
        <ul>
          <li>Facilitating bookings and communication between users.</li>
          <li>Managing subscriptions and account settings.</li>
          <li>Sending notifications about bookings, job updates, and app features.</li>
          <li>Ensuring compliance with our terms and conditions and applicable laws.</li>
          <li>Using location data for tracking and optimizing service operations.</li>
        </ul>
        <h5>3. Sharing of Information</h5>
        <p>Your information is shared only when necessary to provide the services you request. This includes:</p>
        <ul>
          <li>
            <strong>Integrators:</strong> Can access job progress and assigned user details to facilitate assignments.
          </li>
          <li>
            <strong>Project Managers:</strong> Can access job details within the scope allowed by integrators.
          </li>
        </ul>
        <h5>4. Data Security</h5>
        <p>
          We prioritize the security of your information and implement industry-standard measures, including encryption
          and regular software updates, to protect against unauthorized access, loss, or misuse.
        </p>
        <h5>5. Your Rights</h5>
        <p>
          You have the right to access, modify, or delete your personal data. To exercise these rights, please contact
          our support team at <a href="mailto:support@plasmpro.com">support@plasmpro.com</a>.
        </p>
        <h5>6. Changes to This Policy</h5>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or for legal and
          regulatory compliance. We will notify users of significant updates through the app.
        </p>
        <p>For more information or to raise any concerns, please contact us at <a href="mailto:support@plasmpro.com">support@plasmpro.com</a>.</p>
      </Card.Body>
    </Card>
  </Container>
);

export default PrivacyPolicy;
