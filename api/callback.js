// Decap CMS GitHub OAuth — Step 2: exchange code for token and post back to Decap
module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return sendResult(res, 'error', { message: 'Missing OAuth code.' });
  }

  const clientId     = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return sendResult(res, 'error', { message: 'OAuth env vars not configured on server.' });
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      const msg = data.error_description || data.error || 'Unknown GitHub OAuth error';
      return sendResult(res, 'error', { message: msg });
    }

    return sendResult(res, 'success', { token: data.access_token, provider: 'github' });

  } catch (err) {
    return sendResult(res, 'error', { message: `Server error: ${err.message}` });
  }
};

/**
 * Decap CMS listens for a postMessage in the format:
 *   "authorization:github:success:{token, provider}"
 *   "authorization:github:error:{message}"
 *
 * We open a tiny HTML page that fires the postMessage then closes itself.
 */
function sendResult(res, status, payload) {
  const msg = `authorization:github:${status}:${JSON.stringify(payload)}`;
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html><html><head><title>Authenticating...</title></head><body>
<script>
(function () {
  var msg = ${JSON.stringify(msg)};
  function send() {
    if (window.opener) {
      window.opener.postMessage(msg, '*');
      setTimeout(function () { window.close(); }, 500);
    } else {
      // fallback: try again shortly (popup may not be ready yet)
      setTimeout(send, 100);
    }
  }
  send();
})();
</script>
<p>Authenticating&hellip; you can close this window.</p>
</body></html>`);
}
