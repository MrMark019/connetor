import React from 'react';

const nodeTypes = [
  { type: 'resistor', label: '电阻', icon: 'R' },
  { type: 'and_gate', label: '与门', icon: '&' },
  { type: 'custom_module', label: '自定义模块', icon: 'M' },
];

const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">元件库</h3>
      {nodeTypes.map(node => (
        <div
          key={node.type}
          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 cursor-move hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          onDragStart={(event) => onDragStart(event, node.type)}
          draggable
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
              {node.icon}
            </div>
            <span className="text-sm text-gray-800 dark:text-gray-200">{node.label}</span>
          </div>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-medium text-gray-600 dark:text-gray-300 mb-2">操作说明</p>
        <p>📦 拖拽元件到画布</p>
        <p className="mt-1">🖱️ 双击节点/连线编辑属性</p>
        <p className="mt-1">🖱️ 右键拖拽框选</p>
        <p className="mt-1">🖱️ 左键拖拽平移画布</p>
        <p className="mt-1">🔄 滚轮缩放</p>
        <p className="mt-1">⌨️ Delete 删除选中项</p>
      </div>
    </div>
  );
};

export default Sidebar;
