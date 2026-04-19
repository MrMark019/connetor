import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface AndGateNodeProps {
  data: { label: string };
  selected?: boolean;
}

const AndGateNode: React.FC<AndGateNodeProps> = ({ data, selected }) => {
  return (
    <div className={`bg-white border-2 rounded-lg px-4 py-3 min-w-[140px] ${selected ? 'border-blue-500' : 'border-gray-300'}`}>
      <Handle type="target" position={Position.Left} id="in1" className="bg-green-500" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="in2" className="bg-green-500" style={{ top: '70%' }} />
      <div className="flex flex-col items-center gap-2">
        <svg width="80" height="50" viewBox="0 0 80 50">
          <path d="M 10 5 L 40 5 A 25 20 0 0 1 40 45 L 10 45 Z" fill="none" stroke="#333" strokeWidth="2" />
          <line x1="0" y1="15" x2="10" y2="15" stroke="#333" strokeWidth="2" />
          <line x1="0" y1="35" x2="10" y2="35" stroke="#333" strokeWidth="2" />
          <line x1="65" y1="25" x2="80" y2="25" stroke="#333" strokeWidth="2" />
        </svg>
        <span className="text-sm font-medium text-gray-800">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="bg-green-500" />
    </div>
  );
};

export default memo(AndGateNode);
