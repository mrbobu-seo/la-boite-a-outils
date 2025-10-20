const { createClient } = require('@supabase/supabase-js');

module.exports = async function (request, response) {
  const { query } = request;
  const { url, ...rest } = query;

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

  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', user.id)
    .eq('service_name', 'ScraperAPI')
    .single();

  if (apiKeyError || !apiKeyData) {
    return response.status(404).json({ error: 'ScraperAPI key not found for this user.' });
  }

  const scraperApiKey = apiKeyData.api_key;

  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', scraperApiKey);
  scraperApiUrl.searchParams.append('url', url);

  for (const key in rest) {
    scraperApiUrl.searchParams.append(key, rest[key]);
  }

  try {
    const scraperApiResponse = await fetch(scraperApiUrl.toString(), {
      method: request.method,
      headers: {
        'User-Agent': request.headers['user-agent'] || '',
        'Accept': request.headers['accept'] || '',
      },
    });

    if (!scraperApiResponse.ok) {
      const errorText = await scraperApiResponse.text();
      return response.status(scraperApiResponse.status).json({
        error: `ScraperAPI error: ${scraperApiResponse.status} ${scraperApiResponse.statusText}`,
        details: errorText,
      });
    }

    scraperApiResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'content-encoding') {
        response.setHeader(name, value);
      }
    });

    const responseBody = await scraperApiResponse.text();
    response.send(responseBody);

  } catch (error) {
    console.error('Proxy error:', error);
    return response.status(500).json({ error: 'Internal proxy error.' });
  }
};