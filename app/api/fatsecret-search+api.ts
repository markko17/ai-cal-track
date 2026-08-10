/**
 * Server-side proxy for FatSecret foods.search.
 * Runs on the Expo dev/prod server so only the server's public IP needs
 * to be whitelisted in the FatSecret dashboard.
 */
interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in ms
}

let tokenCache: CachedToken | null = null;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    if (query.length < 3) {
      return Response.json({ results: [] });
    }

    const clientId = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || '';
    const clientSecret = process.env.FATSECRET_CLIENT_SECRET || '';

    if (
      !clientId ||
      !clientSecret ||
      clientId === 'your_fatsecret_client_id_here' ||
      clientSecret === 'your_fatsecret_client_secret_here'
    ) {
      return Response.json({ error: 'not_configured', results: [] });
    }

    let accessToken = tokenCache && tokenCache.expiresAt > Date.now() + 60000 ? tokenCache.accessToken : null;

    if (!accessToken) {
      // Get an OAuth 2.0 access token from FatSecret with 10s abort timeout
      const tokenController = new AbortController();
      const tokenTimeout = setTimeout(() => tokenController.abort(), 10000);

      try {
        const tokenRes = await fetch('https://oauth.fatsecret.com/connect/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials&scope=basic',
          signal: tokenController.signal,
        });

        clearTimeout(tokenTimeout);

        if (!tokenRes.ok) {
          const errorText = await tokenRes.text();
          return Response.json({ error: `token ${tokenRes.status}: ${errorText}`, results: [] });
        }

        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
        const expiresIn = typeof tokenData.expires_in === 'number' ? tokenData.expires_in : 86400;

        if (!accessToken) {
          return Response.json({ error: 'missing_access_token', results: [] });
        }

        tokenCache = {
          accessToken,
          expiresAt: Date.now() + expiresIn * 1000,
        };
      } catch (err: any) {
        clearTimeout(tokenTimeout);
        return Response.json({ error: `token fetch failed: ${err?.message || err}`, results: [] });
      }
    }

    // Search foods using the token with 10s abort timeout
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 10000);

    try {
      const searchUrl = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
        query
      )}&format=json&max_results=20`;

      const searchRes = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        signal: searchController.signal,
      });

      clearTimeout(searchTimeout);

      if (!searchRes.ok) {
        return Response.json({ error: `search ${searchRes.status}`, results: [] });
      }

      const data = await searchRes.json();

      if (data && data.error) {
        return Response.json({
          error: `api ${data.error.code}: ${data.error.message}`,
          results: null,
        });
      }

      const foods = data?.foods?.food;
      const foodArray = Array.isArray(foods) ? foods : foods ? [foods] : [];
      return Response.json({ results: foodArray, error: null });
    } catch (err: any) {
      clearTimeout(searchTimeout);
      return Response.json({
        error: err?.message || 'search proxy internal error',
        results: null,
      });
    }
  } catch (err: any) {
    return Response.json({
      error: err?.message || 'search proxy internal error',
      results: null,
    });
  }
}
