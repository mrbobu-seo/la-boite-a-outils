import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeedyIndexApiKeyManager } from './SpeedyIndexApiKeyManager';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface SpeedyIndexReport {
  id: string;
  size: number;
  processed_count: number;
  indexed_links: { url: string; title: string; }[];
  unindexed_links: { url: string; error_code: number; }[];
  title: string;
  type: string;
  created_at: string;
}

const IndexCheckerTool = () => {
  const [speedyIndexHasValidApiKey, setSpeedyIndexHasValidApiKey] = useState(false);
  const [urls, setUrls] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<SpeedyIndexReport | null>(null);
  const { toast } = useToast();

  const handleGetReport = useCallback(async (id: string) => {
    const apiKey = localStorage.getItem('speedyindex_key');
    try {
      const response = await fetch('/api/speedyindex-proxy/v2/task/google/checker/fullreport', {
        method: 'POST',
        headers: {
          'Authorization': apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: id }),
      });
      const data = await response.json();
      if (data.code === 0) {
        setResults(data.result);
        toast({ title: "Vérification terminée", description: "Les résultats sont disponibles." });
      } else {
        throw new Error(data.error || 'Failed to get report.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.';
      toast({ title: "Erreur lors de la récupération du rapport", description: errorMessage, variant: "destructive" });
    } finally {
      setIsChecking(false);
    }
  }, [toast]);

  useEffect(() => {
    const savedKey = localStorage.getItem('speedyindex_key');
    setSpeedyIndexHasValidApiKey(!!savedKey && savedKey.trim().length > 0);
  }, []);

  useEffect(() => {
    if (!taskId || !isChecking) return;

    const pollTaskStatus = async () => {
      const apiKey = localStorage.getItem('speedyindex_key');
      try {
        const response = await fetch('/api/speedyindex-proxy/v2/task/google/checker/status', {
          method: 'POST',
          headers: {
            'Authorization': apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task_ids: [taskId] }),
        });
        const data = await response.json();
        if (data.code === 0 && data.result && data.result.length > 0) {
          const task = data.result[0];
          if (task.is_completed) {
            clearInterval(interval);
            handleGetReport(taskId);
          }
        }
      } catch (error) {
        console.error("Error polling task status:", error);
      }
    };

    const interval = setInterval(pollTaskStatus, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [taskId, isChecking, handleGetReport]);

  const handleSpeedyIndexApiKeySet = (apiKey: string) => {
    setSpeedyIndexHasValidApiKey(!!apiKey && apiKey.trim().length > 0);
  };

  const handleCreateTask = async () => {
    if (!urls.trim()) {
      toast({ title: "Aucune URL fournie", description: "Veuillez entrer au moins une URL.", variant: "destructive" });
      return;
    }

    setIsChecking(true);
    setResults(null);
    setTaskId(null);

    const urlArray = urls.split('\n').filter(url => url.trim() !== '');
    const apiKey = localStorage.getItem('speedyindex_key');

    try {
      const response = await fetch('/api/speedyindex-proxy/v2/task/google/checker/create', {
        method: 'POST',
        headers: {
          'Authorization': apiKey!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlArray }),
      });

      const data = await response.json();

      if (data.code === 0 && data.task_id) {
        setTaskId(data.task_id);
        toast({ title: "Tâche créée", description: `La vérification a commencé pour ${urlArray.length} URLs.` });
      } else {
        throw new Error(data.error || 'Failed to create task.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.';
      toast({ title: "Erreur lors de la création de la tâche", description: errorMessage, variant: "destructive" });
      setIsChecking(false);
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
              <h3 className="font-bold">URLs Non Indexées ({results.unindexed_links.length})</h3>
              <ul className="list-disc list-inside">
                {results.unindexed_links.map((link: { url: string; error_code: number; }) => (
                  <li key={link.url}>{link.url} (Error: {link.error_code})</li>
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
        <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-indigo-600">Index Checker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="Entrez une URL par ligne"
                rows={10}
              />
              <Button
                onClick={handleCreateTask}
                disabled={isChecking}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isChecking ? 'Vérification en cours...' : 'Lancer la vérification'}
              </Button>
            </div>
            {isChecking && !results && (
              <div className="mt-4 text-center">
                <p>Vérification en cours... Veuillez patienter.</p>
                <p>(Cela peut prendre plusieurs minutes)</p>
              </div>
            )}
            <div className="mt-8">
              {renderResults()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndexCheckerTool;