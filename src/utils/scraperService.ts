import { SearchParams, ScrapingResults, SearchResult, ScrapedPageInfo } from '@/types/scraper';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Service pour le scraping réel avec ScraperAPI
export class ScraperService {
  private static readonly API_BASE_URL = '/api/proxy';

  // Effectuer une recherche Google via ScraperAPI
  static async searchGoogle(params: SearchParams, accessToken: string, progressCallback: (message: string) => void): Promise<string> {
    const googleUrl = `https://www.google.${params.tld}/search?q=${encodeURIComponent(params.query)}&hl=${params.language}&gl=${params.countryCode}`;
    const scraperUrl = `${this.API_BASE_URL}?url=${encodeURIComponent(googleUrl)}&render=false`;

    progressCallback(`Scraping Google SERP: ${googleUrl}`);

    const response = await fetch(scraperUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API ScraperAPI: ${response.status}`);
    }

    return await response.text();
  }

  // Scraper une page web individuelle
  static async scrapePage(url: string, accessToken: string, progressCallback: (message: string) => void): Promise<ScrapedPageInfo | null> {
    try {
      progressCallback(`Scraping page: ${url}`);
      const scraperUrl = `${this.API_BASE_URL}?url=${encodeURIComponent(url)}&render=false`;

      const response = await fetch(scraperUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!response.ok) {
        console.error(`Erreur scraping ${url}: ${response.status}`);
        return null;
      }

      const html = await response.text();
      return this.parsePageContent(html, url);
    } catch (error) {
      console.error(`Erreur lors du scraping de ${url}:`, error);
      return null;
    }
  }

  // Parser le contenu HTML d'une page
  private static parsePageContent(html: string, url: string): ScrapedPageInfo {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extraire le titre
    const titleElement = doc.querySelector('title');
    const title = titleElement ? titleElement.textContent?.trim() || 'N/A' : 'N/A';

    // Extraire la meta description
    const metaDesc = doc.querySelector('meta[name="description"]');
    const meta_description = metaDesc ? metaDesc.getAttribute('content')?.trim() || 'N/A' : 'N/A';

    // Extraire les headings
    const headings: Array<{tag: string, text: string}> = [];
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach(element => {
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
          headings.push({ tag, text });
        }
      });
    });

    return { title, meta_description, headings };
  }

  // Parser les résultats de recherche Google
  private static parseGoogleResults(html: string): Array<{url: string, title: string}> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results: Array<{url: string, title: string}> = [];

    // Sélecteurs pour les résultats organiques Google
    const resultSelectors = [
      'div.yuRUbf a',           // Sélecteur principal
      'div.g a[href*="http"]',  // Sélecteur alternatif
      'h3 a[href*="http"]'      // Sélecteur de fallback
    ];

    for (const selector of resultSelectors) {
      const links = doc.querySelectorAll(selector);
      
      links.forEach((link) => {
        const href = link.getAttribute('href');
        const titleElement = link.querySelector('h3') || link;
        const title = titleElement.textContent?.trim();

        if (href && title && href.startsWith('http') && !href.includes('google.') && !href.includes('youtube.com')) {
          // Éviter les doublons
          if (!results.find(r => r.url === href)) {
            results.push({ url: href, title });
          }
        }
      });

      // Si on a trouvé des résultats, pas besoin d'essayer les autres sélecteurs
      if (results.length > 0) break;
    }

    return results.slice(0, 10); // Limiter à 10 résultats
  }

  // Effectuer une recherche complète avec scraping des pages
  static async searchAndScrape(params: SearchParams & { projectId?: number }, session: Session, progressCallback: (message: string) => void): Promise<ScrapingResults> {

    progressCallback(`Démarrage du scraping pour: ${params.query}`);

    // 1. Scraper la SERP Google
    const googleHtml = await this.searchGoogle(params, session.access_token, progressCallback);
    const searchResults = this.parseGoogleResults(googleHtml);

    if (searchResults.length === 0) {
      throw new Error('Aucun résultat trouvé dans la SERP');
    }

    progressCallback(`${searchResults.length} résultats trouvés dans la SERP`);

    // 2. Scraper chaque page individuellement
    const results: SearchResult[] = [];
    
    for (const [index, result] of searchResults.entries()) {
      progressCallback(`Scraping ${index + 1}/${searchResults.length}: ${result.url}`);
      
      try {
        const pageInfo = await this.scrapePage(result.url, session.access_token, progressCallback);
        
        results.push({
          url: result.url,
          title: result.title,
          title_scrapped: pageInfo?.title || 'N/A',
          meta_description_scrapped: pageInfo?.meta_description || 'N/A',
          headings: pageInfo?.headings || []
        });

        // Délai entre les requêtes pour éviter la surcharge
        if (index < searchResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        progressCallback(`Erreur scraping ${result.url}: ${error}`);
        results.push({
          url: result.url,
          title: result.title,
          title_scrapped: 'Erreur lors du scraping',
          meta_description_scrapped: 'Impossible de récupérer les données',
          headings: []
        });
      }
    }

    const scrapingResults = {
      organic_results: results,
      query: params.query,
      timestamp: new Date().toISOString()
    };

    // 3. Enregistrer les résultats si un projet est sélectionné
    if (params.projectId) {
      progressCallback('Enregistrement des résultats...');
      const { error } = await supabase.from('scraper_results').insert([
        {
          project_id: params.projectId,
          user_id: session.user.id,
          data: scrapingResults,
          query: params.query,
          country_code: params.countryCode,
          tld: params.tld,
          language: params.language,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        progressCallback(`Erreur lors de l'enregistrement des résultats: ${error.message}`);
      } else {
        progressCallback('Résultats enregistrés dans le projet avec succès.');
      }
    }

    return scrapingResults;
  }

  // Validation des paramètres de recherche
  static validateSearchParams(params: SearchParams): string[] {
    const errors: string[] = [];

    if (!params.query.trim()) {
      errors.push("La requête de recherche est obligatoire");
    }

    if (!params.countryCode.trim()) {
      errors.push("Le code pays est obligatoire");
    }

    if (!params.tld.trim()) {
      errors.push("Le TLD est obligatoire");
    }

    if (!params.language.trim()) {
      errors.push("Le code langue est obligatoire");
    }

    return errors;
  }

  // Formatage des résultats pour export
  static formatResultsForExport(results: ScrapingResults): string {
    return JSON.stringify(results, null, 2);
  }

  // Génération d'un nom de fichier pour l'export
  static generateExportFilename(query: string): string {
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    return `scraping_results_${sanitizedQuery}_${timestamp}.json`;
  }
}