import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

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

export const useIndexChecker = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<SpeedyIndexReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedTaskDbId, setSavedTaskDbId] = useState<number | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  }, []);

  const _saveTask = async (projectId: number, apiTaskId: string, type: 'checker' | 'indexer', urls: string[], session: Session) => {
    try {
      const { data, error } = await supabase.from('speedy_index_tasks').insert([
        { project_id: projectId, task_id: apiTaskId, type, urls, status: 'created' },
      ]).select('id');

      if (error) throw error;

      if (data && data.length > 0) {
        setSavedTaskDbId(data[0].id);
      }
      setIsSaved(true);
      addLog(`Tâche sauvegardée dans le projet (ID: ${projectId})`);
      toast({ title: 'Sauvegardé', description: 'La tâche a été automatiquement sauvegardée dans votre projet.' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde auto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      addLog(`Erreur de sauvegarde: ${errorMessage}`);
      toast({ title: 'Erreur de sauvegarde', description: errorMessage, variant: 'destructive' });
    }
  };

  const getReport = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addLog("Erreur d'authentification: Impossible de récupérer la session utilisateur.");
      toast({ title: "Erreur d'authentification", description: "Impossible de récupérer la session utilisateur.", variant: "destructive" });
      return;
    }

    addLog(`Récupération du rapport pour la tâche ${id}...`);
    try {
      const response = await fetch('/api/speedyindex-proxy/v2/task/google/checker/fullreport', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_id: id }),
      });
      const data = await response.json();
      if (data.code === 0) {
        setResults(data.result);
        addLog("Rapport récupéré avec succès.");
        toast({ title: "Vérification terminée", description: "Les résultats sont disponibles." });
      } else {
        throw new Error(data.error || 'Failed to get report.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.';
      addLog(`Erreur lors de la récupération du rapport: ${errorMessage}`);
      toast({ title: "Erreur lors de la récupération du rapport", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, addLog]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  const pollTaskStatus = useCallback(async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addLog("Erreur d'authentification: Impossible de récupérer la session utilisateur.");
      return;
    }

    try {
      const response = await fetch('/api/speedyindex-proxy/v2/task/google/checker/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task_ids: [id] }),
      });
      const data = await response.json();
      if (data.code === 0 && data.result && data.result.length > 0) {
        const task = data.result[0];
        addLog(`Statut de la tâche ${id}: ${task.is_completed ? 'Terminée' : 'En cours'}`);
        if (task.is_completed) {
          stopPolling();
          getReport(id);
        }
      }
    } catch (error) {
      console.error("Error polling task status:", error);
      addLog("Erreur lors de la récupération du statut de la tâche.");
      stopPolling();
    }
  }, [addLog, getReport, stopPolling]);

  const createTask = async (urls: string[], type: 'checker' | 'indexer', projectId?: number) => {
    setLogs([]);
    setIsSaved(false);
    setSavedTaskDbId(null);
    if (!urls.length) {
      toast({ title: "Aucune URL fournie", description: "Veuillez entrer au moins une URL.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResults(null);
    setTaskId(null);
    stopPolling(); // Clear any existing interval
    addLog(`Création d'une tâche de type ${type} pour ${urls.length} URLs...`);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addLog("Erreur d'authentification: Impossible de récupérer la session utilisateur.");
      toast({ title: "Erreur d'authentification", description: "Impossible de récupérer la session utilisateur.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const endpoint = `/api/speedyindex-proxy/v2/task/google/${type}/create`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();

      if (data.code === 0 && data.task_id) {
        const apiTaskId = data.task_id;
        setTaskId(apiTaskId);
        addLog(`Tâche ${apiTaskId} créée avec succès.`);
        toast({ title: "Tâche créée", description: `La tâche a commencé pour ${urls.length} URLs.` });

        if (projectId) {
          await _saveTask(projectId, apiTaskId, type, urls, session);
        }

        if (type === 'checker') {
          pollingInterval.current = setInterval(() => {
            pollTaskStatus(apiTaskId).catch(console.error);
          }, 10000);
        } else {
          addLog("La tâche d'indexation a été soumise. Le rapport ne sera pas récupéré automatically.");
          setIsLoading(false);
        }
      } else {
        throw new Error(data.error || 'Failed to create task.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue.';
      addLog(`Erreur lors de la création de la tâche: ${errorMessage}`);
      toast({ title: "Erreur lors de la création de la tâche", description: errorMessage, variant: "destructive" });
      setIsLoading(false);
      stopPolling();
    }
  };

  const saveTask = async (newProjectId: number) => {
    if (!taskId) {
        toast({ title: 'Aucune tâche à sauvegarder', description: 'Veuillez d\'abord créer une tâche.', variant: 'destructive' });
        return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Non connecté', description: 'Veuillez vous connecter pour sauvegarder.', variant: 'destructive' });
      return;
    }

    try {
      if (savedTaskDbId) {
        const { error } = await supabase.from('speedy_index_tasks').update({ project_id: newProjectId }).eq('id', savedTaskDbId);
        if (error) throw error;
        toast({ title: 'Projet mis à jour', description: 'Le projet associé à cette tâche a été mis à jour.' });
      } else {
        // This case should ideally not be hit if auto-save is the primary mechanism
        // But as a fallback, we can insert.
        const { error } = await supabase.from('speedy_index_tasks').insert([
          { project_id: newProjectId, task_id: taskId, type: 'checker', urls: [], status: 'created' }, // Note: type and urls are not available here, might need adjustment
        ]);
        if (error) throw error;
        toast({ title: 'Sauvegardé', description: 'La tâche a été associée à votre projet.' });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde/mise à jour:', error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({ title: 'Erreur', description: errorMessage, variant: 'destructive' });
    }
  };

  return { results, isLoading, logs, createTask, isSaved, saveTask, taskId };
};