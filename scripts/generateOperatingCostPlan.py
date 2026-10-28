from pathlib import Path
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from generateProductOverview import (
    INDIGO, DEEP, INK, MUTED, PALE, LIGHT, LINE, WHITE, AMBER, RED, GREEN,
    set_font, page_number, border_bottom, add_field, add_body, add_bullets,
    add_numbered, add_callout, add_table
)

OUT = Path(__file__).resolve().parents[1] / "docs" / "Snatchi-External-Service-Cost-Plan-for-PlasmaPro.docx"


def add_heading_block(doc, number, title, deck=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(f"{number:02d}  /  COST PLAN")
    set_font(r, 8.5, True, INDIGO)
    h = doc.add_heading(title, level=1)
    if deck:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(10)
        r = p.add_run(deck)
        set_font(r, 10.5, False, MUTED)


def add_source(doc, supplier, title, url, note):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(.18)
    p.paragraph_format.space_after = Pt(5)
    r = p.add_run(f"{supplier} — {title}. ")
    set_font(r, 9, True, DEEP)
    r = p.add_run(note)
    set_font(r, 9, False, INK)
    r = p.add_run(f"\n{url}")
    set_font(r, 8.5, False, INDIGO)


def build():
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(.82)
    section.bottom_margin = Inches(.82)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.header_distance = Inches(.42)
    section.footer_distance = Inches(.42)

    normal = doc.styles["Normal"]
    normal.font.name = "Aptos"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor.from_string(INK)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.10
    for name, size, before, after, color in (
        ("Heading 1", 16, 16, 8, DEEP),
        ("Heading 2", 13, 12, 6, INDIGO),
        ("Heading 3", 11.5, 8, 4, DEEP),
    ):
        style = doc.styles[name]
        style.font.name = "Aptos Display"
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.space_before = Pt(before)
        style.paragraph_format.space_after = Pt(after)
        style.paragraph_format.keep_with_next = True

    header = section.header.paragraphs[0]
    r = header.add_run("SNATCHI  /  EXTERNAL SERVICE COST PLAN")
    set_font(r, 8, True, MUTED)
    page_number(section.footer.paragraphs[0])

    # Memo masthead.
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(5)
    r = p.add_run("OPERATING COST PLAN")
    set_font(r, 10, True, INDIGO)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run("Estimated External Service Cost\nof Running Snatchi")
    set_font(r, 28, True, DEEP, "Aptos Display")
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(16)
    r = p.add_run("Web platform + iOS and Android engineer application")
    set_font(r, 13, False, MUTED)
    border_bottom(p, INDIGO, "18")
    add_field(doc, "PREPARED FOR", "PlasmaPro Ltd")
    add_field(doc, "PRODUCT", "Snatchi")
    add_field(doc, "PRICING DATE", "22 August 2026")
    add_field(doc, "CURRENCY", "GBP planning values; supplier USD converted at US$1.30 = £1.00")
    add_field(doc, "SCOPE", "External subscriptions, cloud/API usage, app distribution and payment fees")
    add_field(doc, "EXCLUDED", "Manual labour, salaries, contractors, support time, marketing and general company overhead")
    add_callout(doc, "Decision summary", "Approve a baseline external-service operating budget of £190 per month excluding VAT and Stripe transaction fees for launch. This includes a lean production stack plus practical usage reserves and a 20% contingency. A technically lean floor is approximately £115 per month; a growth-stage allowance is approximately £420 per month.", "info")

    add_heading_block(doc, 1, "Executive cost summary", "A realistic budget range, not a supplier quotation.")
    add_table(doc, ["Operating stage", "Monthly budget", "Annual budget", "What it represents"], [
        ["Technical launch floor", "£115", "£1,380", "Core paid production services, free usage tiers where suitable, and 20% contingency."],
        ["Recommended launch budget", "£190", "£2,280", "Core services plus reserves for hosting, database, email, Firebase, media, maps and monitoring usage."],
        ["Growth budget", "£420", "£5,040", "More traffic, paid media storage, stronger database capacity, two deployers and increased API usage."],
        ["Scale planning allowance", "£1,130", "£13,560", "Higher database/media tiers, wider monitoring, heavier traffic and meaningful location/messaging usage."],
    ], [1750, 1450, 1450, 4710], 8.7)
    add_body(doc, "These values exclude VAT, payment-processing fees, refunds, disputes, foreign-exchange fees and manual labour. The annual figures are monthly budgets multiplied by twelve; some suppliers bill annually or in USD, so actual cash timing and exchange rates will differ.")
    add_callout(doc, "Recommended approval", "Use £190 per month as PlasmaPro’s initial non-labour operating envelope, plus a separate variable Stripe reserve. Set supplier spend alerts and review actual usage after the first 60 and 90 days before committing to higher tiers.", "positive")

    add_heading_block(doc, 2, "Service inventory and launch estimate", "The external services identified in the Snatchi web and mobile codebases.")
    add_table(doc, ["Service", "Purpose", "Launch choice", "Est. £/month", "Cost type"], [
        ["Vercel", "Next.js hosting, CDN, server functions and deployments", "Pro, one deploying seat", "£15.40", "Fixed + overage"],
        ["MongoDB Atlas", "Primary operational database", "Dedicated entry tier (M10)", "£43.80", "Hourly + storage/egress"],
        ["Firebase", "Mobile auth, Firestore chat and FCM push", "Blaze with free quotas", "£0–£10", "Usage based"],
        ["Cloudinary", "Project/user documents and images", "Free while within 25 credits", "£0", "Tier/credits"],
        ["Brevo", "Transactional email", "Starter, 5,000 emails", "£6.90", "Fixed by volume"],
        ["Sentry", "Web/mobile error and performance monitoring", "Team", "£20.00", "Fixed + overage"],
        ["Google Maps Platform", "Mobile maps/location APIs if billable SKUs are enabled", "Free calls / PAYG", "£0–£5", "Usage based"],
        ["Apple Developer", "iOS signing, TestFlight and App Store", "Organisation membership", "£6.35", "US$99/year"],
        ["Google Play", "Android distribution", "Full distribution", "£1.60*", "US$25 one-off"],
        ["Domain, DNS and TLS", "Public domain and secure routing", "Registrar + free DNS/TLS", "£1.25†", "Annual allowance"],
        ["Stripe", "Subscriptions, cards, Connect and payouts", "Pay as you go", "Variable", "Percentage + per event"],
    ], [1400, 2660, 1980, 1450, 1870], 8.1)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    r = p.add_run("* Google Play is shown as a first-year monthly equivalent; the fee is paid once. † Domain allowance is a planning estimate, not a current registrar quote. Supplier prices converted at US$1.30/£1 and rounded.")
    set_font(r, 8.2, False, MUTED)

    doc.add_heading("What should be paid from launch", level=2)
    add_bullets(doc, [
        "Vercel Pro rather than Hobby, because Hobby is positioned for personal/non-commercial use.",
        "A dedicated MongoDB Atlas entry tier rather than the free learning tier for production customer data.",
        "Brevo Starter to remove the 300-email daily ceiling and support transactional growth.",
        "Sentry Team so multiple stakeholders can operate monitoring and integrations.",
        "Apple Developer membership and Google Play registration under PlasmaPro’s legal organisation accounts.",
        "Firebase Blaze billing enabled with budget alerts, even when initial usage remains inside no-cost quotas."
    ])
    doc.add_heading("Services that can begin at zero usage cost", level=2)
    add_bullets(doc, [
        "Cloudinary Free: 25 monthly credits shared across transformations, storage and bandwidth; suitable only while usage remains below the included envelope.",
        "Firebase: FCM is no-cost; most authentication has 50,000 no-cost monthly active users; Firestore includes 1 GiB storage, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB monthly outbound transfer.",
        "Google Maps Platform: current product usage may remain inside free calls; some mobile actions simply open Google Maps URLs. Billable API/SDK use must still have quotas and alerts.",
        "Cloudflare Free can provide DNS, universal SSL, CDN and baseline DDoS/WAF features if used in front of the chosen hosting setup."
    ])

    add_heading_block(doc, 3, "Budget scenarios and scaling triggers", "Spend should rise because measured usage requires it, not because a higher tier looks safer.")
    add_table(doc, ["Cost line", "Floor", "Recommended launch", "Growth", "Scale"], [
        ["Hosting and delivery", "£15", "£25", "£46", "£100"],
        ["Database", "£44", "£54", "£120", "£298"],
        ["Media/documents", "£0", "£15 reserve", "£76", "£192"],
        ["Firebase/chat/push", "£0", "£10", "£35", "£100"],
        ["Transactional email", "£7", "£12", "£14", "£50"],
        ["Monitoring", "£20", "£25", "£30", "£92"],
        ["Maps/location", "£0", "£5", "£20", "£100"],
        ["Stores + domain", "£9", "£9", "£9", "£8"],
        ["Subtotal", "£95", "£155", "£350", "£940"],
        ["20% contingency", "£19", "£31", "£70", "£188"],
        ["Approved budget", "£115", "£190", "£420", "£1,130"],
    ], [2410, 1600, 1860, 1680, 1810], 8.4)
    add_body(doc, "Growth and scale rows are planning allowances rather than exact quotes. MongoDB region, provider, backups and storage materially affect the invoice; Firebase and Maps depend on SKU and region; Vercel and Sentry depend on overage. Cloudinary paid values use the published Plus and Advanced monthly rates converted to GBP.")
    doc.add_heading("Upgrade triggers", level=2)
    add_table(doc, ["Service", "Stay on launch choice while…", "Upgrade/review when…"], [
        ["MongoDB", "CPU, memory, connection and storage headroom are stable.", "Sustained resource pressure, slow queries, backup requirements or storage growth approach safe limits."],
        ["Cloudinary", "Combined storage, transformations and bandwidth remain within 25 credits.", "Usage trends toward the credit ceiling or production needs exceed free-plan file-size/security features."],
        ["Firebase", "Chat/auth/egress remain inside free quota and invoices are negligible.", "Reads, listeners, storage or egress rise; optimise queries before simply raising budget."],
        ["Vercel", "One deployer and included credit cover production use.", "Another deploying seat is required or compute/data transfer consistently consumes the credit."],
        ["Brevo", "5,000 messages/month is sufficient and delivery quality is healthy.", "Volume approaches the allowance, more contacts/users are needed, or deliverability features justify Standard."],
        ["Sentry", "50,000 errors, 5 GB logs/metrics and 5M spans are sufficient.", "Quotas suppress useful telemetry or governance requirements justify Business."],
        ["Maps", "Monthly calls remain in each SKU’s free allowance.", "Paid API requests begin; restrict keys, set per-SKU quotas and forecast from real call counts."],
    ], [1400, 3740, 4220], 8.1)

    add_heading_block(doc, 4, "Stripe variable transaction costs", "Stripe has no fixed launch subscription, but costs increase directly with revenue and marketplace activity.")
    doc.add_heading("Customer subscription payments", level=2)
    add_body(doc, "Planning formula for a standard UK card: 1.5% + £0.20 Stripe Payments fee, plus 0.7% of recurring Billing volume. Combined planning rate: approximately 2.2% + £0.20 per successful subscription charge.")
    add_table(doc, ["Snatchi plan", "Charge", "Payments fee", "Billing fee", "Total fee", "Net before VAT"], [
        ["Basic Plan", "£50 monthly", "£0.95", "£0.35", "£1.30", "£48.70"],
        ["Premium", "£250 / 6 months", "£3.95", "£1.75", "£5.70", "£244.30"],
        ["Premium Plus", "£500 yearly", "£7.70", "£3.50", "£11.20", "£488.80"],
    ], [1500, 1700, 1500, 1400, 1400, 1860], 8.5)
    add_callout(doc, "Card mix matters", "The table assumes standard UK cards. Published Stripe pricing is higher for premium UK, EEA and international cards; currency conversion and disputes can add further fees. Build forecasts from the actual card mix once live.", "caution")

    doc.add_heading("External engineer marketplace payments", level=2)
    add_body(doc, "Where the platform sets Connect pricing, use this conservative UK planning formula for one successful booking payment and one payout: card processing (1.5% + £0.20) + payout (0.25% + £0.10) + £2 for each connected account active in that month. The £2 account fee is monthly, not per payout, so it is shared when an engineer receives multiple payouts.")
    add_table(doc, ["Engineer payment", "Card processing", "Payout fee", "Active account", "Illustrative total"], [
        ["£250", "£3.95", "£0.73", "£2.00", "£6.68"],
        ["£500", "£7.70", "£1.35", "£2.00", "£11.05"],
        ["£1,000", "£15.20", "£2.60", "£2.00", "£19.80"],
    ], [1850, 1900, 1650, 1800, 2160], 8.5)
    add_body(doc, "The actual Connect charge depends on account configuration and whether Stripe or the platform controls pricing. Confirm the live Connect pricing model in the Stripe Dashboard before publishing marketplace margins.")

    doc.add_heading("Illustrative monthly Stripe reserve", level=2)
    add_table(doc, ["Stage", "Subscription assumption", "Marketplace assumption", "Est. Stripe fees"], [
        ["Launch", "10 Basic payments (£500)", "5 × £500 payouts to 5 active engineers", "~£68/month"],
        ["Growth", "50 Basic payments (£2,500)", "25 × £500 payouts to 20 active engineers", "~£331/month"],
        ["Scale", "200 Basic payments (£10,000)", "100 × £500 payouts to 75 active engineers", "~£1,315/month"],
    ], [1400, 2350, 3420, 2190], 8.4)
    add_body(doc, "These examples are deliberately simple and exclude refunds, failed charges, disputes, international cards and VAT. They are a reserve-planning tool, not a revenue forecast.")

    add_heading_block(doc, 5, "Cost governance and purchasing plan", "The control process is as important as the opening budget.")
    add_numbered(doc, [
        "Open supplier accounts in PlasmaPro Ltd’s legal name, using company-controlled email addresses and billing methods.",
        "Keep production and test projects separate, especially for MongoDB, Firebase, Stripe, Cloudinary and Sentry.",
        "Apply budget alerts and hard caps where supported; use API-key restrictions, least privilege and named account owners.",
        "Record plan, renewal date, billing currency, VAT treatment, account owner, cancellation terms and current spend in a subscription register.",
        "Review actual invoices and usage after 30, 60 and 90 days, then quarterly.",
        "Upgrade only after measuring the relevant trigger: database resources, document credits, email volume, API calls, telemetry events or deployment seats.",
        "Reconcile Stripe fees separately from infrastructure so gross margin is visible by subscription and external booking.",
        "Maintain a 20% service contingency and a separate chargeback/refund reserve; do not treat either as available operating profit."
    ])
    doc.add_heading("Recommended cost controls", level=2)
    add_bullets(doc, [
        "Vercel: spend notifications and a reviewed maximum-spend action.",
        "MongoDB Atlas: budget alerts, auto-scaling limits, slow-query review and backup-cost visibility.",
        "Firebase/Google Cloud: project budget alerts, Firestore listener/read monitoring and restricted mobile/web API keys.",
        "Cloudinary: credit alerts and lifecycle cleanup for deleted project/user files.",
        "Brevo: sending-volume and bounce/complaint monitoring.",
        "Sentry: inbound filters, sampling and maximum spend thresholds so one fault cannot generate an uncontrolled bill.",
        "Stripe: Radar/3DS settings, dispute monitoring, webhook reconciliation and fee reporting by product flow."
    ])

    add_heading_block(doc, 6, "What is excluded", "This plan intentionally focuses on external service subscriptions and APIs.")
    add_bullets(doc, [
        "Development, design, testing, deployment, DevOps, customer support and incident-response labour.",
        "Sales, advertising, social media, content production and customer acquisition.",
        "Company accounting, legal advice, insurance, data-protection consultancy and general corporate overhead.",
        "User devices, test phones, laptops, broadband and office costs.",
        "VAT and corporation/tax treatment.",
        "Refund principal, engineer compensation, chargeback principal and customer credits.",
        "Enterprise support contracts, penetration testing or compliance certification unless separately purchased.",
        "Any supplier not currently evidenced in the web/mobile source or deliberately added after this plan."
    ])
    add_callout(doc, "Financial interpretation", "The £190 launch budget is the estimated cost of keeping the technical service stack available, not the total cost of operating the Snatchi business. It should not be used as a profitability figure without labour, tax, support, sales and risk costs.", "risk")

    add_heading_block(doc, 7, "Planning assumptions and sensitivity", "The figures are designed to be updated from real invoices.")
    add_table(doc, ["Assumption", "Value used", "Sensitivity"], [
        ["FX rate", "US$1.30 = £1.00", "A 10% weaker pound raises USD-denominated lines by roughly 11%."],
        ["VAT", "Excluded", "UK invoices may add VAT or apply reverse-charge/accounting treatment."],
        ["Month length", "Supplier published monthly price", "Hourly database totals vary by month and region."],
        ["Production region", "No region-specific uplift modelled", "MongoDB, Firebase and egress can differ by selected region/provider."],
        ["Cloudinary launch", "Free tier", "Plus is US$99/month (£76 planning value) once required."],
        ["Payment card", "Standard UK card", "Premium/international cards and conversion cost more."],
        ["Contingency", "20% of service subtotal", "Covers usage and FX variance, not major tier changes or incidents."],
    ], [2300, 2800, 4260], 8.4)
    add_body(doc, "For budgeting, refresh supplier prices and the FX rate immediately before PlasmaPro approves contracts. Replace planning allowances with actual invoices after launch and retain the scenario model for forward forecasting.")

    add_heading_block(doc, 8, "Official pricing sources", "Primary supplier sources reviewed on 22 August 2026.")
    add_source(doc, "Vercel", "Pro Plan pricing", "https://vercel.com/pricing", "Pro is US$20/month with one deploying seat and US$20 usage credit; additional paid seats are US$20/month.")
    add_source(doc, "MongoDB", "Atlas pricing", "https://www.mongodb.com/pricing", "Dedicated production tiers start at US$0.08/hour / approximately US$56.94 per month; final price depends on provider, region, storage and backup.")
    add_source(doc, "Firebase", "Pricing and Firestore billing", "https://firebase.google.com/pricing", "FCM and several products are no-cost; Blaze retains free quotas and charges usage above them.")
    add_source(doc, "Cloudinary", "Image and Video API plans", "https://cloudinary.com/pricing", "Free includes 25 monthly credits; Plus is US$99/month or US$89/month on annual billing; Advanced is US$249/month.")
    add_source(doc, "Brevo", "Plan overview", "https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans", "Free permits 300 daily sends; Starter begins at US$9/month for 5,000 monthly emails.")
    add_source(doc, "Sentry", "Pricing", "https://sentry.io/pricing/", "Developer is free for one user; Team is US$26/month and includes 50,000 errors plus published telemetry quotas.")
    add_source(doc, "Stripe", "UK Payments pricing", "https://stripe.com/gb/pricing", "Standard UK cards are 1.5% + £0.20; other card types, disputes and currency conversion have different fees.")
    add_source(doc, "Stripe", "Billing pricing", "https://stripe.com/gb/billing/pricing", "Pay-as-you-go recurring Billing is 0.7% of Billing volume.")
    add_source(doc, "Stripe", "Connect pricing", "https://stripe.com/gb/connect/pricing", "When the platform handles pricing, UK planning rates include £2 per monthly active account and 0.25% + £0.10 per payout.")
    add_source(doc, "Apple", "Developer Program membership", "https://developer.apple.com/programs/whats-included/", "US$99 per membership year or local-currency equivalent.")
    add_source(doc, "Google Play", "Developer registration", "https://support.google.com/googleplay/android-developer/answer/6112435", "US$25 one-time registration fee.")
    add_source(doc, "Google Maps Platform", "Pricing", "https://mapsplatform.google.com/pricing/", "Free calls vary by SKU; paid use is metered and converted to local billing currency.")
    add_source(doc, "Cloudflare", "Plans", "https://www.cloudflare.com/plans/", "Free includes DNS, CDN, universal SSL and baseline protection; Pro is US$20/month annually or US$25 month-to-month.")

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    r = p.add_run("Document status")
    set_font(r, 9, True, INDIGO)
    p = doc.add_paragraph()
    r = p.add_run("Planning estimate for PlasmaPro stakeholder review. Not a binding quotation, tax opinion or guarantee of supplier pricing. All prices and product terms can change; confirm them in the supplier account before purchase.")
    set_font(r, 8.5, False, MUTED)

    for table in doc.tables:
        for row in table.rows:
            tr_pr = row._tr.get_or_add_trPr()
            cant_split = OxmlElement("w:cantSplit")
            tr_pr.append(cant_split)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.core_properties.title = "Snatchi External Service Operating Cost Plan"
    doc.core_properties.subject = "External subscriptions, APIs and cloud services for PlasmaPro"
    doc.core_properties.author = "Suftnet"
    doc.core_properties.keywords = "Snatchi, PlasmaPro, operating cost, SaaS, cloud, API, Stripe"
    doc.save(OUT)
    print(OUT)


if __name__ == "__main__":
    build()
