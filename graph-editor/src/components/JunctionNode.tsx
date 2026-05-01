import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';

interface JunctionNodeProps {
  id: string;
  data: { label: string; netId?: string };
  selected?: boolean;
}

const JunctionNode: React.FC<JunctionNodeProps> = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  return (
    <div className="relative"
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!bg-transparent !border-transparent !w-2 !h-2"
        style={{ left: '-4px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <div
        className={`w-3 h-3 rounded-full ${selected ? 'bg-blue-500 ring-2 ring-blue-300' : 'bg-orange-500'}`}
        title={data.netId || ''}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!bg-transparent !border-transparent !w-2 !h-2"
        style={{ right: '-4px', top: '50%', transform: 'translateY(-50%)' }}
      />
    </div>
  );
};

export default memo(JunctionNode);
