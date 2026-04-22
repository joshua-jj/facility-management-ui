import React from 'react';

export interface ListStatTile {
   label: string;
   value: React.ReactNode;
   hint?: string;
   accent?: string;
}

interface ListStatsStripProps {
   tiles: ListStatTile[];
   className?: string;
}

/**
 * A compact KPI strip shown above DataTable index pages.
 * Mirrors the dashboard card styling (muted surface + dashed gridlines language)
 * to give list pages a consistent professional look.
 */
const ListStatsStrip: React.FC<ListStatsStripProps> = ({ tiles, className = '' }) => {
   const cols = Math.min(Math.max(tiles.length, 2), 4);
   const gridClass =
      cols === 2
         ? 'grid-cols-2'
         : cols === 3
           ? 'grid-cols-2 sm:grid-cols-3'
           : 'grid-cols-2 sm:grid-cols-4';

   return (
      <div className={`grid ${gridClass} gap-3 md:gap-4 mb-4 md:mb-5 ${className}`}>
         {tiles.map((tile) => (
            <div
               key={tile.label}
               className="rounded-2xl p-4 md:p-5 transition-colors"
               style={{
                  background: 'var(--surface-low, rgba(255,255,255,0.02))',
                  border: '1px solid var(--border-default)',
               }}
            >
               <div
                  className="text-[0.6rem] uppercase tracking-wider font-semibold mb-2"
                  style={{ color: 'var(--text-hint)' }}
               >
                  {tile.label}
               </div>
               <div
                  className="text-2xl md:text-3xl font-bold tabular-nums tracking-tight"
                  style={{ color: tile.accent ?? 'var(--text-primary)' }}
               >
                  {tile.value}
               </div>
               {tile.hint && (
                  <div
                     className="text-[0.65rem] mt-1"
                     style={{ color: 'var(--text-hint)' }}
                  >
                     {tile.hint}
                  </div>
               )}
            </div>
         ))}
      </div>
   );
};

export default ListStatsStrip;
