export interface StatItem {
  readonly value: string;
  readonly label: string;
}

/**
 * Bandeau de chiffres factuels (voir COMPANY.registeredSince et le catalogue
 * réel) : aucune valeur ici n'est inventée pour l'effet visuel.
 */
export function StatsBar({ items }: { items: readonly StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-10 gap-y-6 sm:grid-cols-4 sm:gap-x-14">
      {items.map((item) => (
        <div key={item.label} className="text-center sm:text-left">
          <dd className="text-3xl font-black tracking-[-0.02em] whitespace-nowrap text-white sm:text-4xl">
            {item.value}
          </dd>
          <dt className="mt-1 text-xs font-bold whitespace-nowrap uppercase tracking-[0.14em] text-white/55 sm:text-sm">
            {item.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
