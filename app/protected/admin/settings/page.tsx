import { FiActivity, FiDatabase, FiLock, FiMail } from 'react-icons/fi';
import { siteIdentity } from '@/data/site';
import styles from './settings.module.css';

const checks = [
  { title: 'Authentication', detail: 'Admin role enforcement is active for pages and APIs.', icon: FiLock, status: 'Protected' },
  { title: 'Database', detail: 'MongoDB connection is configured through the deployment environment.', icon: FiDatabase, status: 'Configured' },
  { title: 'Transactional email', detail: `Operational messages use ${siteIdentity.email}.`, icon: FiMail, status: 'Configured' },
  { title: 'Error monitoring', detail: 'Sentry monitoring is included in production builds.', icon: FiActivity, status: 'Enabled' }
];

export default function Settings() {
  return (
    <div className={styles.page}>
      <header>
        <p>Platform configuration</p>
        <h1>Operations settings</h1>
        <span>Review production integrations and the public identity used by Snatchi.</span>
      </header>

      <section className={styles.grid}>
        {checks.map(({ title, detail, icon: Icon, status }) => (
          <article key={title}>
            <div className={styles.icon}><Icon aria-hidden="true" /></div>
            <div><h2>{title}</h2><p>{detail}</p></div>
            <span className={styles.status}>{status}</span>
          </article>
        ))}
      </section>

      <section className={styles.identity}>
        <div><p>Public identity</p><h2>{siteIdentity.productName}</h2></div>
        <dl>
          <div><dt>Owner</dt><dd>{siteIdentity.ownerName}</dd></div>
          <div><dt>Developer</dt><dd>{siteIdentity.developerName}</dd></div>
          <div><dt>Support email</dt><dd><a href={`mailto:${siteIdentity.supportEmail}`}>{siteIdentity.supportEmail}</a></dd></div>
          <div><dt>Telephone</dt><dd><a href={siteIdentity.phoneHref}>{siteIdentity.phoneDisplay}</a></dd></div>
        </dl>
      </section>
    </div>
  );
}
