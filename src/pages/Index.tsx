import { useState, useEffect } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ScraperService } from '@/utils/scraperService';
import { useScraper } from '@/hooks/useScraper';
import heroImage from '@/assets/hero-scraper.jpg';
import { Bot, Zap, Globe, Download } from 'lucide-react';

const Index = () => {
  const [hasValidApiKey, setHasValidApiKey] = useState(false);
  const { results, isLoading, search } = useScraper({ hasValidApiKey });

  useEffect(() => {
    setHasValidApiKey(ScraperService.hasValidApiKey());
  }, []);

  const handleApiKeySet = (apiKey: string) => {
    setHasValidApiKey(!!apiKey);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/70" />
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Bot className="h-16 w-16 text-primary animate-pulse-slow" />
            </div>
            
            <h1 className="text-6xl font-bold mb-6 gradient-text">
              La boite à outil
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              La boite à outil - Analysez et extrayez des données de millions de pages web avec notre outil de scraping intelligent. 
              Recherchez, analysez et exportez en quelques clics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="glass-card p-6 text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Rapide & Efficace</h3>
                <p className="text-sm text-muted-foreground">
                  Scraping haute performance avec analyse automatique
                </p>
              </div>
              
              <div className="glass-card p-6 text-center">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Multi-langues</h3>
                <p className="text-sm text-muted-foreground">
                  Support pour tous les pays et langues
                </p>
              </div>
              
              <div className="glass-card p-6 text-center">
                <Download className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Export facile</h3>
                <p className="text-sm text-muted-foreground">
                  Téléchargez vos résultats au format JSON
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <ApiKeyManager onApiKeySet={handleApiKeySet} hasValidKey={hasValidApiKey} />
          {hasValidApiKey && <SearchForm onSearch={search} isLoading={isLoading} />}
          <ResultsDisplay results={results} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            La boite à outil - Outil de scraping intelligent pour l'analyse web
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
