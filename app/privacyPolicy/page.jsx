import { siteIdentity } from '@/data/site';

export const metadata = { title: 'Privacy Policy', description: 'How Snatchi collects, uses and protects personal information.' };

export default function PrivacyPolicy() {
  return (
    <main className="container my-6 my-md-10">
      <article className="card"><div className="card-body p-6 p-md-10">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated: 21 August 2026</strong></p>
        <p>Snatchi is owned and operated by {siteIdentity.ownerName} and developed by {siteIdentity.developerName}. This policy explains how information is handled across the Snatchi website, web platform and mobile application.</p>

        <h2 className="h4 mt-6">1. Information we collect</h2>
        <ul>
          <li><strong>Account and organisation information:</strong> names, email addresses, telephone numbers, roles, organisation details and authentication information.</li>
          <li><strong>Project and operational information:</strong> projects, bookings, schedules, team assignments, messages, invoices and documents submitted by users.</li>
          <li><strong>Billing information:</strong> subscription, invoice and payment-status information. Card details are processed by Stripe and are not stored directly by Snatchi.</li>
          <li><strong>Device and usage information:</strong> device type, browser, operating system, identifiers, logs and diagnostics used for security and reliability.</li>
          <li><strong>Location information:</strong> where enabled in the mobile app, foreground or background location may be used for assigned site and geofence workflows. Permission can be controlled through device settings.</li>
          <li><strong>Contact enquiries:</strong> information submitted through contact forms or support communications.</li>
        </ul>

        <h2 className="h4 mt-6">2. How we use information</h2>
        <ul>
          <li>Provide and secure accounts, projects, bookings, communication and document workflows.</li>
          <li>Process subscriptions, invoices and payment-related events.</li>
          <li>Send operational notifications and respond to support requests.</li>
          <li>Detect abuse, investigate failures and improve performance and reliability.</li>
          <li>Meet legal, regulatory and contractual obligations.</li>
        </ul>

        <h2 className="h4 mt-6">3. Sharing and service providers</h2>
        <p>Information may be visible to authorised members of your organisation according to their role. We also use service providers that support platform operation, including Stripe for payments, Cloudinary for managed uploads, Firebase for messaging and notifications, and email-delivery providers. They process information only for the services they provide. We do not sell personal information.</p>

        <h2 className="h4 mt-6">4. Retention and security</h2>
        <p>We retain information for as long as needed to operate accounts, meet legal obligations and resolve disputes. We use access controls, tenant scoping, secure authentication and encryption in transit. No online service can guarantee absolute security.</p>

        <h2 className="h4 mt-6">5. Your choices and rights</h2>
        <p>Depending on applicable law, you may request access, correction, deletion, restriction, portability or objection to certain processing. You may withdraw optional location permission through device settings. Some information may be retained where legally required.</p>

        <h2 className="h4 mt-6">6. International processing and children</h2>
        <p>Service providers may process information in other countries subject to appropriate safeguards. Snatchi is intended for business users and is not directed to children.</p>

        <h2 className="h4 mt-6">7. Changes and contact</h2>
        <p>We may update this policy and will publish the revised date. Privacy questions and rights requests can be sent to <a href={`mailto:${siteIdentity.supportEmail}`}>{siteIdentity.supportEmail}</a>.</p>
      </div></article>
    </main>
  );
}
