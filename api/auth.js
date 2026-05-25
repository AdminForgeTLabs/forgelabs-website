// Decap CMS GitHub OAuth — Step 1: redirect to GitHub
// https://decapcms.org/docs/github-backend/#using-an-external-oauth-client
module.exports = (req, res) => {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_GITHUB_CLIENT_ID env var is not set.');
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://forgetlabs.com'}/api/callback`,
    scope: 'repo,user',
    state: Math.random().toString(36).slice(2),
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};
