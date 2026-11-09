import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { CollectionDetailView } from '@/components/collections/CollectionDetailView';
import { getCollection } from '@/app/collections/actions';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { token } = await searchParams;
  const coll = await getCollection(id, token);

  if (!coll) {
    return { title: 'Collection Not Found | MORS' };
  }

  const isIndexable = coll.visibility === 'public';

  return {
    title: `${coll.name} | MORS`,
    description: coll.description || `Curated collection on MORS by @${coll.author?.username}`,
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: coll.name,
      description: coll.description || undefined,
      type: 'article',
    },
  };
}

export default async function CollectionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  const collection = await getCollection(id, token);
  if (!collection) {
    notFound();
  }

  return (
    <AppShell>
      <CollectionDetailView collection={collection} />
    </AppShell>
  );
}
