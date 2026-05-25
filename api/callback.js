// Decap CMS GitHub OAuth - Step 2: exchange code for token
export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return sendResult(res, 'error', { message: 'Missing OAuth code.' });

  const clientId     = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return sendResult(res, 'error', { message: 'OAuth env vars not configured.' });
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await tokenRes.json();
    if (data.error || !data.access_token) {
      return sendResult(res, 'error', { message: data.error_description || data.error || 'Unknown error' });
    }
    return sendResult(res, 'success', { token: data.access_token, provider: 'github' });
  } catch (err) {
    return sendResult(res, 'error', { message: 'Server error: ' + err.message });
  }
}

function sendResult(res, status, payload) {
  const msg = 'authorization:github:' + status + ':' + JSON.stringify(payload);
  res.setHeader('Content-Type', 'text/html');
  res.send('<!doctype html><html><body><script>(function(){var m=' + JSON.stringify(msg) + ';function s(){if(window.opener){window.opener.postMessage(m,"*");setTimeout(function(){window.close();},500);}else{setTimeout(s,100);}}s();})();<' + '/script><p>Authenticating...</p></body></html>');
}
