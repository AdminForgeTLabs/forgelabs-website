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

    const safeToken = JSON.stringify(token);

    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body><script>
(function() {
  var token = ${safeToken};
  var provider = 'github';

  function sendMsg(msg) {
    if (window.opener) {
      window.opener.postMessage(msg, '*');
    }
  }

  // Step 1: send handshake
  sendMsg('authorizing:' + provider);

  // Step 2: wait for Decap to echo back, then send the token
  window.addEventListener('message', function handler(e) {
    if (e.data === 'authorizing:' + provider) {
      window.removeEventListener('message', handler);
      // Step 3: send the token
      sendMsg('authorization:' + provider + ':success:' + JSON.stringify({ token: token, provider: provider }));
      setTimeout(function() { window.close(); }, 500);
    }
  });

  // Fallback: if no echo in 5s, try sending anyway
  setTimeout(function() {
    sendMsg('authorization:' + provider + ':success:' + JSON.stringify({ token: token, provider: provider }));
    setTimeout(function() { window.close(); }, 500);
  }, 5000);
})();
<\/script><p>Authenticating...</p></body></html>`);

  } catch (err) {
    const safeErr = JSON.stringify(err.message);
    return res.setHeader('Content-Type', 'text/html').status(200).send(`<!DOCTYPE html>
<html><body><script>
(function() {
  if (window.opener) {
    window.opener.postMessage('authorization:github:error:' + JSON.stringify({ error: ${safeErr} }), '*');
  }
  setTimeout(function() { window.close(); }, 500);
})();
<\/script><p>Authentication error.</p></body></html>`);
  }
}
