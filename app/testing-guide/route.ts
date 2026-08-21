const GUIDE_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Snatchi — Tester Guide</title>
  <style>
    :root { --ink:#1d1b35; --muted:#66637a; --paper:#f7f6fc; --card:#fff; --line:#dedcea; --indigo:#4f46a5; --lavender:#c8c4ff; --blue:#4338ca; --amber:#9b5c08; --red:#a3342c; --shadow:0 18px 55px rgba(29,27,53,.09); }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; color:var(--ink); background:var(--paper); font:16px/1.65 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    a { color:inherit; }
    .hero { padding:64px 24px 52px; color:white; background:radial-gradient(circle at 86% 12%,rgba(200,196,255,.25),transparent 28%),#242057; }
    .wrap { width:min(1100px,100%); margin:auto; }
    .eyebrow,.tag { font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    .eyebrow { color:var(--lavender); }
    h1 { max-width:820px; margin:12px 0 18px; font-size:clamp(2.5rem,7vw,5.25rem); line-height:.96; letter-spacing:-.055em; }
    .lead { max-width:760px; margin:0; color:#d5dfd8; font-size:1.12rem; }
    .meta { display:flex; flex-wrap:wrap; gap:10px; margin-top:30px; }
    .pill { padding:7px 12px; border:1px solid rgba(255,255,255,.22); border-radius:999px; color:#edf2ee; font-size:13px; }
    nav { position:sticky; top:0; z-index:5; overflow:auto; border-bottom:1px solid var(--line); background:rgba(247,246,252,.94); backdrop-filter:blur(12px); }
    nav .wrap { display:flex; gap:7px; padding:10px 24px; }
    nav a { flex:none; padding:7px 11px; border-radius:8px; text-decoration:none; font-weight:700; font-size:13px; }
    nav a:hover,nav a:focus { color:#37308b; background:#e8e6fb; outline:none; }
    main { padding:50px 24px 80px; }
    section { scroll-margin-top:78px; margin-bottom:70px; }
    h2 { margin:5px 0 12px; font-size:clamp(1.8rem,4vw,2.65rem); line-height:1.1; letter-spacing:-.035em; }
    h3 { margin:32px 0 7px; font-size:1.15rem; }
    .intro { max-width:760px; color:var(--muted); }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; margin-top:24px; }
    .card { padding:22px; border:1px solid var(--line); border-radius:16px; background:var(--card); box-shadow:var(--shadow); }
    .card h3 { margin:0 0 6px; }
    .card p { margin:0; color:var(--muted); }
    .callout { margin:22px 0; padding:17px 19px; border-left:4px solid var(--blue); border-radius:8px; background:#eef5ff; }
    .callout.warn { border-color:var(--amber); background:#fff6e8; }
    .callout.danger { border-color:var(--red); background:#fff0ef; }
    .callout strong { display:block; margin-bottom:3px; }
    ol.steps { padding:0; list-style:none; counter-reset:steps; }
    ol.steps li { position:relative; min-height:38px; padding:5px 0 14px 46px; counter-increment:steps; }
    ol.steps li:before { content:counter(steps); position:absolute; left:0; top:2px; display:grid; width:31px; height:31px; place-items:center; border-radius:50%; color:white; background:var(--indigo); font-size:13px; font-weight:800; }
    ul.checks { padding-left:22px; }
    ul.checks li { padding:4px 0; }
    code,.ui { padding:2px 6px; border-radius:5px; background:#eceaf7; font: .88em ui-monospace,SFMono-Regular,Menlo,monospace; white-space:nowrap; }
    table { width:100%; border-collapse:collapse; margin-top:20px; background:white; }
    th,td { padding:13px 14px; border:1px solid var(--line); text-align:left; vertical-align:top; }
    th { background:#eceaf7; font-size:13px; }
    .flow { display:flex; flex-wrap:wrap; gap:8px; margin:24px 0; align-items:center; }
    .flow span { padding:9px 12px; border-radius:9px; background:#e8e6f6; font-weight:700; font-size:13px; }
    .flow b { color:var(--muted); }
    .report { padding:26px; border-radius:18px; color:white; background:#242057; }
    .report h2 { color:white; }
    .report dl { display:grid; grid-template-columns:130px 1fr; gap:9px 15px; margin:22px 0 0; }
    .report dt { color:var(--lavender); font-weight:800; }
    .report dd { margin:0; color:#e2e9e4; }
    .small { color:var(--muted); font-size:13px; }
    @media(max-width:700px) { .grid{grid-template-columns:1fr} .hero{padding-top:45px} main{padding-inline:18px} nav .wrap{padding-inline:12px} table{font-size:13px} th,td{padding:9px} .report dl{grid-template-columns:1fr;gap:2px}.report dd{margin-bottom:10px} }
  </style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <div class="eyebrow">Snatchi · acceptance testing</div>
      <h1>One project. Every role. A complete test journey.</h1>
      <p class="lead">Use this guide to test the Snatchi web platform and engineer mobile app together. Follow the sections in order so projects, bookings, messages, payments and invoices share the same test data.</p>
      <div class="meta"><span class="pill">Product: Snatchi</span><span class="pill">Owner: PlasmaPro Ltd</span><span class="pill">Web + mobile</span><span class="pill">External tester edition</span></div>
    </div>
  </header>
  <nav aria-label="Guide sections"><div class="wrap">
    <a href="#prepare">Prepare</a><a href="#public">Public web</a><a href="#organisation">Owner & manager</a><a href="#engineer">Engineer app</a><a href="#journey">Cross-role journey</a><a href="#plans">Plans</a><a href="#admin">Admin</a><a href="#reporting">Report</a>
  </div></nav>
  <main class="wrap">
    <section id="prepare">
      <div class="tag">Before testing</div><h2>Prepare a safe test workspace</h2>
      <p class="intro">The test coordinator should supply the environment URLs and accounts privately. Passwords, database strings, Stripe secrets and admin credentials must never be placed in this guide, a ticket, screenshot or source control.</p>
      <div class="grid">
        <article class="card"><h3>Organisation owner</h3><p>Active subscription and permission to create projects, users, bookings and invoices.</p></article>
        <article class="card"><h3>Manager</h3><p>Member of the same organisation for project, team, scheduling and invoice checks.</p></article>
        <article class="card"><h3>Engineer</h3><p>Active mobile account with chat enabled, a valid address and notifications allowed.</p></article>
        <article class="card"><h3>Guest</h3><p>Optional restricted web account for dashboard and project conversation checks.</p></article>
      </div>
      <h3>Record these before starting</h3>
      <table><thead><tr><th>Item</th><th>Tester records</th></tr></thead><tbody>
        <tr><td>Web URL</td><td>Supplied by the test coordinator</td></tr><tr><td>Mobile build</td><td>Platform, version/build number and installation link</td></tr><tr><td>Environment</td><td>Test or staging — never assume production</td></tr><tr><td>Accounts</td><td>Owner, manager, engineer and guest emails shared through an approved secure channel</td></tr><tr><td>Test project</td><td><code>QA-[date]-[initials]</code> to make cleanup and tracing easy</td></tr>
      </tbody></table>
      <div class="callout warn"><strong>Payments and real-world side effects</strong>Confirm with the coordinator that Stripe is in test mode before entering any card. Do not test charges, subscription cancellation, broadcasts, live payouts or destructive admin actions in production. Email and push notifications may contact real recipients.</div>
      <ul class="checks"><li>Use a modern Chrome, Safari or Edge browser and also test one mobile-width browser viewport.</li><li>Install the supplied iOS or Android build; record OS, device and app build.</li><li>Allow notifications only on a test device and use test inboxes.</li><li>Use non-sensitive sample documents with no customer or employee personal data.</li></ul>
    </section>

    <section id="public">
      <div class="tag">Web · unauthenticated</div><h2>Public website and account entry</h2>
      <p class="intro">Test the public experience before signing in. It should explain AV project, engineer and booking management clearly, present PlasmaPro Ltd as the owner, and make the next action obvious.</p>
      <ol class="steps"><li>Open the homepage and review the header, key message, calls to action, footer and mobile layout.</li><li>Open <span class="ui">Features</span>, <span class="ui">Pricing</span>, <span class="ui">About</span>, <span class="ui">Contact</span>, privacy policy and sign-in. Confirm no broken links or placeholder product imagery.</li><li>Submit the Contact form with clearly marked test content. Confirm validation, success feedback and one received email only.</li><li>Review all three pricing cards. Confirm price, billing period and limits agree with the plan table below.</li><li>Open checkout only in the approved test environment. Confirm the selected plan and total remain consistent.</li><li>Test sign-in validation, a wrong password, <span class="ui">Forgot password</span>, reset email and a successful login.</li></ol>
    </section>

    <section id="organisation">
      <div class="tag">Web · owner and manager</div><h2>Run the organisation workspace</h2>
      <h3>Owner onboarding and settings</h3>
      <ol class="steps"><li>Sign in as the organisation owner and confirm the dashboard loads without exposing another organisation’s data.</li><li>Use the getting-started checklist: complete the organisation profile, add an engineer, create a project and schedule an engineer.</li><li>Open Settings and verify Profile, Subscription, Receive payments and Password sections.</li><li>Confirm the plan name and billing state are correct. Open the Stripe customer portal only when the coordinator has approved billing tests.</li><li>If external engineers will be used, inspect Stripe Connect onboarding. Do not submit real identity or bank information in a shared test environment.</li></ol>
      <h3>Projects, users and documents</h3>
      <ol class="steps"><li>Open Projects, select <span class="ui">Create project</span>, and use the agreed <code>QA-...</code> name and project number.</li><li>Enter scope, customer contact, address, status, priority, start date and end date. Confirm an end date before the start date is rejected.</li><li>Edit and save the project. Confirm search and project status displays remain accurate.</li><li>Add a small safe test document, open it, then remove only that document. Check the project remains intact.</li><li>Open Users and add or inspect a manager, engineer and optional guest. Confirm role, active status, visibility and chat access are represented correctly.</li><li>Sign in as the manager and repeat one project edit, user view and invoice export. The manager must see only their organisation.</li></ol>
      <h3>Communication and invoices</h3>
      <ol class="steps"><li>Open Chats, start a direct test conversation and create a group containing only test accounts.</li><li>Send a uniquely identifiable message from web and confirm it appears once in the engineer app.</li><li>Open Invoices; test search and date filters, invoice detail, status display and PDF/CSV downloads using test records.</li></ol>
    </section>

    <section id="engineer">
      <div class="tag">Mobile · engineer</div><h2>Test the engineer app in the field</h2>
      <ol class="steps"><li>Sign in with the engineer test account. Confirm the profile belongs to the expected organisation and no other user’s data appears.</li><li>Check name, contact details, address, visibility and profile image. Update only fields approved for the test account.</li><li>Upload a harmless test document or image. Confirm upload progress, success, reopen and deletion behaviour.</li><li>Open the schedule and locate the coordinated QA booking. Check project, location, dates, times, description, rate and offer.</li><li>Accept the booking. On a separate booking, test decline only if the coordinator expects it.</li><li>Open direct and booking chat, receive the web message and reply. Confirm messages are ordered correctly and are not duplicated.</li><li>With notification permission enabled, verify a relevant booking or message push opens the correct screen. Also check behaviour with permission denied.</li><li>At the agreed test time, move an eligible booking through <span class="ui">Ready to Start</span>, <span class="ui">In Progress</span> and <span class="ui">Completed</span>. Confirm invalid early transitions are blocked.</li><li>Test forgot-password and verification links on the mobile account without exposing the code in screenshots or tickets.</li><li>Sign out, relaunch the app and confirm protected data is no longer visible.</li></ol>
      <div class="callout"><strong>Mobile evidence</strong>Every mobile report should include device model, OS version, app build, network type and notification-permission state.</div>
    </section>

    <section id="journey">
      <div class="tag">Coordinated acceptance test</div><h2>Complete one booking end to end</h2>
      <div class="flow"><span>Owner creates project</span><b>→</b><span>Owner books engineer</span><b>→</b><span>Engineer accepts</span><b>→</b><span>Owner approves</span><b>→</b><span>Payment if required</span><b>→</b><span>Work starts</span><b>→</b><span>Work completes</span><b>→</b><span>Invoice reviewed</span></div>
      <ol class="steps"><li>Owner creates the QA project and books an internal engineer. Confirm overlapping bookings for the same engineer are rejected.</li><li>Engineer receives the booking in the app and accepts it. The web booking list should update from Pending to Accepted.</li><li>Where the workflow requires it, the organisation approves the booking. For an eligible external engineer, verify Awaiting Payment without using a live card.</li><li>After an approved test payment, confirm both organisations see the correct status and no duplicate payment or notification is created.</li><li>Engineer starts and completes work in the app. Confirm the web status follows the allowed sequence and timestamps are sensible.</li><li>Review the resulting invoice and payment record. Amounts, engineer, project and dates must match the booking.</li><li>Cancel a separate disposable booking and confirm both roles see the terminal status and cannot continue its workflow.</li></ol>
    </section>

    <section id="plans">
      <div class="tag">Entitlements</div><h2>Verify all three plans are enforceable</h2>
      <table><thead><tr><th>Plan</th><th>Billing</th><th>Active projects</th><th>Active members</th><th>Documents / period</th><th>Max file</th></tr></thead><tbody>
        <tr><td>Basic Plan</td><td>£50 monthly</td><td>25</td><td>10</td><td>100</td><td>10MB</td></tr><tr><td>Premium</td><td>£250 / 6 months</td><td>75</td><td>30</td><td>500</td><td>25MB</td></tr><tr><td>Premium Plus</td><td>£500 yearly</td><td>250</td><td>100</td><td>2,000</td><td>50MB</td></tr>
      </tbody></table>
      <p class="small">Active members include the organisation owner, managers and engineers. Platform administrators are isolated and must never consume a customer member allowance.</p>
      <ol class="steps"><li>For each plan fixture, confirm the visible plan and limits match this table.</li><li>Create up to the allowed project/member/upload boundary using prepared fixtures or an approved seed process.</li><li>Attempt one item beyond each limit. The operation must be rejected with a useful message and create no partial record.</li><li>Deactivate a project or member, then confirm capacity is restored where the limit is defined as active usage.</li><li>Attempt a file just over the per-file limit and confirm it is rejected before storage. Confirm failed uploads do not consume usage.</li><li>Confirm expired, cancelled or suspended subscriptions cannot perform protected lifecycle actions, while existing data remains available according to policy.</li></ol>
      <div class="callout warn"><strong>Do not build limits by hand in production</strong>Boundary testing should use disposable test organisations and approved seed data. Do not create hundreds of records manually in a live customer organisation.</div>
    </section>

    <section id="admin">
      <div class="tag">Web · platform control plane</div><h2>Admin checks for an authorised tester</h2>
      <div class="callout danger"><strong>Admin is intentionally isolated</strong>There is no public admin registration. Only an authorised operator may provision an admin with the documented script and share access privately. Admin testing must use designated records and must not change subscriptions, customer data or live transfers without an approved incident procedure.</div>
      <ol class="steps"><li>Verify a logged-out visitor cannot open <code>/protected/admin/dashboard</code>, and a normal organisation user is denied.</li><li>Sign in as the designated admin and review dashboard, Users, Organisations, Payment issues and Settings.</li><li>Search and paginate organisations and users. Confirm customer users are read-only.</li><li>On a disposable test organisation, enter an operational reason, suspend access, verify access is blocked without cancelling Stripe, then restore it.</li><li>Inspect a prepared failed payment. Verify Stripe references and reconciliation information without displaying secret values.</li><li>Run transfer retry only on an approved test payment. Confirm duplicate requests produce no more than one transfer and an audit record is created.</li><li>Review the health view and admin audit trail. Actor, action, target, reason, result and time should be present.</li></ol>
    </section>

    <section id="reporting" class="report">
      <div class="eyebrow">Defect reporting</div><h2>Make every finding reproducible</h2>
      <p>Report the first point where actual behaviour differs from expected behaviour. Attach the smallest useful screenshot or recording and redact names, emails, payment references, tokens and personal documents.</p>
      <dl><dt>Title</dt><dd>[Web/Android/iOS] Area — concise failure</dd><dt>Environment</dt><dd>URL or build, browser/device, OS and account role</dd><dt>Test data</dt><dd>QA project number and safe record identifiers</dd><dt>Steps</dt><dd>Numbered actions from a clean starting state</dd><dt>Expected</dt><dd>The specific result the tester expected</dd><dt>Actual</dt><dd>What happened, including exact visible error text</dd><dt>Evidence</dt><dd>Redacted screenshot/video and approximate time with timezone</dd><dt>Severity</dt><dd>Blocker, high, medium or low — include a workaround if one exists</dd></dl>
    </section>
  </main>
</body>
</html>`;

export async function GET() {
  return new Response(GUIDE_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    }
  });
}
