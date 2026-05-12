import React, { FC, memo } from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';

/**
 * Custom node for a workflow state. Renders a rounded gold-tinted
 * card. Selected state glows; hovered state shows a faint ring.
 *
 * Two handles on each side so transitions can flow left/right or
 * top/bottom — gives the auto-layout some slack without us needing a
 * proper dagre pass.
 */
type StateNodeData = {
   label: string;
   transitionCount?: number;
};

const StateNodeComponent: FC<NodeProps> = ({ data, selected }) => {
   const nodeData = (data ?? {}) as StateNodeData;
   return (
      <div
         className={[
            'group rounded-lg border-2 px-4 py-3 min-w-[140px] text-center transition-all duration-200 shadow-sm',
            selected
               ? 'border-[#B28309] bg-[#B28309]/10 shadow-[0_0_0_4px_rgba(178,131,9,0.18)]'
               : 'border-gray-200 bg-white hover:border-[#B28309]/40 hover:shadow-[0_0_0_4px_rgba(178,131,9,0.08)]',
         ].join(' ')}
      >
         <Handle
            type="target"
            position={Position.Left}
            className="!bg-[#B28309] !border-white !w-2 !h-2"
         />
         <Handle
            type="target"
            position={Position.Top}
            id="target-top"
            className="!bg-[#B28309] !border-white !w-2 !h-2"
         />
         <div
            className={[
               'text-sm font-semibold',
               selected ? 'text-[#B28309]' : 'text-[#0F2552]',
            ].join(' ')}
         >
            {nodeData.label}
         </div>
         {typeof nodeData.transitionCount === 'number' && (
            <div className="text-[0.6rem] text-gray-400 mt-0.5 uppercase tracking-wider">
               {nodeData.transitionCount} out
            </div>
         )}
         <Handle
            type="source"
            position={Position.Right}
            className="!bg-[#B28309] !border-white !w-2 !h-2"
         />
         <Handle
            type="source"
            position={Position.Bottom}
            id="source-bottom"
            className="!bg-[#B28309] !border-white !w-2 !h-2"
         />
      </div>
   );
};

export const StateNode = memo(StateNodeComponent);
StateNode.displayName = 'StateNode';
export default StateNode;
