'use client';

import { useState } from 'react';
import { PersonaReaction } from '@/server/validation/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PersonaReactionsPanelProps {
  reactions: PersonaReaction[];
  onRefresh: () => Promise<void>;
}

export function PersonaReactionsPanel({ reactions, onRefresh }: PersonaReactionsPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
      toast.success('Persona reactions updated');
    } catch (error) {
      console.error('Persona refresh error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to refresh persona reactions');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="border border-neutral-200 bg-white">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-lg font-semibold text-neutral-900">Persona Reactions</CardTitle>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh Reactions'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {reactions.length === 0 ? (
          <p className="text-sm text-neutral-600">Generate personas first to see how each reacts to this insight.</p>
        ) : (
          reactions.map((reaction) => (
            <div key={reaction.personaName} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">{reaction.personaName}</h3>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{reaction.reaction}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <ReactionList label="Likes" items={reaction.likes} />
                <ReactionList label="Concerns" items={reaction.dislikes} />
                <ReactionList label="Confusion" items={reaction.confusionPoints} />
                <ReactionList label="Requested Features" items={reaction.requestedFeatures} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ReactionList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <ul className="mt-1 space-y-1 text-sm text-neutral-700">
        {items.slice(0, 3).map((item, idx) => (
          <li key={idx} className="rounded-md border border-neutral-200 bg-white px-2 py-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


