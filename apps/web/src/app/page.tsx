import { formatRating, FOOD_CATEGORIES } from '@mors/domain';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="border-b border-neutral-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          MORS Food Logging
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Social food journal & taste archive. Monorepo foundation operational.
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-base font-semibold text-neutral-800">
          Food Categories ({FOOD_CATEGORIES.length})
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {FOOD_CATEGORIES.map((category) => (
            <span
              key={category.slug}
              className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
            >
              {category.label}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-neutral-500">
          Sample Rating Display: {formatRating(9)} (Raw 9 = 4.5 Stars)
        </p>
      </section>
    </main>
  );
}
