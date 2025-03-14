'use client';

import React from 'react';
import { Container, Card } from 'react-bootstrap';

const TermsAndConditions = () => (
  <Container className="my-4">
    <Card>
      <Card.Body>
        <Card.Title>Terms and Conditions</Card.Title>
        <Card.Text>
          Welcome to PlasmPro. By accessing or using our app, you agree to comply with these Terms and Conditions.
          Please read them carefully.
        </Card.Text>
        <h5>1. User Accounts</h5>
        <p>
          To access the PlasmPro app, you must create an account and subscribe to our services. You are responsible for
          maintaining the security of your account and for any activity under your login credentials.
        </p>
        <h5>2. Subscription Terms</h5>
        <p>
          PlasmPro operates on a subscription-based model. Fees are payable monthly or annually as per the selected
          plan. Non-payment may result in restricted access or termination of services. Subscription fees are
          non-refundable except where required by law.
        </p>
        <h5>3. Acceptable Use</h5>
        <p>Users must not engage in any activities that could harm the platform or other users, including:</p>
        <ul>
          <li>Posting false or misleading job information.</li>
          <li>Misusing the chat or review systems.</li>
          <li>Engaging in fraudulent, malicious, or illegal activities on the platform.</li>
        </ul>
        <h5>4. Limitation of Liability</h5>
        <p>
          PlasmPro is not liable for any damages or losses arising from your use of the app, including delays, missed
          opportunities, or disputes between users.
        </p>
        <h5>5. Intellectual Property</h5>
        <p>
          All content and software on the app are the intellectual property of PlasmPro. Users are prohibited from
          reproducing, distributing, or modifying any part of the platform without explicit permission.
        </p>
        <h5>6. Changes to Terms</h5>
        <p>
          PlasmPro reserves the right to modify these Terms and Conditions at any time. Users will be notified of
          significant changes, and continued use of the app constitutes acceptance of the updated terms.
        </p>
        <p>For questions or further clarification, contact us at support@plasmpro.com.</p>
      </Card.Body>
    </Card>
  </Container>
);

export default TermsAndConditions;
