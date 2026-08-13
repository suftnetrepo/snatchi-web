'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MdArrowBack, MdCalendarMonth, MdLocationOn, MdSearch, MdVerified } from 'react-icons/md';
import { Button, Spinner } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMultiUserSearch } from '../../../../hooks/useUser';
import { zat } from '../../../../utils/api';
import { VERBS } from '../../../../config';
import { PROJECT } from '../../../../utils/apiUrl';
import ErrorDialogue from '../../../../src/components/elements/errorDialogue';
import styles from './search.module.scss';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
  : 'Not set';

const Search = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const previousSearchQuery = searchParams.get('searchQuery') || '';
  const [searchQuery, setSearchQuery] = useState(previousSearchQuery);
  const [scope, setScope] = useState('mine');
  const [project, setProject] = useState(null);
  const [page, setPage] = useState(1);
  const { data, error, loading, totalCount, handleSearchUsersByMultipleCriteria, handleReset } = useMultiUserSearch();
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));

  const loadEngineers = useCallback((nextPage = 1, nextScope = scope, query = searchQuery) => {
    setPage(nextPage);
    return handleSearchUsersByMultipleCriteria({
      pageIndex: nextPage,
      pageSize,
      searchQuery: query.trim(),
      scope: nextScope
    });
  }, [handleSearchUsersByMultipleCriteria, scope, searchQuery]);

  useEffect(() => {
    loadEngineers(1, 'mine', previousSearchQuery);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    zat(PROJECT.fetchOne, null, VERBS.GET, { action: 'single', id: projectId })
      .then((response) => response.success && setProject(response.data))
      .catch(() => setProject(null));
  }, [projectId]);

  const changeScope = (nextScope) => {
    setScope(nextScope);
    loadEngineers(1, nextScope, searchQuery);
  };

  const openCalendar = (engineer) => {
    const params = new URLSearchParams({
      projectId: projectId || '',
      engineerId: engineer._id,
      userId: engineer._id,
      first_name: engineer.first_name || '',
      last_name: engineer.last_name || '',
      searchQuery
    });
    router.push(`/protected/integrator/scheduler?${params.toString()}`);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <Button variant="light" className={styles.backButton} onClick={() => router.push('/protected/integrator/project')}>
            <MdArrowBack size={20} /> Back to projects
          </Button>
          <span className={styles.secureLabel}><MdVerified /> Verified engineers</span>
        </div>
        <div className={styles.heroContent}>
          <div>
            <span className={styles.eyebrow}>Engineer booking</span>
            <h1>Find the right engineer</h1>
            <p>Choose from your team first, then check their live booking calendar before making an offer.</p>
          </div>
          {project && (
            <aside className={styles.projectCard}>
              <span>Booking for</span>
              <strong>{project.name}</strong>
              <div><MdLocationOn /> {project.completeAddress || 'Project location not set'}</div>
              <small>{formatDate(project.startDate)} — {formatDate(project.endDate)}</small>
            </aside>
          )}
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Engineer source">
            <button className={scope === 'mine' ? styles.activeTab : ''} onClick={() => changeScope('mine')}>
              My engineers
            </button>
            <button className={scope === 'external' ? styles.activeTab : ''} onClick={() => changeScope('external')}>
              External engineers
            </button>
          </div>
          <form className={styles.searchBox} onSubmit={(event) => { event.preventDefault(); loadEngineers(1); }}>
            <MdSearch size={22} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={scope === 'mine' ? 'Search your team by name or location' : 'Search engineers by name or location'}
              maxLength={60}
              aria-label="Search engineers"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>

        <div className={styles.resultHeading}>
          <div>
            <h2>{scope === 'mine' ? 'Your engineering team' : 'External engineer network'}</h2>
            <p>{scope === 'mine' ? 'Engineers employed by your organisation.' : 'Engineers outside your organisation who can be booked for this job.'}</p>
          </div>
          <span>{totalCount || 0} engineer{totalCount === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className={styles.state}><Spinner animation="border" /><p>Finding engineers…</p></div>
        ) : data?.length ? (
          <div className={styles.grid}>
            {data.map((engineer) => {
              const rates = engineer.serviceRates || [];
              const lowestRate = rates[0];
              return (
                <article className={styles.engineerCard} key={engineer._id}>
                  <div className={styles.cardTop}>
                    <img
                      src={engineer.secure_url || '/img/blank.png'}
                      alt={`${engineer.first_name || ''} ${engineer.last_name || ''}`.trim()}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/img/blank.png';
                      }}
                    />
                    <div>
                      <span className={engineer.isInternal ? styles.internalBadge : styles.externalBadge}>
                        {engineer.isInternal ? 'Your team' : 'External'}
                      </span>
                      <h3>{engineer.first_name} {engineer.last_name}</h3>
                      <p><MdLocationOn /> {engineer.address?.completeAddress || 'Location not provided'}</p>
                    </div>
                  </div>
                  <div className={styles.services}>
                    {rates.length ? rates.slice(0, 3).map((rate) => (
                      <span key={rate._id}>{rate.serviceName}</span>
                    )) : <span className={styles.mutedService}>Services not listed</span>}
                  </div>
                  <div className={styles.cardFooter}>
                    <div>
                      <small>{lowestRate ? 'Rates from' : 'Rate'}</small>
                      <strong>{lowestRate ? `£${Number(lowestRate.rate).toFixed(2)} / ${lowestRate.rateType}` : 'Discuss on booking'}</strong>
                    </div>
                    <Button onClick={() => openCalendar(engineer)}>
                      <MdCalendarMonth size={19} /> View availability
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.state}>
            <div className={styles.emptyIcon}><MdSearch /></div>
            <h3>{scope === 'mine' ? 'No engineers in your team yet' : 'No external engineers found'}</h3>
            <p>{searchQuery ? 'Try another name or location.' : 'Add engineers to your organisation or explore the external network.'}</p>
          </div>
        )}

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Engineer results pages">
            <Button variant="outline-secondary" disabled={page === 1} onClick={() => loadEngineers(page - 1)}>Previous</Button>
            <span>Page <strong>{page}</strong> of {totalPages}</span>
            <Button variant="outline-secondary" disabled={page === totalPages} onClick={() => loadEngineers(page + 1)}>Next</Button>
          </nav>
        )}
      </section>
      {error && <ErrorDialogue message={error} showError={error} onClose={handleReset} />}
    </main>
  );
};

export default Search;
