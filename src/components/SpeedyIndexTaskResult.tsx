import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SpeedyIndexReport {
  indexed_links: { url: string; title: string; }[];
  unindexed_links: { url: string; error_code: number; }[];
}

interface SpeedyIndexTaskResultProps {
  report: SpeedyIndexReport;
}

const SpeedyIndexTaskResult: React.FC<SpeedyIndexTaskResultProps> = ({ report }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats de la vérification</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold">URLs Indexées ({report.indexed_links.length})</h3>
            <ul className="list-disc list-inside">
              {report.indexed_links.map((link: { url: string; title: string; }) => (
                <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{link.url}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold">URLs Non Indexées ({report.unindexed_links.length})</h3>
            <ul className="list-disc list-inside">
              {report.unindexed_links.map((link: { url: string; error_code: number; }) => (
                <li key={link.url}>{link.url} (Error: {link.error_code})</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeedyIndexTaskResult;
