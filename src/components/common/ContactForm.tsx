'use client';

import { FormEvent, useState } from 'react';

export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStatus({ type: 'sending' });
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send message');
      form.reset();
      setStatus({ type: 'success', message: 'Thank you. Your message has been sent.' });
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Unable to send message' });
    }
  };

  return (
    <form className="contact-form" onSubmit={submit}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }} />
      <div className="row gx-4">
        <div className={compact ? 'col-md-6' : 'col-md-6'}><div className="form-floating mb-4">
          <input required maxLength={80} type="text" name="firstName" id={compact ? 'home_first_name' : 'form_first_name'} placeholder="Jane" className="form-control" />
          <label htmlFor={compact ? 'home_first_name' : 'form_first_name'}>First name *</label>
        </div></div>
        {!compact && <div className="col-md-6"><div className="form-floating mb-4">
          <input maxLength={80} type="text" name="lastName" id="form_last_name" placeholder="Doe" className="form-control" />
          <label htmlFor="form_last_name">Last name</label>
        </div></div>}
        <div className="col-md-6"><div className="form-floating mb-4">
          <input required maxLength={160} type="email" name="email" id={compact ? 'home_email' : 'form_email'} className="form-control" placeholder="jane.doe@example.com" />
          <label htmlFor={compact ? 'home_email' : 'form_email'}>Email *</label>
        </div></div>
        {!compact && <div className="col-md-6"><div className="form-select-wrapper mb-4">
          <select className="form-select" name="department" defaultValue="Sales">
            <option value="Sales">Sales</option><option value="Billing">Billing</option><option value="Customer Support">Customer support</option><option value="Privacy">Privacy request</option>
          </select>
        </div></div>}
        <div className="col-12"><div className="form-floating mb-4">
          <textarea required minLength={10} maxLength={3000} name="message" id={compact ? 'home_message' : 'form_message'} className="form-control" placeholder="How can we help?" style={{ height: 150 }} />
          <label htmlFor={compact ? 'home_message' : 'form_message'}>Message *</label>
        </div></div>
        <div className="col-12 text-center">
          <button type="submit" disabled={status.type === 'sending'} className="btn text-white bg__purple rounded-pill btn-send mb-3">
            {status.type === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          <p aria-live="polite" className={status.type === 'error' ? 'text-danger' : status.type === 'success' ? 'text-success' : 'text-muted'}>
            {status.message || 'We normally respond during business hours.'}
          </p>
        </div>
      </div>
    </form>
  );
}
