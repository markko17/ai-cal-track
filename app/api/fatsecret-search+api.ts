/**
 * Server-side proxy for FatSecret foods.search.
 * Runs on the Expo dev/prod server so only the server's public IP needs
 * to be whitelisted in the FatSecret dashboard.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();
    if (query.length < 3) {
      return Response.json({ results: [] });
    }

    const clientId = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID || '';
    const clientSecret =
      process.env.FATSECRET_CLIENT_SECRET ||
      process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET ||
      '';

    if (
      !clientId ||
      !clientSecret ||
      clientId === 'your_fatsecret_client_id_here' ||
      clientSecret === 'your_fatsecret_client_secret_here'
    ) {
      return Response.json({ error: 'not_configured', results: [] });
    }

    // Get an OAuth 2.0 access token from FatSecret
    const tokenRes = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return Response.json({ error: `token ${tokenRes.status}: ${errorText}`, results: [] });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return Response.json({ error: 'missing_access_token', results: [] });
    }

    // Search foods using the token (request originates from the server IP)
    const searchUrl = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(
      query
    )}&format=json&max_results=20`;

    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

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
    return Response.json({
      error: err?.message || 'search proxy internal error',
      results: null,
    });
  }
}
