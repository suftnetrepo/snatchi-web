export const helpGuides = [
  {
    id: 'projects',
    category: 'Projects',
    title: 'Create and manage a project',
    summary: 'Set up a job, maintain its scope and keep the project record accurate.',
    route: '/protected/integrator/project',
    actionLabel: 'Open projects',
    keywords: ['project', 'job', 'scope', 'create', 'status', 'delete'],
    steps: [
      'Open Projects and select Create project.',
      'Enter the customer, job scope, location, priority and delivery dates.',
      'Save the project, then use its actions to add documents or book an engineer.',
      'Keep the project status current as the work moves through delivery.',
      'Delete a project only when its operational and billing records are no longer required.'
    ],
    note: 'A project must exist before an engineer can be booked for the job.'
  },
  {
    id: 'engineers',
    category: 'People',
    title: 'Manage your engineering team',
    summary: 'Add internal engineers and keep their access and profile details current.',
    route: '/protected/integrator/user',
    actionLabel: 'Open users',
    keywords: ['engineer', 'user', 'team', 'employee', 'mobile', 'documents'],
    steps: [
      'Open Users and select Add user.',
      'Choose the Engineer role and enter a unique email address.',
      'Set visibility based on whether the engineer may appear in the external network.',
      'Enable chat access when the engineer needs project conversations.',
      'Review uploaded engineer documents from the user record; most uploads originate in the mobile app.'
    ],
    note: 'Disabling a user preserves historical project and booking records.'
  },
  {
    id: 'engineer-booking',
    category: 'Scheduling',
    title: 'Book an engineer for a job',
    summary: 'Find the right engineer, check availability and make a clear offer.',
    route: '/protected/integrator/project',
    actionLabel: 'Choose a project',
    keywords: ['book', 'engineer', 'availability', 'offer', 'schedule', 'team'],
    steps: [
      'Open Projects and select Book engineer on the required job.',
      'Start with My engineers, or switch to External engineers when additional capacity is needed.',
      'Search by engineer name or location and review their services and rate information.',
      'Select View availability and choose an available date and time.',
      'Confirm the title, rate, offer and job description before creating the booking.'
    ],
    note: 'The scheduler prevents overlapping bookings for the same engineer.'
  },
  {
    id: 'multi-day-booking',
    category: 'Scheduling',
    title: 'Create a multi-day booking',
    summary: 'Schedule consecutive working days at the same time without repeating the form.',
    route: '/protected/integrator/project',
    actionLabel: 'Choose a project',
    keywords: ['multi-day', 'multiple', 'days', 'monday', 'friday', 'booking'],
    steps: [
      'Open the selected engineer’s availability from the project booking flow.',
      'Choose the first and last booking date.',
      'Set the daily start and end time and review the generated working days.',
      'Submit once; Snatchi creates linked daily schedule records.',
      'Review or remove individual days from the scheduler when plans change.'
    ],
    note: 'Each day remains an individual schedule entry so conflicts and cancellations stay accurate.'
  },
  {
    id: 'booking-statuses',
    category: 'Scheduling',
    title: 'Understand booking statuses',
    summary: 'Know which party needs to act as a booking moves toward delivery.',
    route: '/protected/integrator/scheduler/list',
    actionLabel: 'Open booking list',
    keywords: ['pending', 'accepted', 'payment', 'ready', 'cancel', 'status'],
    steps: [
      'Pending means the booking offer has been created and awaits a response.',
      'Accepted means the engineer has agreed and the integrator can complete the next required action.',
      'Awaiting payment applies to eligible external-engineer bookings.',
      'Ready to start confirms the booking has passed its required approval and payment checks.',
      'Cancelled and Declined are terminal outcomes and remain available for audit history.'
    ],
    note: 'Schedule records are the source of truth for booking status changes.'
  },
  {
    id: 'invoices',
    category: 'Billing',
    title: 'Review and export invoices',
    summary: 'Find billing records, update their outcome and download reporting files.',
    route: '/protected/integrator/invoice',
    actionLabel: 'Open invoices',
    keywords: ['invoice', 'paid', 'unpaid', 'pdf', 'csv', 'date', 'billing'],
    steps: [
      'Use search or the date range to narrow the invoice register.',
      'Open an invoice to review its engineer, dates, line items, tax and total.',
      'Update the invoice status only when its billing outcome changes.',
      'Download an individual invoice as PDF or CSV from its detail view.',
      'Export the filtered invoice register as CSV for reporting.'
    ],
    note: 'Invoice status changes do not replace the scheduler’s operational booking status.'
  },
  {
    id: 'documents',
    category: 'Documents',
    title: 'Work with project and engineer documents',
    summary: 'Keep supporting files attached to the correct project or person.',
    route: '/protected/integrator/project',
    actionLabel: 'Open projects',
    keywords: ['document', 'upload', 'photo', 'file', 'mobile', 'delete'],
    steps: [
      'Open the relevant project or user record and select its document action.',
      'Review the document name, type and uploader before opening a file.',
      'Project documents may contain photos and other job-related file formats.',
      'Engineer documents are mainly uploaded from the mobile application.',
      'Delete only the selected document; the underlying project or user remains unchanged.'
    ],
    note: 'A missing or inaccessible file should not prevent the remaining document register from loading.'
  },
  {
    id: 'chat',
    category: 'Communication',
    title: 'Use direct and group chat',
    summary: 'Keep project communication visible to the right participants.',
    route: '/protected/integrator/chat',
    actionLabel: 'Open chat',
    keywords: ['chat', 'message', 'direct', 'group', 'booking', 'conversation'],
    steps: [
      'Use Direct and Groups to switch between conversation types.',
      'Search conversations by their participant or group name.',
      'Select New chat for a one-to-one conversation with an enabled team member.',
      'Select New group to create a shared room, then add the required participants.',
      'Booking conversations are provisioned for eligible engineer bookings.'
    ],
    note: 'Only users with chat access and Firebase provisioning can participate.'
  },
  {
    id: 'settings',
    category: 'Account',
    title: 'Manage subscription and payouts',
    summary: 'Maintain organisation settings, Stripe billing and Connect payouts.',
    route: '/protected/integrator/settings',
    actionLabel: 'Open settings',
    keywords: ['settings', 'subscription', 'stripe', 'payout', 'profile', 'password'],
    steps: [
      'Use Profile to keep organisation contact details accurate.',
      'Use Subscription to review the current plan and open the secure Stripe billing portal.',
      'Use Receive payments when your engineers may be booked by other organisations.',
      'Complete all requested Stripe verification checks before receiving payouts.',
      'Use Password to update the password for the signed-in account.'
    ],
    note: 'Stripe Connect is recommended for external bookings but is not required when using only your own engineers.'
  }
];

