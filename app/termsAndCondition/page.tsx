import type { Metadata } from 'next';
import { siteIdentity } from '@/data/site';

export const metadata: Metadata = { title: 'Terms and Conditions', description: 'Terms governing use of the Snatchi platform and subscriptions.' };

export default function TermsAndConditions() {
  return (
    <main className="container my-6 my-md-10">
      <article className="card"><div className="card-body p-6 p-md-10">
        <h1>Terms and Conditions</h1>
        <p><strong>Last updated: 21 August 2026</strong></p>
        <p>
          These terms govern access to Snatchi, a software platform owned and operated by {siteIdentity.ownerName} and
          developed by {siteIdentity.developerName}. By creating an account, purchasing a subscription or using Snatchi,
          you agree to these terms.
        </p>

        <h2 className="h4 mt-6">1. Accounts and organisation access</h2>
        <p>You must provide accurate information, protect your login credentials and ensure that members you invite are authorised to access your organisation’s data. You are responsible for activity performed through your organisation account.</p>

        <h2 className="h4 mt-6">2. Subscriptions and renewal</h2>
        <p>Snatchi subscriptions renew according to the billing period shown at checkout: monthly, every six months or yearly. The applicable price, billing period and plan limits are shown before payment. Unless cancelled, Stripe will charge the saved payment method at the beginning of each renewal period.</p>
        <p>You can manage payment details or cancel through the Stripe billing portal in your account settings. Cancellation takes effect at the end of the paid billing period unless otherwise stated. Fees are non-refundable except where required by law.</p>

        <h2 className="h4 mt-6">3. Plan limits and reasonable use</h2>
        <p>Plans include limits for active projects, active organisation members, document uploads per billing period and file size. When a limit is reached, you may need to archive work, deactivate members, wait for the next billing period or upgrade. Existing data is not automatically deleted because a limit is exceeded.</p>
        <p>Snatchi must not be used primarily as a general-purpose file-storage service. Automated bulk uploads, malware, unlawful content, abusive traffic and attempts to bypass plan or security controls are prohibited.</p>

        <h2 className="h4 mt-6">4. Payment failure and access</h2>
        <p>If payment is incomplete, overdue or unsuccessful, access may be restricted while billing remains available. We may suspend access for non-payment, misuse, security risks or material breach of these terms.</p>

        <h2 className="h4 mt-6">5. Customer data and acceptable use</h2>
        <p>You retain responsibility for information uploaded to Snatchi and confirm you have the right to process and share it. You must not use the platform for illegal, fraudulent, harmful or misleading activity; interfere with other users; probe security controls; or upload content that infringes another person’s rights.</p>

        <h2 className="h4 mt-6">6. Service availability</h2>
        <p>We work to keep Snatchi available and secure, but uninterrupted operation is not guaranteed. Features may change as the product develops. Material changes that affect paid use will be communicated where reasonably possible.</p>

        <h2 className="h4 mt-6">7. Intellectual property</h2>
        <p>Snatchi’s software, interface, branding and original content are owned by or licensed to {siteIdentity.ownerName}. No ownership rights are transferred through a subscription.</p>

        <h2 className="h4 mt-6">8. Liability</h2>
        <p>To the extent permitted by law, Snatchi is provided without warranties beyond those that cannot legally be excluded. {siteIdentity.ownerName} is not responsible for indirect or consequential losses arising from use of the service. Nothing in these terms excludes liability that cannot be excluded under applicable law.</p>

        <h2 className="h4 mt-6">9. Changes and contact</h2>
        <p>We may update these terms and will publish the revised date. Material changes may also be communicated through the platform or email. Questions can be sent to <a href={`mailto:${siteIdentity.supportEmail}`}>{siteIdentity.supportEmail}</a>.</p>
      </div></article>
    </main>
  );
}
