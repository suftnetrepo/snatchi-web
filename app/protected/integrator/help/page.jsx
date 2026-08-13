'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight, FaBookOpen, FaCheck, FaSearch } from 'react-icons/fa';
import { guideById, helpGuides } from './guides';
import styles from './help.module.scss';

const HelpCentre = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const categories = useMemo(() => ['All', ...new Set(helpGuides.map((guide) => guide.category))], []);

  useEffect(() => {
    const guideId = new URLSearchParams(window.location.search).get('guide');
    if (guideId) setSelectedGuide(guideById(guideId) || null);
  }, []);

  const filteredGuides = useMemo(() => {
    const term = search.trim().toLowerCase();
    return helpGuides.filter((guide) => {
      const categoryMatches = category === 'All' || guide.category === category;
      const haystack = [guide.title, guide.summary, guide.category, ...guide.keywords].join(' ').toLowerCase();
      return categoryMatches && (!term || haystack.includes(term));
    });
  }, [category, search]);

  const openGuide = (guide) => {
    setSelectedGuide(guide);
    window.history.replaceState(null, '', `/protected/integrator/help?guide=${guide.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeGuide = () => {
    setSelectedGuide(null);
    window.history.replaceState(null, '', '/protected/integrator/help');
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>Snatchi support</span>
        <h1>Help &amp; Guides</h1>
        <p>Clear, practical guidance for the workflows you use every day.</p>
        <label className={styles.searchBox}>
          <FaSearch />
          <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedGuide(null); }} placeholder="Search projects, bookings, invoices, chat…" aria-label="Search help guides" />
        </label>
      </section>

      {selectedGuide ? (
        <article className={styles.guideDetail}>
          <button type="button" className={styles.backButton} onClick={closeGuide}><FaArrowLeft /> All guides</button>
          <div className={styles.detailHeading}>
            <div><span>{selectedGuide.category}</span><h2>{selectedGuide.title}</h2><p>{selectedGuide.summary}</p></div>
            <Link href={selectedGuide.route}>{selectedGuide.actionLabel} <FaArrowRight /></Link>
          </div>
          <ol className={styles.steps}>
            {selectedGuide.steps.map((step, index) => (
              <li key={step}><span>{index + 1}</span><div><FaCheck /><p>{step}</p></div></li>
            ))}
          </ol>
          <div className={styles.note}><strong>Good to know</strong><p>{selectedGuide.note}</p></div>
        </article>
      ) : (
        <section className={styles.library}>
          <div className={styles.libraryHeader}>
            <div><h2>Browse workflow guides</h2><p>{filteredGuides.length} guide{filteredGuides.length === 1 ? '' : 's'} available</p></div>
            <div className={styles.categories} role="group" aria-label="Guide categories">
              {categories.map((item) => <button type="button" key={item} className={category === item ? styles.active : ''} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          </div>
          {filteredGuides.length > 0 ? (
            <div className={styles.grid}>
              {filteredGuides.map((guide) => (
                <button type="button" className={styles.card} key={guide.id} onClick={() => openGuide(guide)}>
                  <span className={styles.cardIcon}><FaBookOpen /></span>
                  <small>{guide.category}</small>
                  <h3>{guide.title}</h3>
                  <p>{guide.summary}</p>
                  <span className={styles.readLink}>Read guide <FaArrowRight /></span>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.empty}><FaSearch /><h3>No matching guides</h3><p>Try a broader search or select All categories.</p><button type="button" onClick={() => { setSearch(''); setCategory('All'); }}>Clear search</button></div>
          )}
        </section>
      )}
    </main>
  );
};

export default HelpCentre;
