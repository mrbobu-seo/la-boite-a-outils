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
  const [isSaved, setIsSaved] = useState(false);
  const [savedResultId, setSavedResultId] = useState<number | null>(null);

  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  const _saveScrape = async (projectId: number, resultsToSave: ScrapingResults, session: any) => {
    try {
      const { data, error } = await supabase.from('scraper_results').insert([
        {
          project_id: projectId,
          user_id: session.user.id,
          data: resultsToSave,
          query: resultsToSave.search_information.query_displayed,
          country_code: resultsToSave.search_parameters.country,
          tld: resultsToSave.search_parameters.google_domain,
          language: resultsToSave.search_parameters.hl,
        },
      ]).select('id');

      if (error) throw error;

      if(data && data.length > 0) {
        setSavedResultId(data[0].id);
      }
      setIsSaved(true);
      addLog(`Résultats sauvegardés dans le projet (ID: ${projectId})`);
      toast({ title: 'Sauvegardé', description: 'Les résultats ont été automatiquement sauvegardés dans votre projet.' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la sauvegarde';
      addLog(`Erreur de sauvegarde: ${errorMessage}`);
      toast({ title: 'Erreur de sauvegarde', description: errorMessage, variant: 'destructive' });
    }
  };

  const search = async (params: SearchParams, projectId?: number) => {
    setLogs([]); // Clear logs at the start of a new search
    setIsSaved(false);
    setSavedResultId(null);

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

      if (projectId) {
        await _saveScrape(projectId, scrapingResults, session);
      }
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

  const saveResults = async (projectId: number) => {
    if (!results) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Non connecté', description: 'Veuillez vous connecter pour sauvegarder.', variant: 'destructive' });
      return;
    }

    try {
      // If we have a savedResultId, it means we are updating an existing scrape
      if (savedResultId) {
        const { error } = await supabase
          .from('scraper_results')
          .update({ project_id: projectId })
          .eq('id', savedResultId);
        
        if (error) throw error;
        toast({ title: 'Projet mis à jour', description: 'Le projet associé à ces résultats a été mis à jour.' });
      } else { // Otherwise, we are saving a new scrape (that wasn't auto-saved)
        const { data, error } = await supabase.from('scraper_results').insert([
          {
            project_id: projectId,
            user_id: session.user.id,
            data: results,
            query: results.search_information.query_displayed,
            country_code: results.search_parameters.country,
            tld: results.search_parameters.google_domain,
            language: results.search_parameters.hl,
          },
        ]).select('id');

        if (error) throw error;
        
        if(data && data.length > 0) {
          setSavedResultId(data[0].id);
        }
        setIsSaved(true);
        toast({ title: 'Sauvegardé', description: 'Les résultats ont été sauvegardés dans votre projet.' });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde/mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    }
  };

  return { results, isLoading, search, logs, isSaved, saveResults, savedResultId };
};
