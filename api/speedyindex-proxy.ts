const { createClient } = require('@supabase/supabase-js');

module.exports = async function (request, response) {
  const allowedMethods = ['GET', 'POST'];
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

  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', user.id)
    .eq('service_name', 'SpeedyIndex')
    .single();

  if (apiKeyError || !apiKeyData) {
    return response.status(404).json({ error: 'SpeedyIndex API key not found for this user.' });
  }

  const speedyIndexApiKey = apiKeyData.api_key;

  const targetPath = request.url.replace('/api/speedyindex-proxy', '');
  const speedyIndexApiUrl = `https://api.speedyindex.com${targetPath}`;

  const headers = {
    'Authorization': speedyIndexApiKey,
    'Content-Type': request.headers['content-type'] || 'application/json',
    'Accept': 'application/json',
    'User-Agent': request.headers['user-agent'] || 'Vercel-Proxy',
  };

  delete headers['host'];
  delete headers['connection'];

  try {
    const bodyToForward = request.method === 'POST' ? JSON.stringify(request.body) : undefined;

    const speedyIndexApiResponse = await fetch(speedyIndexApiUrl, {
      method: request.method,
      headers: headers,
      body: bodyToForward,
    });

    if (!speedyIndexApiResponse.ok) {
      const errorDetails = await speedyIndexApiResponse.text();
      return response.status(speedyIndexApiResponse.status).json({
        error: `SpeedyIndex API error: ${speedyIndexApiResponse.statusText}`,
        details: errorDetails,
      });
    }

    speedyIndexApiResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'content-encoding') {
        response.setHeader(name, value);
      }
    });

    const responseBody = await speedyIndexApiResponse.json();
    response.status(speedyIndexApiResponse.status).json(responseBody);

  } catch (error) {
    console.error('Proxy function execution error:', error);
    return response.status(500).json({ error: 'Internal proxy error.' });
  }
};
