import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { SearchParams } from '@/types/scraper';
import { Search, Globe, Code, Languages, Folder } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface SearchFormProps {
  onSearch: (params: SearchParams & { projectId?: number }) => void;
  isLoading: boolean;
  projects: Project[];
}

export const SearchForm = ({ onSearch, isLoading, projects }: SearchFormProps) => {
  const [params, setParams] = useState<SearchParams>({
    query: '',
    countryCode: 'be',
    tld: 'com',
    language: 'fr'
  });
  const [projectId, setProjectId] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ ...params, projectId });
  };

  const updateParam = (key: keyof SearchParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="glass-card p-8 animate-float">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold gradient-text">Paramètres de recherche</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="query" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Requête de recherche
          </Label>
          <Input
            id="query"
            type="text"
            value={params.query}
            onChange={(e) => updateParam('query', e.target.value)}
            placeholder="Ex: intelligence artificielle machine learning"
            className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="countryCode" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Code pays
            </Label>
            <Input
              id="countryCode"
              type="text"
              value={params.countryCode}
              onChange={(e) => updateParam('countryCode', e.target.value)}
              placeholder="fr, us, de"
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tld" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              TLD
            </Label>
            <Input
              id="tld"
              type="text"
              value={params.tld}
              onChange={(e) => updateParam('tld', e.target.value)}
              placeholder="fr, com, de"
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Langue
            </Label>
            <Input
              id="language"
              type="text"
              value={params.language}
              onChange={(e) => updateParam('language', e.target.value)}
              placeholder="fr, en, de"
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Projet (Optionnel)
          </Label>
          <select
            id="project"
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          >
            <option value="">Aucun projet</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="neon"
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              Scraping en cours...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Lancer le scraping
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
