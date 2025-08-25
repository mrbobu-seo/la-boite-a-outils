import { useState } from 'react';
import { SearchParams, ScrapingResults } from '@/types/scraper';
import { ScraperService } from '@/utils/scraperService';
import { useToast } from '@/components/ui/use-toast';

interface UseScraperProps {
  hasValidApiKey: boolean;
}

export const useScraper = ({ hasValidApiKey }: UseScraperProps) => {
  const { toast } = useToast();
  const [results, setResults] = useState<ScrapingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = async (params: SearchParams) => {
    if (!hasValidApiKey) {
      toast({
        title: 'Clé API requise',
        description: 'Veuillez configurer votre clé ScraperAPI',
        variant: 'destructive',
      });
      return;
    }

    const errors = ScraperService.validateSearchParams(params);
    if (errors.length > 0) {
      toast({
        title: 'Erreur de validation',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      toast({
        title: 'Scraping démarré',
        description: `Recherche en cours pour: "${params.query}"`,
      });

      const scrapingResults = await ScraperService.searchAndScrape(params);
      setResults(scrapingResults);

      toast({
        title: 'Scraping terminé',
        description: `${scrapingResults.organic_results.length} résultats trouvés`,
      });
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors du scraping';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, search };
};
