import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ScraperLogsDisplayProps {
  logs: string[];
}

const ScraperLogsDisplay: React.FC<ScraperLogsDisplayProps> = ({ logs }) => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Logs de Scraping</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border p-4 text-sm">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">Aucun log pour le moment.</p>
          ) : (
            logs.map((log, index) => (
              <p key={index} className="mb-1">
                {log}
              </p>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ScraperLogsDisplay;
