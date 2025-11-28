import { useState, useEffect } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import IndexCheckerTool from '@/components/IndexCheckerTool';
import { useScraper } from '@/hooks/useScraper';
import { ScraperApiKeyManager } from '@/components/ScraperApiKeyManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ScraperLogsDisplay from '@/components/ScraperLogsDisplay';
import { Button } from '@/components/ui/button';

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: number;
  name: string;
}

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const { results, isLoading, search, logs, isSaved, saveResults } = useScraper();
  const [scraperApiHasValidKey, setScraperApiHasValidKey] = useState(false);
  const [speedyIndexHasValidKey, setSpeedyIndexHasValidKey] = useState(false);
  const [ralfyIndexHasValidKey, setRalfyIndexHasValidKey] = useState(false);
  const [scraperProjectId, setScraperProjectId] = useState<number | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const savedScraperKey = localStorage.getItem('scraperapi_key');
    if (savedScraperKey) {
      setScraperApiHasValidKey(true);
    }

    const savedSpeedyIndexKey = localStorage.getItem('speedyindex_key');
    if (savedSpeedyIndexKey) {
      setSpeedyIndexHasValidKey(true);
    }

    const savedRalfyIndexKey = localStorage.getItem('ralfyindex_key');
    if (savedRalfyIndexKey) {
      setRalfyIndexHasValidKey(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (session) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data);
        }
      }
    };

    fetchProjects();
  }, [session]);

  useEffect(() => {
    console.log('scraperProjectId changed:', scraperProjectId);
  }, [scraperProjectId]);

  const handleScraperApiKeySet = (apiKey: string) => {
    setScraperApiHasValidKey(!!apiKey && apiKey.trim().length > 0);
  };

  const handleSpeedyIndexApiKeySet = (apiKey: string) => {
    setSpeedyIndexHasValidKey(!!apiKey && apiKey.trim().length > 0);
  };

  const handleRalfyIndexApiKeySet = (apiKey: string) => {
    setRalfyIndexHasValidKey(!!apiKey && apiKey.trim().length > 0);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [newProject, ...prevProjects]);
    setScraperProjectId(newProject.id);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-bold mb-4 text-indigo-600">
          La boite à outils
        </h1>
        <p className="text-xl text-black mb-8 max-w-3xl mx-auto">
          Votre suite d'outils intelligents pour l'analyse et l'extraction de données web.
        </p>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {session ? (
          <Tabs defaultValue="scraper" className="w-full max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scraper">Scraper SERP</TabsTrigger>
              <TabsTrigger value="index-checker">Index Checker & Indexation</TabsTrigger>
              <TabsTrigger value="content-briefs">Briefs de contenu</TabsTrigger>
            </TabsList>
            <TabsContent value="scraper">
              <div className="space-y-12">
                <ScraperApiKeyManager onApiKeySet={handleScraperApiKeySet} hasValidKey={scraperApiHasValidKey} />
                {scraperApiHasValidKey && <SearchForm onSearch={search} isLoading={isLoading} projects={projects} projectId={scraperProjectId} onProjectIdChange={setScraperProjectId} onProjectCreated={handleProjectCreated} results={results} onSave={saveResults} />}
                {results && (
                  <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
                    <ResultsDisplay results={results} />
                  </Card>
                )}
                {logs.length > 0 && (
                  <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
                    <ScraperLogsDisplay logs={logs} />
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="index-checker">
              <IndexCheckerTool
                projects={projects}
                onSpeedyIndexApiKeySet={handleSpeedyIndexApiKeySet}
                hasSpeedyIndexValidKey={speedyIndexHasValidKey}
                onRalfyIndexApiKeySet={handleRalfyIndexApiKeySet}
                hasRalfyIndexValidKey={ralfyIndexHasValidKey}
                onProjectCreated={handleProjectCreated}
              />
            </TabsContent>
            <TabsContent value="content-briefs">
              <p>Built en cours</p>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center">
            <p className="text-lg">Veuillez vous connecter pour utiliser les outils.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            La boite à outils - Outils de scraping intelligents pour l'analyse web
          </p>

        </div>
      </footer>
    </div>
  );
};

export default Index;