export const guideById = (id) => helpGuides.find((guide) => guide.id === id);

export const HELP_CONTEXT_EVENT = 'snatchi:help-context';

export const setPageHelpContext = (guideId) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HELP_CONTEXT_EVENT, { detail: { guideId } }));
  }
};

const context = (primary, related = [], label = 'Help for this page') => ({ primary, related, label });

export const resolveHelpContext = (pathname, search = '') => {
  const params = new URLSearchParams(search);

  if (pathname === '/protected/integrator/project/create' || /\/protected\/integrator\/project\/[^/]+\/edit$/.test(pathname)) {
    return context('projects', ['documents'], 'Creating and editing projects');
  }
  if (pathname === '/protected/integrator/project') {
    return context('projects', ['engineer-booking', 'documents'], 'Project workflows');
  }
  if (pathname === '/protected/integrator/search-engineers') {
    return context('engineer-booking', ['multi-day-booking', 'booking-statuses'], 'Finding an engineer');
  }
  if (pathname === '/protected/integrator/scheduler/list') {
    return context('booking-statuses', ['engineer-booking', 'invoices'], 'Managing bookings');
  }
  if (pathname === '/protected/integrator/scheduler') {
    const hasBookingContext = params.has('projectId') || params.has('engineerId');
    return hasBookingContext
      ? context('engineer-booking', ['multi-day-booking', 'booking-statuses'], 'Creating a booking')
      : context('booking-statuses', ['engineer-booking', 'multi-day-booking'], 'Using the scheduler');
  }
  if (pathname === '/protected/integrator/user') {
    return context('engineers', ['documents', 'chat'], 'Team management');
  }
  if (pathname === '/protected/integrator/invoice') {
    return context('invoices', ['booking-statuses'], 'Invoice workflow');
  }
  if (pathname === '/protected/integrator/chat') {
    return context('chat', ['engineer-booking'], 'Conversations');
  }
  if (pathname === '/protected/integrator/settings') {
    const section = params.get('section');
    const labels = { profile: 'Organisation profile', subscription: 'Subscription billing', payments: 'Receiving payments', security: 'Account security' };
    return context('settings', section === 'payments' ? ['invoices'] : [], labels[section] || 'Account settings');
  }
  return null;
};
