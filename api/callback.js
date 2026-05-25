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

    // content is the raw JSON string Decap expects after the colon
    const content = JSON.stringify({ token, provider: 'github' });

    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body><script>
(function() {
  var msg = "authorization:github:success:${content}";
  if (window.opener) { window.opener.postMessage(msg, "*"); }
  window.close();
})();
<\/script><p>Authenticating...</p></body></html>`);

  } catch (err) {
    const errContent = JSON.stringify({ error: err.message });
    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body><script>
(function() {
  var msg = "authorization:github:error:${errContent}";
  if (window.opener) { window.opener.postMessage(msg, "*"); }
  window.close();
})();
<\/script><p>Authentication error.</p></body></html>`);
  }
}
