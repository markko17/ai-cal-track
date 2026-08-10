export async function GET() {
  try {
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
      return Response.json(
        { error: 'FatSecret credentials not configured on server' },
        { status: 500 }
      );
    }

    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

    const response = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      body: 'grant_type=client_credentials&scope=basic',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `FatSecret token request failed with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'FatSecret proxy internal error' },
      { status: 500 }
    );
  }
}
