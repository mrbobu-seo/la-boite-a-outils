import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-indigo-600">Paramètres de recherche</h2>
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
          <Select
            value={projectId ? String(projectId) : "no-project"}
            onValueChange={(value) => setProjectId(value === "no-project" ? undefined : parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Aucun projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-project">Aucun projet</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
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
