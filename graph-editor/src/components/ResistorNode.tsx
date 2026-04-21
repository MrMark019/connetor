import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

interface ResistorNodeProps {
  data: { label: string };
  selected?: boolean;
}

const ResistorNode: React.FC<ResistorNodeProps> = ({ data, selected }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border-2 rounded-lg px-4 py-3 min-w-[120px] ${selected ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}>
      <Handle type="target" position={Position.Left} className="bg-blue-500" />
      <div className="flex flex-col items-center gap-2">
        <svg width="80" height="40" viewBox="0 0 80 40" className="dark:[&_line]:stroke-gray-300 dark:[&_polyline]:stroke-gray-300">
          <line x1="0" y1="20" x2="15" y2="20" stroke="#333" strokeWidth="2" />
          <polyline points="15,20 20,10 30,30 40,10 50,30 60,10 65,20" fill="none" stroke="#333" strokeWidth="2" />
          <line x1="65" y1="20" x2="80" y2="20" stroke="#333" strokeWidth="2" />
        </svg>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="bg-blue-500" />
    </div>
  );
};

export default memo(ResistorNode);
