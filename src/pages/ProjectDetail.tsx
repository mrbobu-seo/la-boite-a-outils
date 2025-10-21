import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { ScrapingResults } from '@/types/scraper';

interface Project {
  id: number;
  name: string;
  created_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [results, setResults] = useState<ScrapingResults[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching project:', error);
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
      }
    };

    fetchProject();
    fetchResults();
  }, [id]);

  if (!project) {
    return <div>Chargement...</div>;
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
                  <h2 className="text-xl font-semibold text-gray-900">{result.query}</h2>
                  <p className="text-sm text-gray-500">Date: {new Date(result.created_at).toLocaleString()}</p>
                  {/* Here you would display the actual scraper results */}
                  <pre className="mt-4 p-4 bg-gray-200 rounded-md overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
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
