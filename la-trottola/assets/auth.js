/* Supabase owns credentials, refresh tokens and PKCE verification. */
(async () => {
  'use strict';
  const page = document.body.dataset.page;
  const status = document.getElementById('status');
  const member = document.getElementById('member');
  const message = (text) => { status.textContent = text; };
  const callback = new URL('callback.html', location.href).href;
  const go = (path) => location.replace(new URL(path, location.href).href);
  const hideMember = () => {
    if (member) member.hidden = true;
    const email = document.getElementById('member-email');
    if (email) email.textContent = '';
  };
  try {
    const config = window.LA_TROTTOLA_CONFIG || {};
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl || '') ||
        !config.supabasePublishableKey || config.supabasePublishableKey.startsWith('sb_secret_')) {
      throw new Error('configuration');
    }
    const client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    // Keep this callback synchronous: awaiting auth calls here can deadlock the SDK.
    let revision = 0;
    client.auth.onAuthStateChange((event, session) => {
      revision++;
      if (page === 'member') {
        hideMember();
        if (!session) go('signin.html');
        else setTimeout(() => { verifyMember().catch(() => { hideMember(); message('Unable to verify your session. Reload to retry.'); }); }, 0);
      }
    });
    async function verifyMember() {
      const current = revision;
      hideMember();
      const { data, error } = await client.auth.getUser();
      if (current !== revision) return;
      if (error || !data.user) { go('signin.html'); return; }
      document.getElementById('member-email').textContent = data.user.email || 'Member';
      member.hidden = false;
      message('Welcome back.');
    }
    if (page === 'callback') {
      const url = new URL(location.href);
      const code = url.searchParams.get('code');
      const failed = url.searchParams.has('error') || url.hash.includes('error=');
      // Remove credentials and provider error details from browser history immediately.
      history.replaceState(null, '', location.pathname);
      if (failed || !code) { message('This sign-in link is invalid. Request a new link.'); return; }
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) { message('Sign-in could not be completed. Open a fresh link in the browser where you requested it.'); return; }
      go('member.html');
    } else if (page === 'member') {
      await verifyMember();
      document.getElementById('sign-out').addEventListener('click', async (event) => {
        event.target.disabled = true;
        hideMember();
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) { message('Sign-out failed. Reload the page to retry.'); event.target.disabled = false; }
        else go('signin.html');
      });
      // Revalidate restored pages; never show stale member UI from the back/forward cache.
      addEventListener('pagehide', hideMember);
      addEventListener('pageshow', () => { verifyMember().catch(() => { hideMember(); message('Unable to verify your session. Reload to retry.'); }); });
    } else {
      const controls = [...document.querySelectorAll('input, button')];
      const busy = (value) => controls.forEach((control) => { control.disabled = value; });
      busy(false);
      message('Choose how you’d like to sign in.');
      document.getElementById('email-form').addEventListener('submit', async (event) => {
        event.preventDefault(); busy(true);
        try {
          const { error } = await client.auth.signInWithOtp({
            email: document.getElementById('email').value.trim(),
            options: { emailRedirectTo: callback }
          });
          message(error ? 'Unable to send a link. Please wait and try again.' : 'Check your inbox for a sign-in link. Open it in this browser.');
        } catch { message('Unable to connect. Please try again.'); }
        finally { busy(false); }
      });
      document.getElementById('google').addEventListener('click', async () => {
        busy(true);
        try {
          const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback } });
          if (error) throw error;
        } catch { message('Google sign-in is unavailable. Please try again.'); busy(false); }
      });
    }
  } catch {
    hideMember();
    message('Sign-in is unavailable. Please check the site configuration or try again later.');
  }
})();
