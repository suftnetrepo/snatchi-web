'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FaArrowRight, FaBookOpen, FaCheck, FaTimes } from 'react-icons/fa';
import { HELP_CONTEXT_EVENT, guideById, resolveHelpContext } from './guides';
import styles from './contextualHelp.module.scss';

const ContextualHelp = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [dynamicGuideId, setDynamicGuideId] = useState(null);
  const search = searchParams.toString();
  const pageContext = resolveHelpContext(pathname, search);
  const guideIds = [dynamicGuideId || pageContext?.primary, ...(pageContext?.related || [])]
    .filter((id, index, list) => id && list.indexOf(id) === index);
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const guide = guideById(selectedGuideId || guideIds[0]);

  useEffect(() => {
    setOpen(false);
    setDynamicGuideId(null);
    setSelectedGuideId(null);
  }, [pathname, search]);

  useEffect(() => {
    const updateContext = (event) => {
      const guideId = event.detail?.guideId || null;
      setDynamicGuideId(guideId);
      setSelectedGuideId(guideId);
    };
    window.addEventListener(HELP_CONTEXT_EVENT, updateContext);
    return () => {
      window.removeEventListener(HELP_CONTEXT_EVENT, updateContext);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!guide || pathname === '/protected/integrator/help') return null;

  return (
    <>
      <button type="button" className={styles.helpButton} onClick={() => setOpen(true)} aria-label={`Help with ${guide.title}`}>
        <FaBookOpen /> <span>Help</span>
      </button>
      {open && (
        <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="context-help-title">
            <header>
              <div><span>{guide.category}</span><h2 id="context-help-title">{guide.title}</h2><p>{guide.summary}</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close help"><FaTimes /></button>
            </header>
            <div className={styles.body}>
              {guideIds.length > 1 && (
                <nav className={styles.related} aria-label="Help topics for this page">
                  <span>{pageContext?.label || 'Help for this page'}</span>
                  <div>{guideIds.map((id) => {
                    const item = guideById(id);
                    return item ? <button type="button" key={id} className={guide.id === id ? styles.activeTopic : ''} onClick={() => setSelectedGuideId(id)}>{item.title}</button> : null;
                  })}</div>
                </nav>
              )}
              <ol>
                {guide.steps.map((step) => <li key={step}><span><FaCheck /></span><p>{step}</p></li>)}
              </ol>
              <div className={styles.note}><strong>Good to know</strong><p>{guide.note}</p></div>
            </div>
            <footer>
              <Link href={`/protected/integrator/help?guide=${guide.id}`}>Read the full guide <FaArrowRight /></Link>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
};

export default ContextualHelp;
