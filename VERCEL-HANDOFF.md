# Forge T Labs — Vercel Update & Dynamics 365 Form Integration

Handoff for Claude Code. The Forge T Labs site already runs on **Vercel**. This brief covers
two jobs: (1) push the updated multi-page site, and (2) connect the contact form to
**Dynamics 365** so submissions create a Lead in the CRM.

## 1. Files in this folder
| File | Purpose | Goes where on Vercel |
|---|---|---|
| `index.html` | Home page | site root |
| `solutions.html` | Solutions / ISV page | site root |
| `contact.html` | Contact page (form POSTs to `/api/contact`) | site root |
| `forge-styles.css` | Shared stylesheet | site root |
| `forge.js` | Shared behaviour (scroll reveal, mobile menu) | site root |
| `forge-t-labs-logo.png` | Logo | site root |
| `api/contact.js` | **Serverless function** — receives the form, forwards to Dynamics | `api/` folder |
| `vercel.json` | Vercel config (clean URLs, cache + security headers) | repo root |

Static HTML/CSS/JS — no build step, no framework. Vercel serves the root files as-is and
auto-detects `api/contact.js` as a serverless function at the route `/api/contact`.

## 2. Updating the existing Vercel site
1. Replace the old files in the Git repo connected to the Vercel project with the files here,
   keeping the folder layout above (`api/contact.js` inside an `api/` directory at repo root).
2. Commit and push — Vercel auto-deploys on push. Or run `vercel --prod` with the Vercel CLI.
3. Verify the three pages and that navigation between them works.
4. The contact form will not work until the steps in section 3-5 are complete.

## 3. Integration architecture (how the form reaches Dynamics)
```
contact.html  --POST /api/contact-->  Vercel serverless function
   (browser)         (JSON)            (api/contact.js)
                                            |
                                            |  POST JSON
                                            v
                                   Power Automate flow
                                   ("When an HTTP request
                                    is received" trigger)
                                            |
                                            |  Create row
                                            v
                                   Dynamics 365 / Dataverse
                                   Lead table
```
Why a Power Automate flow in the middle: it holds the Dataverse connection, so no Dynamics
credentials or secrets ever live in Vercel. The function only knows the flow's URL.

## 4. Build the Power Automate flow
1. In Power Automate, create an **instant cloud flow** with trigger
   **"When an HTTP request is received"**.
2. Set the request body JSON schema to expect:
   `name, email, company, phone, interest, message, source, submittedAt` (all strings).
3. Add a **Dataverse "Add a new row"** action targeting the **Leads** table. Map:
   - `Topic` (subject)  <- "Website enquiry — " + company
   - `Last Name`        <- name   (or split name into first/last)
   - `Email`            <- email
   - `Company Name`     <- company
   - `Business Phone`   <- phone
   - `Description`      <- interest + " — " + message
   - `Lead Source`      <- set to "Web"
4. (Optional) Add a **"Send an email"** action to notify hello@forgetlabs.com, and/or an
   auto-acknowledgement to the enquirer's email.
5. (Optional) Add a **Response** action returning HTTP 200 so the function gets clean confirmation.
6. **Save the flow** — Power Automate then generates the **HTTP POST URL**. Copy it. Treat it
   as a secret: anyone with the URL can trigger the flow.

## 5. Configure Vercel
1. In the Vercel project: **Settings > Environment Variables**, add:
   `POWER_AUTOMATE_URL` = the flow URL from step 4.6
   Set it for Production (and Preview if you want test deploys to work).
2. Redeploy so the function picks up the variable.
3. Test: submit the contact form on the deployed site, confirm a Lead appears in Dynamics 365.

## 6. How the function behaves (api/contact.js — already written)
- Accepts POST only; rejects other methods.
- Re-validates every field server-side (never trust the browser).
- **Honeypot**: the form has a hidden `website` field; real users leave it empty, bots fill it.
  If filled, the function silently accepts and drops the submission.
- Forwards a clean JSON payload to `POWER_AUTOMATE_URL`.
- Returns `{ ok: true }` on success; the page then shows its confirmation state.
- The flow URL is read from an env var — it is never hard-coded.

## 7. Alternative to the Power Automate flow
If you prefer no flow, the function can call the **Dataverse Web API** directly. That requires
an **Entra ID app registration** (client credentials) with the Dynamics environment, and
storing `CLIENT_ID` / `CLIENT_SECRET` / `TENANT_ID` / `DATAVERSE_URL` as Vercel env vars. More
control, but more secrets to manage. The Power Automate route in sections 3-5 is recommended.

## 8. MUST replace before launch (placeholders)
- `[Your Solution Name]` / `[Your Solution]` — real ISV product name (index + solutions).
- Pricing $12 / $22 / $35 per user/mo and pricing-card feature lists — real product details.
- `hello@forgetlabs.com`, phone `+1 (555) 000-0000`, `[Your address]`, LinkedIn `#` link.
- Stat tiles (3 / ISV / AI / 24-7) — swap for substantiated metrics if available.
- Confirm the domain spelling: files use `forgetlabs.com` — verify it isn't `forge-t-labs.com`.

## 9. Production checklist
- Set `POWER_AUTOMATE_URL` before going live, or the form returns a 500.
- Test the full path end-to-end: form -> function -> flow -> Lead in Dynamics.
- Consider adding rate-limiting (e.g. Vercel's firewall) to the `/api/contact` route.
- Logo `<img>` has alt text; keep it. Each page has its own `<title>`/meta description.
- Colour contrast: keep small body text on `--ink`, never on green.
- Test the mobile nav (hamburger) and responsive grids after deploy.
