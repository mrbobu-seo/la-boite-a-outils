
  const { query } = request;
  const { api_key, url, ...rest } = query;

  // Security: Check for API key presence in environment variables
  const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;
  if (!SCRAPERAPI_KEY) {
    return response.status(500).json({ error: 'Server API key not configured.' });
  }

  // Security: Basic origin check (optional but recommended)
  // In a real application, you might want to restrict this to your frontend domain
  // const origin = request.headers.origin;
  // if (origin && !origin.includes('your-github-pages-domain.com')) {
  //   return response.status(403).json({ error: 'Forbidden origin.' });
  // }

  // Construct ScraperAPI URL
  const scraperApiUrl = new URL('https://api.scraperapi.com/');
  scraperApiUrl.searchParams.append('api_key', SCRAPERAPI_KEY);
  scraperApiUrl.searchParams.append('url', url);

  // Add other query parameters
  for (const key in rest) {
    scraperApiUrl.searchParams.append(key, rest[key]);
  }

  try {
    const scraperApiResponse = await fetch(scraperApiUrl.toString(), {
      method: request.method,
      headers: {
        'User-Agent': request.headers['user-agent'] || '',
        'Accept': request.headers['accept'] || '',
        // Add other headers as needed, but be careful not to expose sensitive info
      },
    });

    if (!scraperApiResponse.ok) {
      const errorText = await scraperApiResponse.text();
      return response.status(scraperApiResponse.status).json({
        error: `ScraperAPI error: ${scraperApiResponse.status} ${scraperApiResponse.statusText}`,
        details: errorText,
      });
    }

    // Forward headers from ScraperAPI response
    scraperApiResponse.headers.forEach((value, name) => {
      response.setHeader(name, value);
    });

    // Stream the response body
    scraperApiResponse.body?.pipeTo(response.writable);

  } catch (error) {
    console.error('Proxy error:', error);
    return response.status(500).json({ error: 'Internal proxy error.' });
  }
}
