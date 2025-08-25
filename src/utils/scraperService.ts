import { SearchParams, ScrapingResults, SearchResult, ScrapedPageInfo } from '@/types/scraper';

// Service pour simuler le scraping (remplace l'API Python)
export class ScraperService {
  private static readonly DEMO_RESULTS = [
    {
      url: "https://example.com",
      title: "Exemple de résultat 1",
      title_scrapped: "Page d'exemple - Site officiel",
      meta_description_scrapped: "Ceci est un exemple de description meta extraite de la page.",
      headings: [
        { tag: "h1", text: "Titre principal de la page" },
        { tag: "h2", text: "Section importante" },
        { tag: "h3", text: "Sous-section détaillée" }
      ]
    },
    {
      url: "https://demo.example.com",
      title: "Exemple de résultat 2", 
      title_scrapped: "Démonstration - Guide complet",
      meta_description_scrapped: "Guide complet avec toutes les informations nécessaires pour comprendre le sujet.",
      headings: [
        { tag: "h1", text: "Guide de démonstration" },
        { tag: "h2", text: "Introduction" },
        { tag: "h2", text: "Fonctionnalités" },
        { tag: "h3", text: "Avantages" }
      ]
    },
    {
      url: "https://test.example.com",
      title: "Exemple de résultat 3",
      title_scrapped: "Tests et validations",
      meta_description_scrapped: "Documentation complète des tests et validations effectués sur la plateforme.",
      headings: [
        { tag: "h1", text: "Tests de validation" },
        { tag: "h2", text: "Méthodologie" },
        { tag: "h2", text: "Résultats" }
      ]
    }
  ];

  // Simule une recherche Google avec scraping des pages
  static async searchAndScrape(params: SearchParams): Promise<ScrapingResults> {
    // Simulation d'un délai de recherche
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      organic_results: this.DEMO_RESULTS,
      query: params.query,
      timestamp: new Date().toISOString()
    };
  }

  // Simule le scraping d'une page individuelle
  static async scrapePage(url: string): Promise<ScrapedPageInfo | null> {
    // Simulation d'un délai de scraping
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulation d'échec aléatoire (10% de chance)
    if (Math.random() < 0.1) {
      return null;
    }

    return {
      title: `Titre scrapé de ${url}`,
      meta_description: `Description meta extraite automatiquement de la page ${url}`,
      headings: [
        { tag: "h1", text: "Titre principal" },
        { tag: "h2", text: "Section importante" },
        { tag: "h3", text: "Détails" }
      ]
    };
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