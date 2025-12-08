import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowUpRight } from 'lucide-react';

interface IdeaSummaryCardProps {
  title: string;
  overview?: string | null;
  href: string;
}

export function IdeaSummaryCard({ title, overview, href }: IdeaSummaryCardProps) {
  return (
    <Card className="min-h-[170px] rounded-2xl border border-neutral-200 bg-white/90 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Complete AI Overview</p>
      <h3 className="mt-2 text-xl font-semibold text-neutral-900">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">
        {overview || 'No overview captured yet.'}
      </p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center text-sm font-medium text-purple-600 transition-colors hover:text-purple-700"
      >
        View full idea
        <ArrowUpRight className="ml-1 h-4 w-4" />
      </Link>
    </Card>
  );
}

