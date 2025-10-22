import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Key, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ScraperApiKeyManagerProps {
  onApiKeySet: (apiKey: string) => void;
  hasValidKey: boolean;
}

export const ScraperApiKeyManager = ({ onApiKeySet, hasValidKey }: ScraperApiKeyManagerProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!hasValidKey);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem('scraperapi_key');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeySet(savedKey);
    }
  }, [onApiKeySet]);

  const testApiKey = async (keyToTest: string) => {
    setIsTestingKey(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Non connecté", description: "Veuillez vous connecter.", variant: "destructive" });
        setIsTestingKey(false);
        return;
      }

      const response = await fetch(`/api/scraperapi-proxy?url=http://api.scraperapi.com/account&_=${new Date().getTime()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'X-ScraperAPI-Key-To-Test': keyToTest,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Assuming ScraperAPI returns account details on successful validation
        localStorage.setItem('scraperapi_key', keyToTest);
        onApiKeySet(keyToTest);
        setShowKeyInput(false);
        toast({
          title: "Clé API ScraperAPI validée",
          description: `Clé API ScraperAPI configurée avec succès.`,
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('api_keys').upsert(
            { user_id: user.id, service_name: 'ScraperAPI', api_key: keyToTest },
            { onConflict: 'user_id, service_name' }
          );
        }

        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la validation.';
      toast({
        title: "Erreur de validation ScraperAPI",
        description: `Clé API invalide ou problème de connexion: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    await testApiKey(apiKey.trim());
  };

  const handleRemoveKey = () => {
    localStorage.removeItem('scraperapi_key');
    setApiKey('');
    onApiKeySet('');
    setShowKeyInput(true);
    toast({
      title: "Clé API ScraperAPI supprimée",
      description: "Vous devez configurer une nouvelle clé API ScraperAPI.",
    });
  };

  if (hasValidKey && !showKeyInput) {
    return (
      <Card className="bg-gray-50 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <h3 className="font-semibold">Clé API ScraperAPI configurée</h3>
              <p className="text-sm text-muted-foreground">ScraperAPI est prêt à utiliser</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowKeyInput(true)}>
              Changer
            </Button>
            <Button variant="outline" size="sm" onClick={handleRemoveKey}>
              Supprimer
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-50 p-8 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <Key className="h-6 w-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-indigo-600">Configuration API ScraperAPI</h2>
      </div>

      <Alert className="mb-6 border-indigo-500/20 bg-indigo-500/10">
        <AlertTriangle className="h-4 w-4 text-indigo-500" />
        <AlertDescription className="text-indigo-700">
          <strong>Proxy Serverless :</strong> Cette application utilise un proxy serverless pour communiquer avec ScraperAPI.
          Votre clé API est sécurisée et n'est pas exposée côté client.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">Clé API ScraperAPI</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Entrez votre clé API ScraperAPI"
            required
          />
          <p className="text-xs text-muted-foreground">
            Obtenez votre clé sur{' '}
            <a 
              href="https://www.scraperapi.com" 
              className="text-indigo-600 hover:underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              scraperapi.com
            </a>
          </p>
        </div>

        <Button
          type="submit"
          disabled={isTestingKey || !apiKey.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isTestingKey ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              Test en cours...
            </>
          ) : (
            <>
              <Key className="h-4 w-4" />
              Valider et configurer
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};
