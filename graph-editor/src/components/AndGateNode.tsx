import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';

interface AndGateNodeProps {
  id: string;
  data: { label: string; rotation?: number };
  selected?: boolean;
}

const positions = [Position.Left, Position.Top, Position.Right, Position.Bottom];

const getRotatedPosition = (base: Position, rot: number): Position => {
  const index = positions.indexOf(base);
  return positions[(index + rot) % 4];
};

const getInputStyle = (percent: string, rot: number): React.CSSProperties => {
  const pos = getRotatedPosition(Position.Left, rot);
  if (pos === Position.Left || pos === Position.Right) {
    return { top: percent };
  }
  return { left: percent, transform: 'translateX(-50%)' };
};


const AndGateNode: React.FC<AndGateNodeProps> = ({ id, data, selected }) => {
  const rotation = (data.rotation || 0) % 4;
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [rotation, id, updateNodeInternals]);

  return (
    <div className={`bg-white dark:bg-gray-800 border-2 rounded-lg px-4 py-3 min-w-[140px] ${selected ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}>
      <Handle type="target" position={getRotatedPosition(Position.Left, rotation)} id="in1" className="bg-green-500" style={getInputStyle('30%', rotation)} />
      <Handle type="target" position={getRotatedPosition(Position.Left, rotation)} id="in2" className="bg-green-500" style={getInputStyle('70%', rotation)} />
      <div className="flex flex-col items-center gap-2">
        <svg width="80" height="50" viewBox="0 0 80 50" className="dark:[&_path]:stroke-gray-300 dark:[&_line]:stroke-gray-300">
          <path d="M 10 5 L 40 5 A 25 20 0 0 1 40 45 L 10 45 Z" fill="none" stroke="#333" strokeWidth="2" />
          <line x1="0" y1="15" x2="10" y2="15" stroke="#333" strokeWidth="2" />
          <line x1="0" y1="35" x2="10" y2="35" stroke="#333" strokeWidth="2" />
          <line x1="65" y1="25" x2="80" y2="25" stroke="#333" strokeWidth="2" />
        </svg>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{data.label}</span>
      </div>
      <Handle type="source" position={getRotatedPosition(Position.Right, rotation)} id="out" className="bg-green-500" />
    </div>
  );
};

export default memo(AndGateNode);
