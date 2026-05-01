import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

interface CustomEdgeProps extends EdgeProps {
  data: {
    gain?: string;
    direction?: string;
    label?: string;
    signalType?: string;
    netId?: string;
  };
}

const CustomEdge: React.FC<CustomEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const labelText = data?.label || '';
  const gainText = data?.gain || '';
  const netId = data?.netId;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs shadow border border-gray-200 dark:border-gray-600 whitespace-nowrap">
            {labelText && <span className="text-gray-700 dark:text-gray-300">{labelText}</span>}
            {gainText && <span className="ml-1 text-blue-600 dark:text-blue-400">({gainText})</span>}
            {netId && (
              <span className="ml-1 px-1 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-[10px] font-medium">
                {netId}
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;
