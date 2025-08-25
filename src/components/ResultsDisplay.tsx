import { ScrapingResults, SearchResult } from '@/types/scraper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Download, Clock, Hash, Globe } from 'lucide-react';
import { ScraperService } from '@/utils/scraperService';

interface ResultsDisplayProps {
  results: ScrapingResults | null;
}

export const ResultsDisplay = ({ results }: ResultsDisplayProps) => {
  if (!results) return null;

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ScraperService.generateExportFilename(results.query);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* En-tête des résultats */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Résultats du scraping</h2>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                <span>{results.organic_results.length} résultats</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(results.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button onClick={downloadResults} variant="glass" size="lg">
            <Download className="h-4 w-4" />
            Télécharger JSON
          </Button>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/20 border border-primary/20">
          <p className="font-medium text-primary">Requête recherchée:</p>
          <p className="text-lg">{results.query}</p>
        </div>
      </Card>

      {/* Liste des résultats */}
      <div className="grid gap-6">
        {results.organic_results.map((result, index) => (
          <ResultCard key={index} result={result} index={index} />
        ))}
      </div>
    </div>
  );
};

const ResultCard = ({ result, index }: { result: SearchResult; index: number }) => {
  return (
    <Card className="glass-card p-6 hover:border-primary/40 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-primary border-primary/30">
              #{index + 1}
            </Badge>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2 text-foreground">{result.title}</h3>
          
          <a 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm mb-4"
          >
            <ExternalLink className="h-3 w-3" />
            {result.url}
          </a>
        </div>
      </div>

      <Separator className="mb-4" />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Titre scrapé */}
        <div>
          <h4 className="font-medium text-primary mb-2">Titre de la page</h4>
          <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
            {result.title_scrapped || 'Non disponible'}
          </p>
        </div>

        {/* Description meta */}
        <div>
          <h4 className="font-medium text-primary mb-2">Meta description</h4>
          <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
            {result.meta_description_scrapped || 'Non disponible'}
          </p>
        </div>
      </div>

      {/* Headings */}
      {result.headings && result.headings.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-primary mb-3">Structure des titres</h4>
          <div className="space-y-2">
            {result.headings.map((heading, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 border border-border/30"
              >
                <Badge 
                  variant="secondary" 
                  className="text-xs font-mono bg-primary/10 text-primary border-primary/20"
                >
                  {heading.tag.toUpperCase()}
                </Badge>
                <span className="text-sm">{heading.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};