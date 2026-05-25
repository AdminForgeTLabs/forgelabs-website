export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  const clientId     = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  let token;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    const data = await response.json();
    token = data.access_token;

    if (!token) {
      throw new Error(data.error_description || 'No access_token in response');
    }
  } catch (err) {
    const msg = JSON.stringify({ error: err.message });
    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body><script>
window.opener.postMessage('authorization:github:error:${msg}', '*');
window.close();
</script><p>Authentication error. You may close this window.</p></body></html>`);
  }

  const content = JSON.stringify({ token, provider: 'github' });
  const msg     = `authorization:github:success:${content}`;

  return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body><script>
(function() {
  var msg = ${JSON.stringify(msg)};
  var opener = window.opener;
  if (opener) {
    opener.postMessage(msg, '*');
  }
  window.close();
})();
</script><p>Authenticating...</p></body></html>`);
}
