import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (request: VercelRequest, response: VercelResponse) {
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const allowedMethods = ['POST'];
    if (!allowedMethods.includes(request.method)) {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const authHeader = request.headers.authorization;
    if (!authHeader) {
        return response.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
        return response.status(401).json({ error: 'Invalid token' });
    }

    let ralfyIndexApiKey;
    const keyToTest = request.headers['x-ralfyindex-key-to-test'];

    if (keyToTest) {
        // This is a key validation request
        ralfyIndexApiKey = keyToTest;
    } else {
        // For other requests, fetch the key from the database
        const { data: apiKeyData, error: apiKeyError } = await supabase
            .from('api_keys')
            .select('api_key')
            .eq('user_id', user.id)
            .eq('service_name', 'RalfyIndex')
            .single();

        if (apiKeyError || !apiKeyData) {
            return response.status(404).json({ error: 'RalfyIndex API key not found for this user.' });
        }
        ralfyIndexApiKey = apiKeyData.api_key;
    }

    // Extract endpoint from URL path
    const targetPath = request.url.replace('/api/ralfyindex-proxy', '');
    const ralfyIndexApiUrl = `https://api.ralfyindex.com${targetPath}`;

    try {
        // Prepare request body with API key
        const bodyToForward = {
            apikey: ralfyIndexApiKey,
            ...request.body
        };

        const ralfyIndexApiResponse = await fetch(ralfyIndexApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(bodyToForward),
        });

        if (!ralfyIndexApiResponse.ok) {
            const errorDetails = await ralfyIndexApiResponse.text();
            try {
                const errorJson = JSON.parse(errorDetails);
                return response.status(ralfyIndexApiResponse.status).json(errorJson);
            } catch (e) {
                return response.status(ralfyIndexApiResponse.status).send(errorDetails);
            }
        }

        const responseBody = await ralfyIndexApiResponse.json();
        response.status(ralfyIndexApiResponse.status).json(responseBody);

    } catch (error) {
        console.error('RalfyIndex proxy function execution error:', error);
        return response.status(500).json({ error: 'Internal proxy error.' });
    }
};
