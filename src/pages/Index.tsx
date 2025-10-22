import { useState, useEffect } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import IndexCheckerTool from '@/components/IndexCheckerTool';
import { useScraper } from '@/hooks/useScraper';
import { ScraperApiKeyManager } from '@/components/ScraperApiKeyManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import ScraperLogsDisplay from '@/components/ScraperLogsDisplay';

import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface Project {
  id: number;
  name: string;
}

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const { results, isLoading, search, logs } = useScraper();
  const [scraperApiHasValidKey, setScraperApiHasValidKey] = useState(false);

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

  const handleScraperApiKeySet = (apiKey: string) => {
    setScraperApiHasValidKey(!!apiKey && apiKey.trim().length > 0);
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scraper">Scraper SERP</TabsTrigger>
              <TabsTrigger value="index-checker">Index Checker & Indexation</TabsTrigger>
            </TabsList>
            <TabsContent value="scraper">
              <div className="space-y-12">
                <ScraperApiKeyManager onApiKeySet={handleScraperApiKeySet} hasValidKey={scraperApiHasValidKey} />
                {scraperApiHasValidKey && <SearchForm onSearch={search} isLoading={isLoading} projects={projects} />}
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
              <IndexCheckerTool projects={projects} />
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
          <p className="text-muted-foreground text-sm mt-2">Vibe Codé avec <a href="https://twitter.com/MisteurBobu" target="_blank" rel="noopener noreferrer" className="hover:underline">❤️</a></p>
        </div>
      </footer>
    </div>
  );
};

export default Index;