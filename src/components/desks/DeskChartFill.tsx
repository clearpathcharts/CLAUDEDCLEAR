import React from 'react';

/**
 * Stretch LightweightCandles to the desk chart room.
 * fillParent uses height:100%, which does nothing when the parent only has min-height —
 * the plot then sticks at the 420px floor and leaves a black void under the x-axis.
 * A relative host with a real min-height plus absolute inset-0 gives the canvas a box to fill.
 */
export function DeskChartFill({
  tall = false,
  className = '',
  children,
}: {
  tall?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const minH = tall ? 'min-h-[70vh]' : 'min-h-[220px]';
  return (
    <div className={`relative h-full min-h-0 flex-1 ${minH} ${className}`.trim()}>
      <div className={`absolute inset-0 ${minH}`}>{children}</div>
    </div>
  );
}
