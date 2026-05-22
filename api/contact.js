// ===================================================================
// Forge T Labs — contact form serverless function (Vercel)
// Path: /api/contact   Method: POST
//
// Receives the contact-form submission, validates it server-side,
// and forwards it to a Power Automate "When an HTTP request is
// received" flow, which creates a Lead in Dynamics 365 / Dataverse.
//
// SETUP: set the environment variable POWER_AUTOMATE_URL in the
// Vercel project (Settings > Environment Variables) to the flow's
// HTTP POST URL. Never hard-code that URL here — it is a secret.
// ===================================================================

export default async function handler(req, res) {
  // ---- CORS / method guard ----------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const name     = (body.name     || '').toString().trim();
    const email    = (body.email    || '').toString().trim();
    const company  = (body.company  || '').toString().trim();
    const phone    = (body.phone    || '').toString().trim();
    const interest = (body.interest || '').toString().trim();
    const message  = (body.message  || '').toString().trim();

    // ---- honeypot: bots fill hidden fields; humans don't -----------
    if ((body.website || '').toString().trim() !== '') {
      return res.status(200).json({ ok: true }); // silently accept + drop
    }

    // ---- server-side validation ------------------------------------
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];
    if (!name)               errors.push('name');
    if (!emailRe.test(email)) errors.push('email');
    if (!company)            errors.push('company');
    if (!interest)           errors.push('interest');
    if (message.length < 10) errors.push('message');
    if (errors.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed', fields: errors });
    }

    // ---- forward to Power Automate ---------------------------------
    const flowUrl = process.env.POWER_AUTOMATE_URL;
    if (!flowUrl) {
      console.error('POWER_AUTOMATE_URL is not configured');
      return res.status(500).json({ ok: false, error: 'Server not configured' });
    }

    const flowRes = await fetch(flowUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, email, company, phone, interest, message,
        source: 'forgetlabs.com contact form',
        submittedAt: new Date().toISOString()
      })
    });

    if (!flowRes.ok) {
      console.error('Power Automate flow returned', flowRes.status);
      return res.status(502).json({ ok: false, error: 'Could not submit to CRM' });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('contact handler error:', err);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}
