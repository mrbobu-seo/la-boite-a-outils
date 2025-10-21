import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Key } from 'lucide-react';

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
      const { error } = await supabase.from('api_keys').upsert(
        [
          { user_id: user.id, service_name: 'ScraperAPI', api_key: scraperApiKey },
          { user_id: user.id, service_name: 'SpeedyIndex', api_key: speedyIndexApiKey },
        ],
        { onConflict: 'user_id, service_name' }
      );

      if (error) {
        alert(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">Paramètres</h1>
        <form className="space-y-6" onSubmit={handleSave}>
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Key className="h-4 w-4 text-indigo-600" />
              Clé API ScraperAPI
            </label>
            <input
              type="text"
              value={scraperApiKey}
              onChange={(e) => setScraperApiKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Key className="h-4 w-4 text-indigo-600" />
              Clé API SpeedyIndex
            </label>
            <input
              type="text"
              value={speedyIndexApiKey}
              onChange={(e) => setSpeedyIndexApiKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
