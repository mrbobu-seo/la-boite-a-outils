import { createClient } from '@supabase/supabase-js';

export default async function (request, response) {
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const allowedMethods = ['GET'];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return response.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return response.status(401).json({ error: 'Invalid token' });
  }

  let scraperApiKey;
  const keyToTest = request.headers['x-scraperapi-key-to-test'];

  if (keyToTest) {
    scraperApiKey = keyToTest;
  } else {
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('service_name', 'ScraperAPI')
      .single();

    if (apiKeyError || !apiKeyData) {
      return response.status(404).json({ error: 'ScraperAPI key not found for this user.' });
    }
    scraperApiKey = apiKeyData.api_key;
  }

  const targetPath = request.url.replace('/api/scraperapi-proxy', '');
  const scraperApiUrl = new URL(`https://api.scraperapi.com${targetPath}`);
  scraperApiUrl.searchParams.append('api_key', scraperApiKey);

  try {
    const scraperApiResponse = await fetch(scraperApiUrl.toString(), {
      method: request.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': request.headers['user-agent'] || 'Vercel-Proxy',
      },
    });

    if (!scraperApiResponse.ok) {
      const errorDetails = await scraperApiResponse.text();
      try {
        const errorJson = JSON.parse(errorDetails);
        return response.status(scraperApiResponse.status).json(errorJson);
      } catch (e) {
        return response.status(scraperApiResponse.status).send(errorDetails);
      }
    }

    const responseBody = await scraperApiResponse.json();
    response.status(scraperApiResponse.status).json(responseBody);

  } catch (error) {
    console.error('Proxy function execution error:', error);
    return response.status(500).json({ error: 'Internal proxy error.' });
  }
};
