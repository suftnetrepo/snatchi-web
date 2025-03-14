const emailTemplates = {
  codeVerification: ({ name, code, contact_email, team }) => `
    <mjml>
      <mj-body background-color="#f1f1f1">
        <mj-section>
          <mj-column>
          </mj-column>
        </mj-section>
        <mj-section background-color="#fff">
          <mj-column>
            <mj-text font-size="30px" align="center">
              Your Code for Verification
            </mj-text>
            <mj-divider border-color="#06adef" width="100px"></mj-divider>
            <mj-text font-size="18px" align="left" color="#555" line-height="30px">
              Hi ${name},
              <p>
                <br>Your Code for verification is:
                <h3>${code}</h3>
                If you're not sure why you're receiving this message, you can report it to us by emailing ${contact_email}.<br>
              </p>
              <p>Sincerely,<br />${team}</p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  subscriptionWelcomeMessage: ({
    contact,
    plan,
    price,
    billingCycle,
    duration,
    contactEmail,
    userName,
    url,
    team,
    password
  }) => `
    <mjml>
      <mj-body background-color="#ffffff">
        <mj-section background-color="#ffffff" padding-bottom="0px">
          <mj-column vertical-align="top" width="100%">

          </mj-column>
        </mj-section>
        <mj-section background-color="#009FE3" padding-bottom="0px" padding-top="0">
          <mj-column vertical-align="top" width="100%">
            <mj-text 
              align="left" 
              color="#ffffff" 
              font-size="30px" 
              font-weight="bold" 
              font-family="open Sans Helvetica, Arial, sans-serif" 
              padding-left="25px" 
              padding-right="25px" 
              padding-bottom="20px" 
              padding-top="50px">
              Welcome to Snatchi
            </mj-text>
          </mj-column>
        </mj-section>
        <mj-section background-color="#009fe3" padding-bottom="20px" padding-top="20px">
          <mj-column vertical-align="middle" width="100%">
            <mj-text 
              align="left" 
              color="#ffffff" 
              font-size="22px" 
              font-family="open Sans Helvetica, Arial, sans-serif" 
              padding-left="25px" 
              padding-right="25px">
              <span style="color:#FEEB35">Dear ${contact}</span><br />
            </mj-text>
            <mj-text 
              align="left" 
              color="#ffffff" 
              font-size="15px" 
              font-family="open Sans Helvetica, Arial, sans-serif" 
              padding-left="25px" 
              padding-right="25px">
              We&apos;re really excited you&apos;ve decided to give us a try. Your account is set up, and you can start using it right away.

              <p><strong>Your Subscription plan :</strong></p>
              <p>Plan : ${plan}<br />Amount : ${price}<br />Billing Cycle : ${billingCycle}</p>
              <p>
                <strong>Getting Started</strong><br>
                Your subscription plan gives you access to <strong>Snatchi</strong> for the next ${duration}.
              </p>
              In case you have any questions, feel free to reach out to us at ${contactEmail}. <br>
              You can log in to your account with your username ${userName} and a temp password : ${password}
            </mj-text>
            <mj-button 
              align="left" 
              font-size="22px" 
              font-weight="bold" 
              background-color="#ffffff" 
              border-radius="10px" 
              color="#1AA0E1" 
              font-family="open Sans Helvetica, Arial, sans-serif"  
              href="${url}">
              Login
            </mj-button>
            <mj-text 
              align="left" 
              color="#ffffff" 
              font-size="15px" 
              font-family="open Sans Helvetica, Arial, sans-serif" 
              padding-left="25px" 
              padding-right="25px">
              Thanks, <br /> ${team}
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  updateSubscription: ({ contact, plan, price, billingCycle, contactEmail, contactMobile, team }) => `
    <mjml>
      <mj-body background-color="#f1f1f1">
        <mj-section>
          <mj-column>
          </mj-column>
        </mj-section>
        <mj-section background-color="#fff">
          <mj-column>
            <mj-text font-size="30px" align="center">
              Subscription Update
            </mj-text>
            <mj-divider border-color="#06adef" width="100px"></mj-divider>
            <mj-text font-size="18px" align="left" color="#555" line-height="30px">
              Dear ${contact},
              <p>
                Your subscription upgrade is successful.
              </p>

              <p>
                Your new subscription details are now:
                <br> Plan: ${plan}
                <br> Amount: ${price}
                <br> Billing Cycle: ${billingCycle}
              </p>

              <p>
                Please remember - if you do have any questions, please drop an email to ${contactEmail}, or give us a call at ${contactMobile}.
              </p>
              <p>Thank you again for subscribing to Jerur!<br> We look forward to working with you!</p>
              <p>Sincerely,<br />${team}</p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  invoicePaymentSuccess: ({ contact, email, amount_paid, hosted_invoice_url, contactEmail, contactMobile, team }) => `
    <mjml>
      <mj-body background-color="#f1f1f1">
        <mj-section>
          <mj-column>
          </mj-column>
        </mj-section>
        <mj-section background-color="#fff">
          <mj-column>
            <mj-text font-size="30px" align="center">
              Invoice Paid Successfully
            </mj-text>
            <mj-divider border-color="#06adef" width="100px"></mj-divider>
            <mj-text font-size="18px" align="left" color="#555" line-height="30px">
              Dear ${contact},
              <p>Thank you for your Snatchi subscription payment, registered to ${email}</p>
              <p><b>Total Amount Paid</b>: ${amount_paid}</p>
              <p>
                To view and download your invoice, copy the following link and paste it in your browser: 
                <a href="${hosted_invoice_url}" target="_blank">${hosted_invoice_url}</a>.
              </p>
              <p>
                Please remember - if you have any questions, please drop an email to ${contactEmail}, 
                or give us a call at ${contactMobile}.
              </p>
              <p>
                We hope you enjoy our services.<br>
                Thank you again for subscribing to <strong>Snatchi</strong>! We look forward to working with you!
              </p>
              <p>Sincerely,<br />${team}</p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  invoicePaymentFailed: ({ contact, period_end, hosted_invoice_url, team }) => `
    <mjml>
      <mj-body background-color="#f1f1f1">
        <mj-section>
          <mj-column>            
          </mj-column>
        </mj-section>
        <mj-section background-color="#fff">
          <mj-column>
            <mj-text font-size="30px" align="center">
              Invoice Payment Failed
            </mj-text>
            <mj-divider border-color="#06adef" width="100px"></mj-divider>
            <mj-text font-size="18px" align="left" color="#555" line-height="30px">
              Dear ${contact},
              <p>
                We are having a problem charging your payment card for your subscription ending on ${period_end}. 
                Please resolve this issue as quickly as possible to avoid service disruption.<br>
                To view and download your invoice, copy the following link and paste it in your browser: 
                <a href="${hosted_invoice_url}" target="_blank">${hosted_invoice_url}</a>.
              </p>
              <p>Sincerely,<br />${team}</p>
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `,
  contact: ({ subject, names, email, body, contact, team }) => `
<mjml>
  <mj-body background-color="#f1f1f1">
    <mj-section>
      <mj-column>
     
      </mj-column>
    </mj-section>
    <mj-section background-color="#fff">
      <mj-column>
        <mj-text font-size="30px" align="center">
          ${subject}
        </mj-text>
        <mj-divider border-color="#06adef" width="100px"></mj-divider>
        <mj-text font-size="18px" align="left" color="#555" line-height="30px">
          Hi,
          <p>
            Names: ${names}<br>
            Email: ${email}<br>
          </p>
          <p>
            ${body}
            <br>
            If you're not sure why you're receiving this message, you can report it to us by emailing ${contact}.
          </p>
          <p>
            Sincerely,<br />
            ${team}
          </p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
subscriptionCancellation : ({ contact, periodEnd, contactEmail, contactMobile, team }) => `
<mjml>
  <mj-body background-color="#f1f1f1">
    <mj-section>
      <mj-column>
      </mj-column>
    </mj-section>
    <mj-section background-color="#fff">
      <mj-column>
        <mj-text font-size="30px" align="center">
          Subscription Cancellation
        </mj-text>
        <mj-divider border-color="#06adef" width="100px"></mj-divider>
        <mj-text font-size="18px" align="left" color="#555" line-height="30px">
          Dear ${contact},
          <p>Your subscription will be cancelled on ${periodEnd}.</p>
          <p>Please remember - if you do have any questions, please drop an email to ${contactEmail}, or give us a call at ${contactMobile}.</p>
          <p>We hope you enjoy our services.</p>
          <p>Sincerely,<br />${team}</p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
 trialCancellation : ({ contact, periodEnd, contactEmail, contactMobile, team }) => `
<mjml>
  <mj-body background-color="#f1f1f1">
    <mj-section>
      <mj-column>
      </mj-column>
    </mj-section>
    <mj-section background-color="#fff">
      <mj-column>
        <mj-text font-size="30px" align="center">
          Subscription Trial Cancellation
        </mj-text>
        <mj-divider border-color="#06adef" width="100px"></mj-divider>
        <mj-text font-size="18px" align="left" color="#555" line-height="30px">
          Dear ${contact},
          <p>Your subscription trial will be cancelled on ${periodEnd}.</p>
          <p>Please remember - if you do have any questions, please drop an email to ${contactEmail}, or give us a call at ${contactMobile}.</p>
          <p>We hope you enjoy our services.</p>
          <p>Sincerely,<br />${team}</p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
trialEnd : ({ contact, billingcycle, team }) => `
<mjml>
  <mj-body background-color="#f1f1f1">
    <mj-section>
      <mj-column>               
      </mj-column>
    </mj-section>
    <mj-section background-color="#fff">
      <mj-column>
        <mj-text font-size="30px" align="center">
          Trial End
        </mj-text>
        <mj-divider border-color="#06adef" width="100px"></mj-divider>
        <mj-text font-size="18px" align="left" color="#555" line-height="30px">
          Dear ${contact},
          <p>
            Thanks for trying Jerur. Your subscription has expired. We start charging you at the end of the plan billing cycle on ${billingcycle}.
          </p>
          <p>
            If you are no longer interested in our services, you can delete your account. Your data will be kept for 7 days before being permanently deleted.
          </p>
          <p>
            Sincerely,<br />${team}
          </p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
trialWillEnd : ({ contact, periodEnd, team }) => `
<mjml>
  <mj-body background-color="#f1f1f1">
    <mj-section>
      <mj-column>
      </mj-column>
    </mj-section>
    <mj-section background-color="#fff">
      <mj-column>
        <mj-text font-size="30px" align="center">
          Trial will End
        </mj-text>
        <mj-divider border-color="#06adef" width="100px"></mj-divider>
        <mj-text font-size="18px" align="left" color="#555" line-height="30px">
          Hi ${contact}!
          <p>Your trial will expire on ${periodEnd}. We will automatically charge your payment card when the trial ends.</p>
          <p>Please go to your plan details if you want to change or cancel your subscription.</p>
          <p>Sincerely,<br />${team}</p>
        </mj-text>      
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`,
welcomeEmailTrial : ({ name, Plan, amount, billingCycle, duration, contactEmail, userName, company }) => `
<mjml>
  <mj-body background-color="#ffffff">
    <mj-section background-color="#ffffff" padding-bottom="0px">
      <mj-column vertical-align="top" width="100%">
      </mj-column>
    </mj-section>
    <mj-section background-color="#009FE3" padding-bottom="0px" padding-top="0">
      <mj-column vertical-align="top" width="100%">
        <mj-text align="left" color="#ffffff" font-size="45px" font-weight="bold" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px" padding-bottom="20px" padding-top="50px">
          Welcome aboard
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#009FE3" padding-bottom="20px" padding-top="20px">
      <mj-column vertical-align="middle" width="100%">
        <mj-text align="left" color="#ffffff" font-size="22px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px">
          <span style="color:#FEEB35">Dear ${name}</span><br /><br /> Welcome to Jerur.
        </mj-text>
        <mj-text align="left" color="#ffffff" font-size="15px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px">
          We're really excited you've decided to give us a try. Your account is set up, and you can start using it right away.
          <p><strong>Your Subscription Plan:</strong></p>
          <p>Plan: ${Plan}<br />Amount: ${amount}<br />Billing Cycle: ${billingCycle}</p>
          <p>
            <strong>Getting Started</strong><br>
            Your subscription plan gives you access to <strong>Snatchi</strong> for the next ${duration}.
          </p>
          In case you have any questions, feel free to reach out to us at ${contactEmail}. You can log in to your account with your username ${userName}.
        </mj-text>
        <mj-button align="left" font-size="22px" font-weight="bold" background-color="#ffffff" border-radius="10px" color="#1AA0E1" font-family="open Sans Helvetica, Arial, sans-serif">
          Login
        </mj-button>
        <mj-text align="left" color="#ffffff" font-size="15px" font-family="open Sans Helvetica, Arial, sans-serif" padding-left="25px" padding-right="25px">
                  <p>Sincerely,<br />${team}</p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`
};

export { emailTemplates };
