import { useState, useEffect } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import IndexCheckerTool from '@/components/IndexCheckerTool';
import { ScraperService } from '@/utils/scraperService';
import { useScraper } from '@/hooks/useScraper';
import heroImage from '@/assets/hero-scraper.jpg';
import { Bot, Zap, Globe, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScraperLogsDisplay from '@/components/ScraperLogsDisplay';

const Index = () => {
  const [hasValidApiKey, setHasValidApiKey] = useState(false);
  const { results, isLoading, search, logs } = useScraper({ hasValidApiKey });

  useEffect(() => {
    setHasValidApiKey(ScraperService.hasValidApiKey());
  }, []);

  const handleApiKeySet = (apiKey: string) => {
    setHasValidApiKey(!!apiKey);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-5xl font-bold mb-4 gradient-text">
          La boite à outils
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Votre suite d'outils intelligents pour l'analyse et l'extraction de données web.
        </p>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <Tabs defaultValue="scraper" className="w-full max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scraper">Scraper SEO</TabsTrigger>
            <TabsTrigger value="index-checker">Index Checker & Indexation</TabsTrigger>
          </TabsList>
          <TabsContent value="scraper">
            <div className="space-y-12">
              <ApiKeyManager onApiKeySet={handleApiKeySet} hasValidKey={hasValidApiKey} />
              {hasValidApiKey && <SearchForm onSearch={search} isLoading={isLoading} />}
              <ResultsDisplay results={results} />
              <ScraperLogsDisplay logs={logs} />
            </div>
          </TabsContent>
          <TabsContent value="index-checker">
            <IndexCheckerTool />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            La boite à outils - Outils de scraping intelligents pour l'analyse web
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Développé avec ❤️ par <a href="https://x.com/MisteurBobu" target="_blank" rel="noopener noreferrer" className="hover:underline">@MisteurBobu</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
