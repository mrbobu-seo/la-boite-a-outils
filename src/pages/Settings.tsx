import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const Settings = () => {
  const [scraperApiKey, setScraperApiKey] = useState('');
  const [speedyIndexApiKey, setSpeedyIndexApiKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApiKeys = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('api_keys')
          .select('service_name, api_key')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching API keys:', error);
        } else {
          data.forEach(item => {
            if (item.service_name === 'ScraperAPI') {
              setScraperApiKey(item.api_key);
            }
            if (item.service_name === 'SpeedyIndex') {
              setSpeedyIndexApiKey(item.api_key);
            }
          });
        }
      }
    };

    fetchApiKeys();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('api_keys').upsert([
        { user_id: user.id, service_name: 'ScraperAPI', api_key: scraperApiKey },
        { user_id: user.id, service_name: 'SpeedyIndex', api_key: speedyIndexApiKey },
      ]);

      if (error) {
        alert(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Settings</h1>
      <form className="max-w-lg mx-auto" onSubmit={handleSave}>
        <div className="mb-4">
          <label className="block mb-2">ScraperAPI Key</label>
          <input
            type="text"
            value={scraperApiKey}
            onChange={(e) => setScraperApiKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-black"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">SpeedyIndex API Key</label>
          <input
            type="text"
            value={speedyIndexApiKey}
            onChange={(e) => setSpeedyIndexApiKey(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-black"
          />
        </div>
        <button type="submit" disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
