import url from 'url';

export default async function handler(req, res) {
  const parsed = url.parse(req.url, true);
  const code   = parsed.query.code;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  const clientId     = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    const data  = await response.json();
    const token = data.access_token;

    if (!token) throw new Error(data.error_description || 'No access_token in response');

    // Use JSON.stringify twice so the value is a safe JS string literal
    // e.g. token = gho_abc → safeToken = "\"gho_abc\""
    // Then: 'authorization:github:success:' + JSON.parse(safeToken)
    // Actually — safest approach: put values in data attributes, read from DOM
    const safeToken    = JSON.stringify(token);
    const safeProvider = JSON.stringify('github');

    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body>
<script id="d" data-token=${safeToken} data-provider=${safeProvider}></script>
<script>
(function() {
  var el  = document.getElementById('d');
  var msg = 'authorization:github:success:' + JSON.stringify({
    token:    el.dataset.token,
    provider: el.dataset.provider
  });
  if (window.opener) { window.opener.postMessage(msg, '*'); }
  window.close();
})();
<\/script>
<p>Authenticating...</p>
</body></html>`);

  } catch (err) {
    const safeErr = JSON.stringify(err.message);
    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body>
<script id="d" data-error=${safeErr}></script>
<script>
(function() {
  var el  = document.getElementById('d');
  var msg = 'authorization:github:error:' + JSON.stringify({ error: el.dataset.error });
  if (window.opener) { window.opener.postMessage(msg, '*'); }
  window.close();
})();
<\/script>
<p>Authentication error.</p>
</body></html>`);
  }
}
