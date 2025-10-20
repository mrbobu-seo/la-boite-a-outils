import { createClient } from '@supabase/supabase-js';

export default async function (request, response) {
  console.log('SpeedyIndex proxy function started.');

  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const authHeader = request.headers.authorization;
  console.log('Authorization header:', authHeader);
  if (!authHeader) {
    return response.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError) {
    console.error('getUser error:', userError);
    return response.status(401).json({ error: 'Invalid token' });
  }
  if (!user) {
    console.error('No user found for token.');
    return response.status(401).json({ error: 'Invalid token' });
  }
  console.log('User found:', user.id);

  const { data: apiKeyData, error: apiKeyError } = await supabase
    .from('api_keys')
    .select('api_key')
    .eq('user_id', user.id)
    .eq('service_name', 'SpeedyIndex')
    .single();

  if (apiKeyError) {
    console.error('apiKeyError:', apiKeyError);
    return response.status(404).json({ error: 'SpeedyIndex API key not found for this user.' });
  }
  if (!apiKeyData) {
    console.error('No API key data found.');
    return response.status(404).json({ error: 'SpeedyIndex API key not found for this user.' });
  }
  console.log('API key data found.');

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
    console.log('Fetching from SpeedyIndex...');
    const bodyToForward = request.method === 'POST' ? JSON.stringify(request.body) : undefined;

    const speedyIndexApiResponse = await fetch(speedyIndexApiUrl, {
      method: request.method,
      headers: headers,
      body: bodyToForward,
    });

    if (!speedyIndexApiResponse.ok) {
      const errorDetails = await speedyIndexApiResponse.text();
      console.error('SpeedyIndex API error:', errorDetails);
      return response.status(speedyIndexApiResponse.status).json({
        error: `SpeedyIndex API error: ${speedyIndexApiResponse.statusText}`,
        details: errorDetails,
      });
    }

    console.log('SpeedyIndex request successful.');
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