import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeedyIndexApiKeyManager } from './SpeedyIndexApiKeyManager';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIndexChecker } from '@/hooks/useIndexChecker';
import ScraperLogsDisplay from './ScraperLogsDisplay';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder } from 'lucide-react';

interface Project {
  id: number;
  name: string;
}

interface IndexCheckerToolProps {
  projects: Project[];
}

const IndexCheckerTool: React.FC<IndexCheckerToolProps> = ({ projects }) => {
  const [speedyIndexHasValidApiKey, setSpeedyIndexHasValidApiKey] = useState(false);
  const [urls, setUrls] = useState('');
  const [taskType, setTaskType] = useState<'checker' | 'indexer'>('checker');
  const { results, isLoading, logs, createTask } = useIndexChecker();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>(undefined);


  useEffect(() => {
    const savedKey = localStorage.getItem('speedyindex_key');
    setSpeedyIndexHasValidApiKey(!!savedKey && savedKey.trim().length > 0);
  }, []);

  const handleSpeedyIndexApiKeySet = (apiKey: string) => {
    setSpeedyIndexHasValidApiKey(!!apiKey && apiKey.trim().length > 0);
  };

  const handleCreateTask = () => {
    const urlArray = urls.split('\n').filter(url => url.trim() !== '');
    createTask(urlArray, taskType, projectId);
  };
  
  const handleIndexSelectedUrls = () => {
    createTask(selectedUrls, 'indexer', projectId);
    setSelectedUrls([]);
  };

  const handleUrlSelection = (url: string, checked: boolean) => {
    if (checked) {
      setSelectedUrls(prev => [...prev, url]);
    } else {
      setSelectedUrls(prev => prev.filter(u => u !== url));
    }
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Résultats de la vérification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">URLs Indexées ({results.indexed_links.length})</h3>
              <ul className="list-disc list-inside">
                {results.indexed_links.map((link: { url: string; title: string; }) => (
                  <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link.url}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold">URLs Non Indexées ({results.unindexed_links.length})</h3>
                {selectedUrls.length > 0 && (
                  <Button onClick={handleIndexSelectedUrls} size="sm">
                    Indexer les URLs sélectionnées ({selectedUrls.length})
                  </Button>
                )}
              </div>
              <ul className="list-disc list-inside">
                {results.unindexed_links.map((link: { url: string; error_code: number; }) => (
                  <li key={link.url} className="flex items-center gap-2">
                    <Checkbox
                      id={link.url}
                      onCheckedChange={(checked) => handleUrlSelection(link.url, !!checked)}
                      checked={selectedUrls.includes(link.url)}
                    />
                    <label htmlFor={link.url}>{link.url} (Error: {link.error_code})</label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-12">
      <SpeedyIndexApiKeyManager
        onApiKeySet={handleSpeedyIndexApiKeySet}
        hasValidKey={speedyIndexHasValidApiKey}
      />
      {speedyIndexHasValidApiKey && (
        <>
          <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-indigo-600">Index Checker & Indexation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RadioGroup defaultValue="checker" onValueChange={(value: 'checker' | 'indexer') => setTaskType(value)} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="checker" id="checker" />
                    <Label htmlFor="checker">Vérifier l'indexation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="indexer" id="indexer" />
                    <Label htmlFor="indexer">Indexer les URLs</Label>
                  </div>
                </RadioGroup>
                <Textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="Entrez une URL par ligne"
                  rows={10}
                />
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
                  onClick={handleCreateTask}
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isLoading ? 'Tâche en cours...' : `Lancer ${taskType === 'checker' ? 'la vérification' : 'l\'indexation'}`}
                </Button>
              </div>
            </CardContent>
          </Card>
          {logs.length > 0 && (
            <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
              <ScraperLogsDisplay logs={logs} />
            </Card>
          )}
          <div className="mt-8">
            {renderResults()}
          </div>
        </>
      )}
    </div>
  );
};

export default IndexCheckerTool;