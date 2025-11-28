import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeedyIndexApiKeyManager } from './SpeedyIndexApiKeyManager';
import { RalfyIndexApiKeyManager } from './RalfyIndexApiKeyManager';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useIndexChecker } from '@/hooks/useIndexChecker';
import ScraperLogsDisplay from './ScraperLogsDisplay';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder, PlusCircle, Save } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';

interface Project {
  id: number;
  name: string;
}

interface IndexCheckerToolProps {
  projects: Project[];
  onSpeedyIndexApiKeySet: (apiKey: string) => void;
  hasSpeedyIndexValidKey: boolean;
  onRalfyIndexApiKeySet: (apiKey: string) => void;
  hasRalfyIndexValidKey: boolean;
  onProjectCreated: (project: Project) => void;
}

const IndexCheckerTool: React.FC<IndexCheckerToolProps> = ({ projects, onSpeedyIndexApiKeySet, hasSpeedyIndexValidKey, onRalfyIndexApiKeySet, hasRalfyIndexValidKey, onProjectCreated }) => {
  const [urls, setUrls] = useState('');
  const [taskType, setTaskType] = useState<'checker' | 'indexer'>('checker');
  const [indexationMethod, setIndexationMethod] = useState<'speedyindex' | 'ralfyindex'>('speedyindex');
  const { results, isLoading, logs, createTask, saveTask, taskId } = useIndexChecker();
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [isCreateProjectModalOpen, setCreateProjectModalOpen] = useState(false);

  const handleCreateTask = () => {
    const urlArray = urls.split('\n').filter(url => url.trim() !== '');
    createTask(urlArray, taskType, projectId, taskType === 'indexer' ? indexationMethod : undefined);
  };

  const handleIndexSelectedUrls = () => {
    // Pass projectId to allow auto-saving for this sub-task as well
    createTask(selectedUrls, 'indexer', projectId, indexationMethod);
    setSelectedUrls([]);
  };

  const handleSelectAllUnindexed = () => {
    if (results && results.unindexed_links) {
      const allUnindexedUrls = results.unindexed_links.map((link: { url: string }) => link.url);
      setSelectedUrls(allUnindexedUrls);
    }
  };

  const handleUrlSelection = (url: string, checked: boolean) => {
    if (checked) {
      setSelectedUrls(prev => [...prev, url]);
    } else {
      setSelectedUrls(prev => prev.filter(u => u !== url));
    }
  };

  const handleProjectChange = (value: string) => {
    if (value === 'create-new-project') {
      setCreateProjectModalOpen(true);
    } else {
      setProjectId(value === "no-project" ? undefined : parseInt(value));
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
                <div className="flex gap-2">
                  {results.unindexed_links.length > 0 && (
                    <Button onClick={handleSelectAllUnindexed} size="sm" variant="outline">
                      Tout sélectionner
                    </Button>
                  )}
                  {selectedUrls.length > 0 && (
                    <Button onClick={handleIndexSelectedUrls} size="sm">
                      Indexer les URLs sélectionnées ({selectedUrls.length})
                    </Button>
                  )}
                </div>
              </div>
              <ul className="list-disc list-inside">
                {results.unindexed_links.map((link: { url: string; error_code: number; }) => (
                  <li key={link.url} className="flex items-center gap-2">
                    <Checkbox
                      id={link.url}
                      onCheckedChange={(checked) => handleUrlSelection(link.url, !!checked)}
                      checked={selectedUrls.includes(link.url)}
                    />
                    <label htmlFor={link.url}>{link.url} (Error: {typeof link.error_code === 'number' ? link.error_code : 'N/A'})</label>
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
    <>
      <div className="space-y-12">
        <SpeedyIndexApiKeyManager
          onApiKeySet={onSpeedyIndexApiKeySet}
          hasValidKey={hasSpeedyIndexValidKey}
        />
        <RalfyIndexApiKeyManager
          onApiKeySet={onRalfyIndexApiKeySet}
          hasValidKey={hasRalfyIndexValidKey}
        />
        {(hasSpeedyIndexValidKey || hasRalfyIndexValidKey) && (
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
                  {taskType === 'indexer' && (
                    <div className="space-y-2">
                      <Label>Méthode d'indexation</Label>
                      <RadioGroup value={indexationMethod} onValueChange={(value: 'speedyindex' | 'ralfyindex') => setIndexationMethod(value)} className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="speedyindex" id="speedyindex" disabled={!hasSpeedyIndexValidKey} />
                          <Label htmlFor="speedyindex" className={!hasSpeedyIndexValidKey ? 'text-muted-foreground' : ''}>SpeedyIndex</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ralfyindex" id="ralfyindex" disabled={!hasRalfyIndexValidKey} />
                          <Label htmlFor="ralfyindex" className={!hasRalfyIndexValidKey ? 'text-muted-foreground' : ''}>RalfyIndex</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                  <Textarea
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    placeholder="Entrez une URL par ligne"
                    rows={10}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="project-indexer" className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Projet
                    </Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={projectId ? String(projectId) : "no-project"}
                        onValueChange={handleProjectChange}
                      >
                        <SelectTrigger className="w-full" id="project-indexer">
                          <SelectValue placeholder="Aucun projet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-project">Aucun projet (sauvegarde manuelle)</SelectItem>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>
                          ))}
                          <SelectItem value="create-new-project">
                            <div className="flex items-center gap-2">
                              <PlusCircle className="h-4 w-4" />
                              Créer un nouveau projet
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => saveTask(projectId!)}
                        disabled={!projectId || isLoading || !taskId}
                        title="Sauvegarder ou mettre à jour le projet pour la tâche affichée"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
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
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onProjectCreated={onProjectCreated}
      />
    </>
  );
};

export default IndexCheckerTool;
