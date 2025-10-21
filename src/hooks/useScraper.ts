import { useState } from 'react';
import { SearchParams, ScrapingResults } from '@/types/scraper';
import { ScraperService } from '@/utils/scraperService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

export const useScraper = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<ScrapingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const search = async (params: SearchParams & { projectId?: number }) => {
    setLogs([]); // Clear logs at the start of a new search

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addLog('Utilisateur non connecté. Veuillez vous connecter.');
      toast({
        title: 'Non connecté',
        description: 'Veuillez vous connecter pour utiliser le scraper.',
        variant: 'destructive',
      });
      return;
    }

    const errors = ScraperService.validateSearchParams(params);
    if (errors.length > 0) {
      addLog(`Erreur de validation: ${errors.join(', ')}`);
      toast({
        title: 'Erreur de validation',
        description: errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResults(null);
    addLog('Démarrage du scraping...');

    try {
      addLog(`Recherche en cours pour: "${params.query}"`);
      toast({
        title: 'Scraping démarré',
        description: `Recherche en cours pour: "${params.query}"`,
      });

      const scrapingResults = await ScraperService.searchAndScrape(params, session, addLog);
      setResults(scrapingResults);

      addLog(`Scraping terminé: ${scrapingResults.organic_results.length} résultats trouvés.`);
      toast({
        title: 'Scraping terminé',
        description: `${scrapingResults.organic_results.length} résultats trouvés`,
      });
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors du scraping';
      addLog(`Erreur lors du scraping: ${errorMessage}`);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, search, logs };
};
