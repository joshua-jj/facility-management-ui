import React, { FC, memo } from 'react';
import {
   BaseEdge,
   EdgeLabelRenderer,
   EdgeProps,
   getBezierPath,
} from '@xyflow/react';

/**
 * Custom edge for a workflow transition. Renders the bezier path plus
 * a floating label carrying the action name and a capability hint.
 *
 * Selected edge stroke goes gold; unselected stays in a muted slate
 * so the canvas reads as a diagram, not a UI chrome explosion.
 */
type TransitionEdgeData = {
   action: string;
   requiredCapability: string;
   appliesTo?: string;
   scopeRule?: string;
};

const TransitionEdgeComponent: FC<EdgeProps> = ({
   id,
   sourceX,
   sourceY,
   targetX,
   targetY,
   sourcePosition,
   targetPosition,
   data,
   selected,
   markerEnd,
}) => {
   const edgeData = (data ?? {}) as TransitionEdgeData;
   const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
   });

   const stroke = selected ? '#B28309' : '#94a3b8';
   const strokeWidth = selected ? 2.5 : 1.5;

   return (
      <>
         <BaseEdge
            id={id}
            path={edgePath}
            markerEnd={markerEnd}
            style={{ stroke, strokeWidth }}
         />
         <EdgeLabelRenderer>
            <div
               style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                  pointerEvents: 'all',
               }}
               className={[
                  'rounded-md px-2 py-1 text-[0.65rem] font-bold shadow-sm border transition-colors',
                  selected
                     ? 'bg-[#B28309] text-white border-[#B28309]'
                     : 'bg-white text-[#0F2552] border-gray-200 hover:border-[#B28309]/50',
               ].join(' ')}
            >
               <div className="leading-tight">{edgeData.action}</div>
               {edgeData.requiredCapability && (
                  <div
                     className={[
                        'text-[0.55rem] font-medium leading-tight mt-0.5',
                        selected ? 'text-white/80' : 'text-gray-400',
                     ].join(' ')}
                  >
                     {edgeData.requiredCapability}
                  </div>
               )}
            </div>
         </EdgeLabelRenderer>
      </>
   );
};

export const TransitionEdge = memo(TransitionEdgeComponent);
TransitionEdge.displayName = 'TransitionEdge';
export default TransitionEdge;
