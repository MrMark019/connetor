import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Port } from '../types/graph';

interface CustomModuleNodeProps {
  data: { label: string; ports?: Port[] };
  selected?: boolean;
}

const CustomModuleNode: React.FC<CustomModuleNodeProps> = ({ data, selected }) => {
  const defaultPorts: Port[] = [
    { id: 'in1', label: '输入', type: 'input' },
    { id: 'out1', label: '输出', type: 'output' },
  ];

  const ports = data.ports && data.ports.length > 0 ? data.ports : defaultPorts;
  const inputPorts = ports.filter(p => p.type === 'input');
  const outputPorts = ports.filter(p => p.type === 'output');

  const maxPorts = Math.max(inputPorts.length, outputPorts.length, 1);
  const nodeHeight = Math.max(120, maxPorts * 45 + 40);

  const getHandleTop = (index: number, total: number) => {
    if (total === 1) return nodeHeight / 2;
    const padding = 35;
    const availableHeight = nodeHeight - padding * 2;
    const spacing = availableHeight / (total - 1 || 1);
    return padding + spacing * index;
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-2 rounded-lg relative ${selected ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
      style={{ width: '160px', height: `${nodeHeight}px` }}
    >
      {inputPorts.map((port, index) => (
        <div 
          key={port.id}
          className="flex items-center"
          style={{
            position: 'absolute',
            left: 0,
            top: `${getHandleTop(index, inputPorts.length)}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            id={port.id}
            className="!bg-purple-500 !w-3 !h-3"
            style={{ left: '-6px' }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 ml-3 whitespace-nowrap">{port.label}</span>
        </div>
      ))}

      <div className="flex flex-col items-center justify-center h-full gap-1 px-8">
        <div className="w-14 h-10 border-2 border-purple-500 rounded flex items-center justify-center bg-purple-50 dark:bg-purple-900/30">
          <span className="text-purple-700 dark:text-purple-300 font-bold text-sm">M</span>
        </div>
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 text-center leading-tight break-all">{data.label}</span>
      </div>

      {outputPorts.map((port, index) => (
        <div
          key={port.id}
          className="flex items-center flex-row-reverse"
          style={{
            position: 'absolute',
            right: 0,
            top: `${getHandleTop(index, outputPorts.length)}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <Handle
            type="source"
            position={Position.Right}
            id={port.id}
            className="!bg-purple-500 !w-3 !h-3"
            style={{ right: '-6px' }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 mr-3 whitespace-nowrap">{port.label}</span>
        </div>
      ))}
    </div>
  );
};

export default memo(CustomModuleNode);
