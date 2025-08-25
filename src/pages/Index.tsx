import { useState } from 'react';
import { SearchForm } from '@/components/SearchForm';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { SearchParams, ScrapingResults } from '@/types/scraper';
import { ScraperService } from '@/utils/scraperService';
import { useToast } from '@/components/ui/use-toast';
import heroImage from '@/assets/hero-scraper.jpg';
import { Bot, Zap, Globe, Download } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<ScrapingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (params: SearchParams) => {
    const errors = ScraperService.validateSearchParams(params);
    
    if (errors.length > 0) {
      toast({
        title: "Erreur de validation",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      toast({
        title: "Scraping démarré",
        description: `Recherche en cours pour: "${params.query}"`,
      });

      const scrapingResults = await ScraperService.searchAndScrape(params);
      setResults(scrapingResults);

      toast({
        title: "Scraping terminé",
        description: `${scrapingResults.organic_results.length} résultats trouvés`,
      });
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du scraping",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              Web Scraper Pro
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Analysez et extrayez des données de millions de pages web avec notre outil de scraping intelligent. 
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
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          <ResultsDisplay results={results} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Web Scraper Pro - Outil de scraping intelligent pour l'analyse web
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
