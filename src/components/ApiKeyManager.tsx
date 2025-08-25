import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Key, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface ApiKeyManagerProps {
  onApiKeySet: (apiKey: string) => void;
  hasValidKey: boolean;
}

export const ApiKeyManager = ({ onApiKeySet, hasValidKey }: ApiKeyManagerProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!hasValidKey);
  const { toast } = useToast();

  useEffect(() => {
    // Charger la clé API depuis localStorage au démarrage
    const savedKey = localStorage.getItem('scraperapi_key');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeySet(savedKey);
    }
  }, [onApiKeySet]);

  const testApiKey = async (keyToTest: string) => {
    setIsTestingKey(true);
    try {
      const testUrl = `/api/proxy?api_key=${keyToTest}&url=https://httpbin.org/ip`;
      
      const response = await fetch(testUrl);
      
      if (response.ok) {
        localStorage.setItem('scraperapi_key', keyToTest);
        onApiKeySet(keyToTest);
        setShowKeyInput(false);
        toast({
          title: "Clé API validée",
          description: "Votre clé ScraperAPI est fonctionnelle !",
        });
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Erreur de validation",
        description: "Clé API invalide ou problème de connexion",
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
      title: "Clé API supprimée",
      description: "Vous devez configurer une nouvelle clé API",
    });
  };

  if (hasValidKey && !showKeyInput) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <h3 className="font-semibold">Clé API configurée</h3>
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
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Key className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold gradient-text">Configuration API</h2>
      </div>

      <Alert className="mb-6 border-blue-500/20 bg-blue-500/10">
        <AlertTriangle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-200">
          <strong>Proxy Serverless :</strong> Cette application utilise désormais un proxy serverless pour communiquer avec ScraperAPI.
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
            className="transition-all duration-300 focus:ring-2 focus:ring-primary/50"
            required
          />
          <p className="text-xs text-muted-foreground">
            Obtenez votre clé sur{' '}
            <a 
              href="https://www.scraperapi.com" 
              className="text-primary hover:underline"
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
          variant="neon"
          className="w-full"
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