import React, { useState, useCallback, useEffect } from 'react';
import { Button, message, Modal, Switch } from 'antd';
import { DownloadOutlined, UploadOutlined, FileTextOutlined, BugOutlined, CopyOutlined, BulbOutlined } from '@ant-design/icons';
import { ReactFlowProvider, Node, Edge } from '@xyflow/react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import PropertyPanel from './components/PropertyPanel';
import { useGraphStore } from './store/graphStore';
import { exportToText } from './utils/nlg';
import { GraphData } from './types/graph';

const App: React.FC = () => {
  const { graphData, importGraph, setMode, setGraphData } = useGraphStore();
  const [selectedElement, setSelectedElement] = useState<Node | Edge | null>(null);
  const [nlDescription, setNlDescription] = useState('');
  const [nlModalVisible, setNlModalVisible] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const currentMode = graphData.mode || 'direct';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!debugMode) return;

    const originalConsoleLog = console.log;
    const logQueue: string[] = [];
    let isFlushing = false;

    const flushLogs = () => {
      if (logQueue.length === 0 || isFlushing) return;
      isFlushing = true;
      const logs = logQueue.splice(0);
      setDebugLog(prev => [...prev.slice(-100), ...logs]);
      isFlushing = false;
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      const timestamp = new Date().toLocaleTimeString();
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      logQueue.push(`[${timestamp}] ${msg}`);
      requestAnimationFrame(flushLogs);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, [debugMode]);

  const handleExportNL = useCallback(() => {
    const text = exportToText(graphData);
    setNlDescription(text);
    setNlModalVisible(true);
  }, [graphData]);

  const handleToggleNLFormat = useCallback(() => {
    if (currentMode !== 'netlist') return;
    const currentFormat = graphData.meta?.nlFormat || 'net';
    const newFormat = currentFormat === 'net' ? 'edge' : 'net';
    setGraphData({
      ...graphData,
      meta: {
        ...graphData.meta,
        nlFormat: newFormat,
      },
    }, true);
    message.success(`已切换为${newFormat === 'net' ? '网表' : '连线'}描述格式`);
  }, [graphData, setGraphData, currentMode]);

  const handleCopyNL = useCallback(() => {
    navigator.clipboard.writeText(nlDescription).then(() => {
      message.success('已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  }, [nlDescription]);

  const handleExportJSON = useCallback(() => {
    const jsonStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-data.json';
    a.click();
    URL.revokeObjectURL(url);
    message.success('JSON 导出成功');
  }, [graphData]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as GraphData;
          if (!data.nodes || !data.edges) {
            message.error('无效的图数据格式');
            return;
          }
          const fileMode = data.mode || 'direct';
          const currentMode = graphData.mode || 'direct';
          if (fileMode !== currentMode) {
            message.error(`文件模式为 ${fileMode === 'netlist' ? '网表' : '直连'} 模式，与当前模式不匹配`);
            return;
          }
          importGraph(data);
          message.success('JSON 导入成功');
        } catch (error) {
          message.error('JSON 解析失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [importGraph, graphData.mode]);

  const handleToggleMode = useCallback(() => {
    const hasContent = graphData.nodes.length > 0 || graphData.edges.length > 0;
    if (hasContent) {
      Modal.confirm({
        title: '切换模式',
        content: '切换模式将清空当前画布，是否继续？',
        okText: '继续',
        cancelText: '取消',
        onOk: () => {
          const newMode = currentMode === 'direct' ? 'netlist' : 'direct';
          setGraphData({
            mode: newMode,
            nodes: [],
            edges: [],
            nets: newMode === 'netlist' ? [] : undefined,
            meta: {},
          });
          setMode(newMode);
          message.success(`已切换到 ${newMode === 'netlist' ? '网表' : '直连'} 模式`);
        },
      });
    } else {
      const newMode = currentMode === 'direct' ? 'netlist' : 'direct';
      setGraphData({
        mode: newMode,
        nodes: [],
        edges: [],
        nets: newMode === 'netlist' ? [] : undefined,
        meta: {},
      });
      setMode(newMode);
      message.success(`已切换到 ${newMode === 'netlist' ? '网表' : '直连'} 模式`);
    }
  }, [currentMode, graphData.nodes.length, graphData.edges.length, setGraphData, setMode]);

  return (
    <ReactFlowProvider>
      <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 shrink-0">
            <Button
              icon={<FileTextOutlined />}
              onClick={handleExportNL}
              type="primary"
            >
              导出描述
            </Button>
            {currentMode === 'netlist' && (
              <Button
                size="small"
                onClick={handleToggleNLFormat}
              >
                {(graphData.meta?.nlFormat || 'net') === 'net' ? '网表描述' : '连线描述'}
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportJSON}
            >
              导出 JSON
            </Button>
            <Button
              icon={<UploadOutlined />}
              onClick={handleImportJSON}
            >
              导入 JSON
            </Button>
            <Button
              onClick={handleToggleMode}
              type={currentMode === 'netlist' ? 'primary' : 'default'}
              danger={currentMode === 'netlist'}
            >
              {currentMode === 'netlist' ? '网表模式' : '直连模式'}
            </Button>

            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BulbOutlined className={darkMode ? 'text-yellow-400' : 'text-gray-400'} />
                <span className="text-sm text-gray-600 dark:text-gray-300">深色模式</span>
                <Switch checked={darkMode} onChange={setDarkMode} size="small" />
              </div>
              <div className="flex items-center gap-2">
                <BugOutlined className={debugMode ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'} />
                <span className="text-sm text-gray-600 dark:text-gray-300">调试模式</span>
                <Switch checked={debugMode} onChange={setDebugMode} size="small" />
              </div>
            </div>
          </div>
          <div className="flex-1 h-0 flex">
            <div className="flex-1">
              <Canvas
                onElementSelect={setSelectedElement}
                onSelectionChange={(nodes, edges) => {
                  if (nodes.length > 0 || edges.length > 0) {
                    console.log('选中:', nodes.length, '节点,', edges.length, '连线');
                  }
                }}
              />
            </div>
            {debugMode && (
              <div className="w-96 bg-gray-900 text-green-400 p-3 overflow-y-auto font-mono text-xs border-l border-gray-700">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
                  <span className="font-bold text-white">调试日志</span>
                  <Button size="small" onClick={() => setDebugLog([])} className="text-xs">清空</Button>
                </div>
                <div className="space-y-1">
                  {debugLog.map((log, i) => (
                    <div key={i} className="break-all">{log}</div>
                  ))}
                  {debugLog.length === 0 && (
                    <div className="text-gray-500">暂无日志，请操作以生成调试信息</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <PropertyPanel
          selectedElement={selectedElement}
          onClose={() => setSelectedElement(null)}
        />
        <Modal
          title="自然语言描述"
          open={nlModalVisible}
          onCancel={() => setNlModalVisible(false)}
          footer={[
            <Button
              key="copy"
              icon={<CopyOutlined />}
              onClick={handleCopyNL}
            >
              复制
            </Button>,
            <Button key="close" onClick={() => setNlModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={600}
        >
          <pre className="bg-gray-50 dark:bg-gray-800 dark:text-gray-200 p-4 rounded text-sm whitespace-pre-wrap font-sans">
            {nlDescription}
          </pre>
        </Modal>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
