'use client';

import React from 'react';
import { Container, Card } from 'react-bootstrap';

const PrivacyPolicy = () => (
  <Container>
    <Card className="p-10 m-10">
      <Card.Body>
        <Card.Title>Privacy Policy</Card.Title>
        <Card.Text>
          At <strong>Snatchi</strong>, we are committed to protecting your privacy and ensuring that your personal
          information is handled responsibly and securely. This Privacy Policy explains how we collect, use, and protect
          your information when you use our mobile application.
        </Card.Text>

        <h5>1. Information We Collect</h5>
        <p>When you use Snatchi, we collect the following types of information to provide essential app functionality:</p>

        <ul>
          <li>
            <strong>User Profile Information:</strong> Your first name, last name, email address, mobile number, and
            account details needed to identify you within your assigned projects.
          </li>

          <li>
            <strong>Location Data (Foreground & Background):</strong>  
            Snatchi uses your device’s location to detect when you <strong>enter or exit assigned geofenced project sites</strong>.
            This enables automated attendance tracking, safety confirmation, and project monitoring.  
            <br /><br />
            Location data is collected even when the app is closed or not in active use. A permanent foreground
            notification ("Geofencing Active") appears while geofencing is enabled, as required by Android.
          </li>

          <li>
            <strong>Device Information:</strong> Device model, operating system version, unique device identifiers, and
            performance diagnostics to improve app stability.
          </li>

          <li>
            <strong>Notifications & Messaging Data:</strong> We receive certain metadata from push notifications, such as
            message IDs and the action that triggered the notification (e.g., opening a project update).
          </li>
        </ul>

        <h5>2. How We Use Your Information</h5>
        <p>Your information is used only for the operation of the Snatchi platform, including:</p>
        <ul>
          <li>Detecting geofence entry/exit events for work attendance and job tracking.</li>
          <li>Sending job-related updates, push notifications, reminders, and project assignments.</li>
          <li>Improving app performance, accuracy, and reliability.</li>
          <li>Ensuring compliance with workplace requirements and safety checks.</li>
        </ul>

        <h5>3. How We Share Your Information</h5>
        <p>Your information is shared only when necessary to support project workflow:</p>
        <ul>
          <li>
            <strong>Integrators / Project Managers:</strong> Can view job progress, assigned user details, and
            geofence entry/exit events for scheduling and project coordination.
          </li>
          <li>
            <strong>Service Providers:</strong> Third-party tools such as Google Firebase Cloud Messaging (FCM)
            are used to deliver push notifications and secure communication.
          </li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h5>4. Data Security</h5>
        <p>
          We use industry-standard safeguards to protect your data, including encryption in transit (TLS), secure
          authentication, access control, and strict backend security practices. Only authorized personnel can access
          your data as required for operational purposes.
        </p>

        <h5>5. Your Rights</h5>
        <p>You have the right to:</p>
        <ul>
          <li>Access your information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your account or personal data</li>
          <li>Withdraw consent where applicable</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:support@snatchi.com">support@snatchi.com</a>.
        </p>

        <h5>6. Background Location Disclosure</h5>
        <p>
          Snatchi requires background location access <strong>solely to detect geofence entry and exit events for assigned
          work sites</strong>. Without this permission, essential app features such as automated attendance, job tracking,
          and safety confirmation will not function.
        </p>

        <h5>7. Changes to This Policy</h5>
        <p>
          We may update this Privacy Policy periodically. If significant changes are made, you will be notified
          through the app or via email.
        </p>

        <p>
          For any privacy-related concerns or questions, please contact us at{" "}
          <a href="mailto:support@snatchi.com">support@snatchi.com</a>.
        </p>
      </Card.Body>
    </Card>
  </Container>
);

export default PrivacyPolicy;
