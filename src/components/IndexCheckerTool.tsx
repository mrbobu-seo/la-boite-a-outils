import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpeedyIndexApiKeyManager } from './SpeedyIndexApiKeyManager';
import { ScraperService } from '@/utils/scraperService'; // Re-using ScraperService for getApiKey logic

const IndexCheckerTool = () => {
  const [speedyIndexHasValidApiKey, setSpeedyIndexHasValidApiKey] = useState(false);

  useEffect(() => {
    // Check SpeedyIndex API key on mount
    const savedKey = localStorage.getItem('speedyindex_key');
    setSpeedyIndexHasValidApiKey(!!savedKey && savedKey.trim().length > 0);
  }, []);

  const handleSpeedyIndexApiKeySet = (apiKey: string) => {
    setSpeedyIndexHasValidApiKey(!!apiKey && apiKey.trim().length > 0);
  };

  return (
    <div className="space-y-12">
      <SpeedyIndexApiKeyManager
        onApiKeySet={handleSpeedyIndexApiKeySet}
        hasValidKey={speedyIndexHasValidApiKey}
      />
      {speedyIndexHasValidApiKey && (
        <Card>
          <CardHeader>
            <CardTitle>Index Checker & Indexation Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is where the Index Checker & Indexation tool features will be implemented.</p>
            <p>Coming soon!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndexCheckerTool;
