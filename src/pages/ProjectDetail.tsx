import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { ScrapingResults } from '@/types/scraper';
import { Session } from '@supabase/supabase-js';

interface Project {
  id: number;
  name: string;
  created_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    };
    getSession();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      const fetchProject = async () => {
        if (id) {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error fetching project:', error);
            setLoading(false);
          } else {
            setProject(data);
          }
        }
      };

      const fetchResults = async () => {
        if (id) {
          const { data, error } = await supabase
            .from('scraper_results')
            .select('*')
            .eq('project_id', id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching results:', error);
          } else {
            setResults(data);
          }
          setLoading(false);
        }
      };

      fetchProject();
      fetchResults();
    }
  }, [id, session]);

  const downloadJSON = (data: any, query: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const safeQuery = query.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `scraper_results_${safeQuery}.json`;

    link.click();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!project) {
    return <div>Projet non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md w-full">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">{project.name}</h1>

          <div className="space-y-4">
            {results.length > 0 ? (
              results.map(result => (
                <div key={result.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">{result.query}</h2>
                    <button
                      onClick={() => downloadJSON(result.data, result.query)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Télécharger
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">Date: {new Date(result.created_at).toLocaleString()}</p>
                  <details className="mt-4">
                    <summary className="cursor-pointer">Voir les résultats</summary>
                    <pre className="mt-2 p-4 bg-gray-200 rounded-md overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))
            ) : (
              <p>Aucun résultat de scraping pour ce projet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;