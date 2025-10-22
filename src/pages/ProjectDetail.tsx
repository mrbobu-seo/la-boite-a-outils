import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { ScrapingResults } from '@/types/scraper';
import { Session } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import SpeedyIndexTaskResult from '@/components/SpeedyIndexTaskResult';

interface Project {
  id: number;
  name: string;
  created_at: string;
}

interface ScraperResultFromDB {
  id: number;
  user_id: string;
  data: ScrapingResults;
  query: string;
  country_code: string;
  tld: string;
  language: string;
  created_at: string;
  project_id: number;
}

interface SpeedyIndexTask {
  id: number;
  project_id: number;
  task_id: string;
  type: 'checker' | 'indexer';
  urls: string[];
  status: string;
  created_at: string;
}

interface SpeedyIndexReport {
  indexed_links: { url: string; title: string; }[];
  unindexed_links: { url: string; error_code: number; }[];
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [scraperResults, setScraperResults] = useState<ScraperResultFromDB[]>([]);
  const [speedyIndexTasks, setSpeedyIndexTasks] = useState<SpeedyIndexTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedTaskReport, setSelectedTaskReport] = useState<SpeedyIndexReport | null>(null);
  const [isFetchingReport, setIsFetchingReport] = useState(false);

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
    if (session && id) {
      const fetchProjectData = async () => {
        setLoading(true);
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) {
          console.error('Error fetching project:', projectError);
        } else {
          setProject(projectData);
        }

        const { data: scraperData, error: scraperError } = await supabase
          .from('scraper_results')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (scraperError) {
          console.error('Error fetching scraper results:', scraperError);
        } else {
          setScraperResults(scraperData as ScraperResultFromDB[]);
        }

        const { data: speedyIndexData, error: speedyIndexError } = await supabase
          .from('speedy_index_tasks')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (speedyIndexError) {
          console.error('Error fetching speedy index tasks:', speedyIndexError);
        } else {
          console.log('SpeedyIndex Tasks Data:', speedyIndexData);
          setSpeedyIndexTasks(speedyIndexData as SpeedyIndexTask[]);
        }

        setLoading(false);
      };

      fetchProjectData();
    }
  }, [id, session]);

  const handleGetReport = async (taskId: string) => {
    if (!session) return;
    setIsFetchingReport(true);
    setSelectedTaskReport(null);
    try {
      const response = await fetch('/api/speedyindex-proxy/v2/task/google/checker/fullreport', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await response.json();
      if (data.code === 0) {
        setSelectedTaskReport(data.result);
      } else {
        throw new Error(data.error || 'Failed to get report.');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsFetchingReport(false);
    }
  };

  const downloadJSON = (data: ScrapingResults, query: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    const safeQuery = query.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `results_${safeQuery}.json`;
    link.click();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!project) {
    return <div>Projet non trouvé</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md w-full">
          <h1 className="text-5xl font-bold mb-4 text-indigo-600">{project.name}</h1>
          <Tabs defaultValue="scraper" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scraper">Scraper SERP</TabsTrigger>
              <TabsTrigger value="index-checker">Index Checker & Indexation</TabsTrigger>
            </TabsList>
            <TabsContent value="scraper">
              <div className="space-y-4 mt-4">
                {scraperResults.length > 0 ? (
                  scraperResults.map(result => (
                    <div key={result.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">{result.query}</h2>
                        <Button onClick={() => downloadJSON(result.data, result.query)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                          Télécharger
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">Date: {new Date(result.created_at).toLocaleString()}</p>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-gray-900">Voir les résultats</summary>
                        <pre className="mt-2 p-4 bg-gray-200 rounded-md overflow-x-auto text-gray-800">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))
                ) : (
                  <p>Aucun résultat de scraping pour ce projet.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="index-checker">
              <div className="space-y-4 mt-4">
                {speedyIndexTasks.length > 0 ? (
                  speedyIndexTasks.map(task => (
                    <div key={task.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900">Tâche: {task.task_id}</h2>
                        {task.type === 'checker' && (
                          <Button onClick={() => handleGetReport(task.task_id)} disabled={isFetchingReport} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isFetchingReport ? 'Chargement...' : 'Voir le rapport'}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Type: {task.type === 'checker' ? 'Vérification d\'indexation' : 'Forçage d\'indexation'}</p>
                      <p className="text-sm text-gray-500">Date: {new Date(task.created_at).toLocaleString()}</p>
                      <details className="mt-4">
                        <summary className="cursor-pointer text-gray-900">Voir les URLs</summary>
                        <ul className="mt-2 list-disc list-inside">
                          {task.urls.map(url => <li key={url}>{url}</li>)}
                        </ul>
                      </details>
                    </div>
                  ))
                ) : (
                  <p>Aucune tâche de SpeedyIndex pour ce projet.</p>
                )}
                {selectedTaskReport && (
                  <div className="mt-4">
                    <SpeedyIndexTaskResult report={selectedTaskReport} />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
