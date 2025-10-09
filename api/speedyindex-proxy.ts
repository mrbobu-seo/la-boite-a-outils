// api/speedyindex-proxy.ts
// This function acts as a secure proxy for SpeedyIndex API calls.
// It protects your API key by keeping it on the server-side.

// Using CommonJS syntax for Vercel Serverless Functions
module.exports = async function (request, response) {
  // Ensure the request method is valid
  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(request.method)) {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get SpeedyIndex API Key from request header or environment variables
  const headerApiKey = (() => {
    const incomingKey = request.headers['authorization'] || request.headers['x-speedyindex-api-key'];
    if (Array.isArray(incomingKey)) {
      return incomingKey.find((value) => !!value?.trim()) || null;
    }
    return typeof incomingKey === 'string' && incomingKey.trim().length > 0 ? incomingKey.trim() : null;
  })();

  const SPEEDYINDEX_API_KEY = headerApiKey || process.env.SPEEDYINDEX_API_KEY;
  if (!SPEEDYINDEX_API_KEY) {
    console.error('SPEEDYINDEX_API_KEY is not configured in environment variables or request headers.');
    return response.status(401).json({ error: 'API key manquante pour SpeedyIndex.' });
  }

  // Extract the target path from the request URL (e.g., /v2/account, /v2/task/google/indexer/create)
  // The path will be everything after /api/speedyindex-proxy
  const targetPath = request.url.replace('/api/speedyindex-proxy', '');

  // Construct the full SpeedyIndex API URL
  const speedyIndexApiUrl = `https://api.speedyindex.com${targetPath}`;

  // Prepare headers for the request to SpeedyIndex
  const headers = {
    'Authorization': SPEEDYINDEX_API_KEY,
    'Content-Type': request.headers['content-type'] || 'application/json', // Forward content-type
    'Accept': 'application/json', // Always request JSON response
    'User-Agent': request.headers['user-agent'] || 'Vercel-Proxy',
  };

  // Remove host and connection headers that might cause issues
  delete headers['host'];
  delete headers['connection'];

  try {
    // Forward the request to SpeedyIndex API
    const bodyToForward = (() => {
      if (request.method !== 'POST') {
        return undefined;
      }

      if (typeof request.body === 'string') {
        return request.body;
      }

      if (request.body && Object.keys(request.body).length > 0) {
        return JSON.stringify(request.body);
      }

      return undefined;
    })();

    const speedyIndexApiResponse = await fetch(speedyIndexApiUrl, {
      method: request.method,
      headers: headers,
      body: bodyToForward,
    });

    // Check if the response from SpeedyIndex is OK
    if (!speedyIndexApiResponse.ok) {
      const errorDetails = await speedyIndexApiResponse.text();
      console.error(`SpeedyIndex API error: ${speedyIndexApiResponse.status} - ${errorDetails}`);
      return response.status(speedyIndexApiResponse.status).json({
        error: `SpeedyIndex API error: ${speedyIndexApiResponse.statusText}`,
        details: errorDetails,
      });
    }

    // Forward all headers from SpeedyIndex response to the client, excluding Content-Encoding
    speedyIndexApiResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'content-encoding') {
        response.setHeader(name, value);
      }
    });

    // Send the response body back to the client
    const responseBody = await speedyIndexApiResponse.json(); // Assume JSON response from SpeedyIndex
    response.status(speedyIndexApiResponse.status).json(responseBody);

  } catch (error) {
    console.error('Proxy function execution error:', error);
    return response.status(500).json({ error: 'Internal proxy error.' });
  }
};
