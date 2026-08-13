import React, { useEffect, useMemo, useState } from 'react';
import { Offcanvas, Alert, Spinner } from 'react-bootstrap';
import { useUser } from '../../../../hooks/useUser';
import { MdClose, MdSearch, MdChatBubbleOutline } from 'react-icons/md';
import styles from './chat.module.scss';

const RenderUserOffcanvas = ({
  show,
  handleClose,
  currentUserChatId,
  currentUserId,
  error,
  firstname,
  handleCreateDirectChat
}) => {
  const { data, loading, handleFetchUser } = useUser();
  const [query, setQuery] = useState('');
  const [startingUserId, setStartingUserId] = useState(null);

  useEffect(() => {
    if (show) handleFetchUser();
  }, [show]);

  const users = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (Array.isArray(data) ? data : [])
      .filter((user) => user._id !== currentUserId)
      .filter((user) => !term || `${user.first_name || ''} ${user.last_name || ''} ${user.email || ''}`.toLowerCase().includes(term));
  }, [currentUserId, data, query]);

  const startChat = async (user) => {
    setStartingUserId(user._id);
    try {
      await handleCreateDirectChat(currentUserChatId, user.email, `${user.first_name}-${firstname}`);
      handleClose();
    } finally {
      setStartingUserId(null);
    }
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end" className={styles.userDrawer}>
      <div className={styles.drawerHeader}>
        <div>
          <span className={styles.eyebrow}>New conversation</span>
          <h2>Chat with your team</h2>
          <p>Choose a colleague to start or continue a private conversation.</p>
        </div>
        <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Close"><MdClose /></button>
      </div>
      <Offcanvas.Body>
        {error && (
          <div className="row">
            <div className="col-md-12">
              <Alert variant={'danger'}>{error}</Alert>
            </div>
          </div>
        )}
        <div className={styles.userSearch}>
          <MdSearch />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" aria-label="Search team members" />
        </div>
        <div className={styles.drawerSectionLabel}><span>Team members</span><span>{users.length}</span></div>
        <div className={styles.userList}>
          {loading && <div className={styles.loadingUsers}><Spinner size="sm" /><span>Loading team members…</span></div>}
          {users.map((user) => (
            <button key={user._id} type="button" className={styles.userCard} onClick={() => startChat(user)} disabled={!!startingUserId}>
              <img src={user.secure_url || '/img/blank.png'} alt="" onError={(e) => { e.currentTarget.src = '/img/blank.png'; }} />
              <span className={styles.userInfo}>
                <strong>{user.first_name} {user.last_name}</strong>
                <small>{user.email || 'Team member'}</small>
                <em>{user.role}</em>
              </span>
              <span className={styles.userAction}>
                {startingUserId === user._id ? <Spinner size="sm" /> : <><MdChatBubbleOutline /> Chat</>}
              </span>
            </button>
          ))}
          {!loading && users.length === 0 && (
            <div className={styles.noUsers}>
              <MdChatBubbleOutline />
              <strong>{query ? 'No matching team members' : 'No team members available'}</strong>
              <span>{query ? 'Try a different name or email.' : 'Add engineers to your organisation before starting a team chat.'}</span>
            </div>
          )}
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export { RenderUserOffcanvas };
