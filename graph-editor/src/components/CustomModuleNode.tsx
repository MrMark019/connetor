import React, { memo, useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { Port } from '../types/graph';

interface CustomModuleNodeProps {
  id: string;
  data: { label: string; ports?: Port[]; rotation?: number };
  selected?: boolean;
}

const positions = [Position.Left, Position.Top, Position.Right, Position.Bottom];

const getRotatedPosition = (base: Position, rot: number): Position => {
  const index = positions.indexOf(base);
  return positions[(index + rot) % 4];
};

interface PortLayout {
  containerStyle: React.CSSProperties;
  handleStyle: React.CSSProperties;
  labelClass: string;
  flexDir: 'row' | 'row-reverse' | 'column' | 'column-reverse';
}

const getPortLayout = (pos: Position, offset: number): PortLayout => {
  switch (pos) {
    case Position.Left:
      return {
        containerStyle: { position: 'absolute' as const, left: 0, top: `${offset}px`, transform: 'translateY(-50%)' },
        handleStyle: { left: '-6px' },
        labelClass: 'ml-2',
        flexDir: 'row',
      };
    case Position.Top:
      return {
        containerStyle: { position: 'absolute' as const, top: 0, left: `${offset}px`, transform: 'translateX(-50%)' },
        handleStyle: { top: '-6px' },
        labelClass: 'mt-2',
        flexDir: 'column',
      };
    case Position.Right:
      return {
        containerStyle: { position: 'absolute' as const, right: 0, top: `${offset}px`, transform: 'translateY(-50%)' },
        handleStyle: { right: '-6px' },
        labelClass: 'mr-2',
        flexDir: 'row-reverse',
      };
    case Position.Bottom:
      return {
        containerStyle: { position: 'absolute' as const, bottom: 0, left: `${offset}px`, transform: 'translateX(-50%)' },
        handleStyle: { bottom: '-6px' },
        labelClass: 'mb-2',
        flexDir: 'column-reverse',
      };
  }
};

const CustomModuleNode: React.FC<CustomModuleNodeProps> = ({ id, data, selected }) => {
  const rotation = (data.rotation || 0) % 4;
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [rotation, id, updateNodeInternals]);

  const defaultPorts: Port[] = [
    { id: 'in1', label: '输入', type: 'input' },
    { id: 'out1', label: '输出', type: 'output' },
  ];

  const ports = data.ports && data.ports.length > 0 ? data.ports : defaultPorts;
  const inputPorts = ports.filter(p => p.type === 'input');
  const outputPorts = ports.filter(p => p.type === 'output');

  const maxPorts = Math.max(inputPorts.length, outputPorts.length, 1);
  const nodeHeight = Math.max(120, maxPorts * 45 + 40);
  const nodeWidth = 160;

  const getHandleOffset = (index: number, total: number, size: number) => {
    if (total === 1) return size / 2;
    const padding = 35;
    const available = size - padding * 2;
    const spacing = available / (total - 1 || 1);
    return padding + spacing * index;
  };

  const inputPos = getRotatedPosition(Position.Left, rotation);
  const outputPos = getRotatedPosition(Position.Right, rotation);
  const inputIsVertical = inputPos === Position.Left || inputPos === Position.Right;
  const outputIsVertical = outputPos === Position.Left || outputPos === Position.Right;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-2 rounded-lg relative ${selected ? 'border-blue-500 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}
      style={{ width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
    >
      {inputPorts.map((port, index) => {
        const offset = getHandleOffset(index, inputPorts.length, inputIsVertical ? nodeHeight : nodeWidth);
        const layout = getPortLayout(inputPos, offset);
        return (
          <div
            key={port.id}
            className="flex items-center"
            style={layout.containerStyle}
          >
            <Handle
              type="target"
              position={inputPos}
              id={port.id}
              className="!bg-purple-500 !w-3 !h-3"
              style={layout.handleStyle}
            />
            <span className={`text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap ${layout.labelClass}`}>{port.label}</span>
          </div>
        );
      })}

      <div className="flex flex-col items-center justify-center h-full gap-1 px-8">
        <div className="w-14 h-10 border-2 border-purple-500 rounded flex items-center justify-center bg-purple-50 dark:bg-purple-900/30">
          <span className="text-purple-700 dark:text-purple-300 font-bold text-sm">M</span>
        </div>
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 text-center leading-tight break-all">{data.label}</span>
      </div>

      {outputPorts.map((port, index) => {
        const offset = getHandleOffset(index, outputPorts.length, outputIsVertical ? nodeHeight : nodeWidth);
        const layout = getPortLayout(outputPos, offset);
        return (
          <div
            key={port.id}
            className="flex items-center"
            style={layout.containerStyle}
          >
            <Handle
              type="source"
              position={outputPos}
              id={port.id}
              className="!bg-purple-500 !w-3 !h-3"
              style={layout.handleStyle}
            />
            <span className={`text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap ${layout.labelClass}`}>{port.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default memo(CustomModuleNode);
