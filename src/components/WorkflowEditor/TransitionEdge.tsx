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
   source,
   target,
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

   /**
    * Self-loop geometry: when source and target are the same node, the
    * default bezier between right-source and top-target wraps tightly
    * around the corner and the label sits on top of the state card.
    * Replace the path with an explicit cubic that loops up and to the
    * right of the node, then place the label at the curve's peak —
    * well clear of the node bounds.
    */
   const isSelfLoop = source === target;
   const LOOP_OUT = 90; // how far right/up the loop extends
   let edgePath: string;
   let labelX: number;
   let labelY: number;

   if (isSelfLoop) {
      edgePath =
         `M ${sourceX} ${sourceY} ` +
         `C ${sourceX + LOOP_OUT} ${sourceY}, ` +
         `${targetX + LOOP_OUT} ${targetY - LOOP_OUT}, ` +
         `${targetX} ${targetY}`;
      // Curve peak — roughly the bezier midpoint of the control polygon
      // pushed out from the node so the label never collides with it.
      labelX = (sourceX + targetX) / 2 + LOOP_OUT * 0.85;
      labelY = (sourceY + targetY) / 2 - LOOP_OUT * 0.55;
   } else {
      const [path, lx, ly] = getBezierPath({
         sourceX,
         sourceY,
         targetX,
         targetY,
         sourcePosition,
         targetPosition,
      });
      edgePath = path;
      labelX = lx;
      labelY = ly;
   }

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
