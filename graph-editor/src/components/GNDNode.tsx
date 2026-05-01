import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';

interface GNDNodeProps {
  id: string;
  data: { label: string; rotation?: number };
  selected?: boolean;
}

const GNDNode: React.FC<GNDNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  return (
    <div className={`flex flex-col items-center ${selected ? 'opacity-80' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!bg-transparent !border-0 !w-0 !h-0"
        style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }}
      />
      <svg width="30" height="24" viewBox="0 0 30 24">
        <line x1="15" y1="0" x2="15" y2="10" stroke="#333" strokeWidth="2" className="dark:stroke-gray-300" />
        <line x1="5" y1="10" x2="25" y2="10" stroke="#333" strokeWidth="2" className="dark:stroke-gray-300" />
        <line x1="8" y1="14" x2="22" y2="14" stroke="#333" strokeWidth="2" className="dark:stroke-gray-300" />
        <line x1="11" y1="18" x2="19" y2="18" stroke="#333" strokeWidth="2" className="dark:stroke-gray-300" />
      </svg>
      <span className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">{data.label}</span>
      <Handle
        type="source"
        position={Position.Top}
        id="out"
        className="!bg-transparent !border-0 !w-0 !h-0"
        style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }}
      />
    </div>
  );
};

export default memo(GNDNode);
