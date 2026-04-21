import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ResistorNode from './ResistorNode';
import AndGateNode from './AndGateNode';
import CustomModuleNode from './CustomModuleNode';
import CustomEdge from './CustomEdge';
import { useGraphStore } from '../store/graphStore';
import { GraphData } from '../types/graph';

const nodeTypes = {
  resistor: ResistorNode,
  and_gate: AndGateNode,
  custom_module: CustomModuleNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CanvasProps {
  onElementSelect: (element: Node | Edge | null) => void;
  onSelectionChange: (nodes: Node[], edges: Edge[]) => void;
}

const SelectionInfo: React.FC<{ selectedNodes: number; selectedEdges: number }> = ({ selectedNodes, selectedEdges }) => {
  if (selectedNodes === 0 && selectedEdges === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded shadow text-xs text-gray-600 dark:text-gray-300">
      已选中: {selectedNodes} 个节点, {selectedEdges} 条连线
      <span className="ml-2 text-blue-600 dark:text-blue-400">Ctrl+C 复制 | Ctrl+V 粘贴 | Ctrl+Z 撤销 | Ctrl+Y 重做 | Delete 删除</span>
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = ({ onElementSelect, onSelectionChange }) => {
  const { graphData, setGraphData, setOnBeforeChange } = useGraphStore();
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodeIdCounter = useRef(10);
  const isInitialized = useRef(false);
  
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<{ nodeIds: Set<string>; edgeIds: Set<string> }>({ 
    nodeIds: new Set(), 
    edgeIds: new Set() 
  });
  const [clipboard, setClipboard] = useState<Node[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [history, setHistory] = useState<GraphData[]>([]);
  const historyRef = useRef<GraphData[]>([]);
  const [redo, setRedo] = useState<GraphData[]>([]);
  const redoRef = useRef<GraphData[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const prevGraphDataRef = useRef<string>('');
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const graphDataRef = useRef(graphData);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    redoRef.current = redo;
  }, [redo]);

  useEffect(() => {
    setOnBeforeChange(() => {
      const snapshot = JSON.parse(JSON.stringify(graphDataRef.current));
      console.log('[History] Auto-saved state - nodes:', snapshot.nodes.length, 'edges:', snapshot.edges.length);
      console.log('[History] Node IDs:', snapshot.nodes.map((n: any) => n.id));
      setHistory((prev) => {
        const newHistory = [...prev, snapshot];
        console.log('[History] Stack size:', newHistory.length);
        return newHistory.slice(-50);
      });
      setRedo([]);
    });
  }, [setOnBeforeChange]);

  const pushHistory = useCallback(() => {
    const snapshot = JSON.parse(JSON.stringify(graphDataRef.current));
    console.log('[History] Manual push - nodes:', snapshot.nodes.length, 'edges:', snapshot.edges.length);
    console.log('[History] Node IDs:', snapshot.nodes.map((n: any) => n.id));
    setHistory((prev) => {
      const newHistory = [...prev, snapshot];
      console.log('[History] Stack size:', newHistory.length);
      return newHistory.slice(-50);
    });
    setRedo([]);
  }, []);

  useEffect(() => {
    if (!isInitialized.current) {
      console.log('[Canvas] Initial load - nodes:', graphData.nodes.length, 'edges:', graphData.edges.length);
      const initialNodes = graphData.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      }));

      const initialEdges = graphData.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: e.data,
      }));

      setNodes(initialNodes);
      setEdges(initialEdges);
      isInitialized.current = true;
      prevGraphDataRef.current = JSON.stringify(graphData);
    } else {
      const currentGraphDataStr = JSON.stringify(graphData);
      if (currentGraphDataStr !== prevGraphDataRef.current) {
        console.log('[Canvas] graphData changed, syncing to canvas');
        console.log('[Canvas] store nodes:', graphData.nodes.map(n => n.id));
        console.log('[Canvas] canvas nodes:', nodesRef.current.map(n => n.id));
        prevGraphDataRef.current = currentGraphDataStr;
        
        const storeNodeIds = new Set(graphData.nodes.map(n => n.id));
        const canvasNodeIds = new Set(nodesRef.current.map(n => n.id));
        
        const hasNewNodes = graphData.nodes.some(n => !canvasNodeIds.has(n.id));
        const hasDeletedNodes = nodesRef.current.some(n => !storeNodeIds.has(n.id));
        const hasUpdatedNodes = graphData.nodes.some(storeNode => {
          const canvasNode = nodesRef.current.find(n => n.id === storeNode.id);
          return canvasNode && JSON.stringify(storeNode.data) !== JSON.stringify(canvasNode.data);
        });

        const storeEdgeIds = new Set(graphData.edges.map(e => e.id));
        const canvasEdgeIds = new Set(edgesRef.current.map(e => e.id));
        const hasNewEdges = graphData.edges.some(e => !canvasEdgeIds.has(e.id));
        const hasDeletedEdges = edgesRef.current.some(e => !storeEdgeIds.has(e.id));
        const hasUpdatedEdges = graphData.edges.some(storeEdge => {
          const canvasEdge = edgesRef.current.find(e => e.id === storeEdge.id);
          return canvasEdge && JSON.stringify(storeEdge.data) !== JSON.stringify(canvasEdge.data);
        });
        console.log('[Canvas] Edge changes - new:', hasNewEdges, 'deleted:', hasDeletedEdges, 'updated:', hasUpdatedEdges);

        if (hasNewNodes || hasDeletedNodes || hasNewEdges || hasDeletedEdges) {
          console.log('[Canvas] Full sync - new:', hasNewNodes, 'deleted:', hasDeletedNodes);
          
          const newNodes = graphData.nodes.map(n => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          }));

          const newEdges = graphData.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            type: 'custom',
            markerEnd: { type: MarkerType.ArrowClosed },
            data: e.data,
          }));

          setNodes(newNodes);
          setEdges(newEdges);
        } else if (hasUpdatedNodes || hasUpdatedEdges) {
          console.log('[Canvas] Syncing data updates only');

          setNodes((nds) =>
            nds.map((n) => {
              const storeNode = graphData.nodes.find((gn) => gn.id === n.id);
              if (storeNode && JSON.stringify(storeNode.data) !== JSON.stringify(n.data)) {
                console.log('[Canvas] Updating node:', n.id, 'old:', n.data, 'new:', storeNode.data);
                return { ...n, data: storeNode.data };
              }
              return n;
            })
          );

          setEdges((eds) =>
            eds.map((e) => {
              const storeEdge = graphData.edges.find((ge) => ge.id === e.id);
              if (storeEdge && JSON.stringify(storeEdge.data) !== JSON.stringify(e.data)) {
                return { ...e, data: storeEdge.data };
              }
              return e;
            })
          );
        }
      }
    }
  }, [graphData]);

  const syncToStore = useCallback(() => {
    const currentNodes = nodesRef.current.map(n => ({
      id: n.id,
      type: n.type || 'default',
      label: n.data?.label || n.id,
      position: n.position,
      data: n.data,
    }));

    const currentEdges = edgesRef.current.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      data: e.data || {},
    }));

    setGraphData({
      nodes: currentNodes,
      edges: currentEdges,
      meta: graphDataRef.current.meta || {},
    }, true);
  }, [setGraphData]);

  const onConnect = useCallback(
    (params: Connection) => {
      pushHistory();
      const newEdge = {
        ...params,
        id: `e${Date.now()}`,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { gain: '+1', direction: 'forward' },
      };
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        setTimeout(() => {
          setNodes((nds) => {
            const currentNodes = nds.map(n => ({
              id: n.id,
              type: n.type || 'default',
              label: n.data?.label || n.id,
              position: n.position,
              data: n.data,
            }));
            const currentEdges = updatedEdges.map(e => ({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              data: e.data || {},
            }));
            setGraphData({
              nodes: currentNodes,
              edges: currentEdges,
              meta: graphDataRef.current.meta || {},
            }, true);
            return nds;
          });
        }, 0);
        return updatedEdges;
      });
    },
    [setEdges, setGraphData, setNodes, pushHistory]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const typeLabels: Record<string, string> = {
        resistor: '电阻',
        and_gate: '与门',
        custom_module: '模块',
      };

      const defaultPorts = type === 'custom_module' ? [
        { id: 'in1', label: '输入', type: 'input' as const },
        { id: 'out1', label: '输出', type: 'output' as const },
      ] : undefined;

      const newNode: Node = {
        id: `${type}${nodeIdCounter.current++}`,
        type,
        position,
        data: { 
          label: `${typeLabels[type]}${nodeIdCounter.current - 1}`,
          ...(defaultPorts && { ports: defaultPorts }),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      pushHistory();
      setGraphData({
        ...graphDataRef.current,
        nodes: [...graphDataRef.current.nodes, {
          id: newNode.id,
          type: newNode.type || 'default',
          label: newNode.data.label,
          position: newNode.position,
          data: newNode.data,
        }],
      }, true);
    },
    [setNodes, screenToFlowPosition, setGraphData, pushHistory]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onElementSelect(node);
      setSelectedIds({ nodeIds: new Set([node.id]), edgeIds: new Set() });
      setNodes((nds) => nds.map(n => ({ ...n, selected: n.id === node.id })));
      setEdges((eds) => eds.map(e => ({ ...e, selected: false })));
    },
    [onElementSelect, setNodes, setEdges]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onElementSelect(edge);
      setSelectedIds({ nodeIds: new Set(), edgeIds: new Set([edge.id]) });
      setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
      setEdges((eds) => eds.map(e => ({ ...e, selected: e.id === edge.id })));
    },
    [onElementSelect, setNodes, setEdges]
  );

  const onPaneClick = useCallback(() => {
    onElementSelect(null);
    setSelectedIds({ nodeIds: new Set(), edgeIds: new Set() });
    setNodes((nds) => nds.map(n => ({ ...n, selected: false })));
    setEdges((eds) => eds.map(e => ({ ...e, selected: false })));
    setContextMenu(null);
  }, [onElementSelect, setNodes, setEdges]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
    setSelectedIds({ nodeIds: new Set([node.id]), edgeIds: new Set() });
    setNodes((nds) => nds.map(n => ({ ...n, selected: n.id === node.id })));
    setEdges((eds) => eds.map(e => ({ ...e, selected: false })));
  }, [setNodes, setEdges]);

  const handleCopyFromContext = useCallback(() => {
    if (contextMenu) {
      const node = nodesRef.current.find(n => n.id === contextMenu.nodeId);
      if (node) {
        setClipboard([node]);
      }
    }
    setContextMenu(null);
  }, [contextMenu]);

  const handlePasteFromContext = useCallback(() => {
    if (clipboard.length > 0 && contextMenu) {
      const targetNode = nodesRef.current.find(n => n.id === contextMenu.nodeId);
      if (!targetNode) return;

      pushHistory();
      const newNodes = clipboard.map(node => {
        const newId = `${node.type}${nodeIdCounter.current++}`;
        return {
          ...node,
          id: newId,
          position: { ...targetNode.position },
        };
      });

      setNodes((nds) => {
        const withoutTarget = nds.filter(n => n.id !== contextMenu.nodeId);
        return [...withoutTarget, ...newNodes];
      });

      setGraphData({
        ...graphDataRef.current,
        nodes: [
          ...graphDataRef.current.nodes.filter(n => n.id !== contextMenu.nodeId),
          ...newNodes.map(n => ({
            id: n.id,
            type: n.type || 'default',
            label: n.data?.label || n.id,
            position: n.position,
            data: n.data,
          })),
        ],
      }, true);
    }
    setContextMenu(null);
  }, [clipboard, contextMenu, setNodes, setGraphData, pushHistory]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 2) {
      event.preventDefault();
      setIsSelecting(true);
      setStartPos({ x: event.clientX, y: event.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !startPos || !reactFlowWrapper.current) return;

    const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
    const x = Math.min(startPos.x, event.clientX) - wrapperRect.left;
    const y = Math.min(startPos.y, event.clientY) - wrapperRect.top;
    const width = Math.abs(event.clientX - startPos.x);
    const height = Math.abs(event.clientY - startPos.y);

    setSelectionBox({ x, y, width, height });
  }, [isSelecting, startPos]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !selectionBox || !reactFlowWrapper.current) {
      setIsSelecting(false);
      setSelectionBox(null);
      setStartPos(null);
      return;
    }

    const wrapperRect = reactFlowWrapper.current.getBoundingClientRect();
    
    const boxLeft = selectionBox.x;
    const boxTop = selectionBox.y;
    const boxRight = selectionBox.x + selectionBox.width;
    const boxBottom = selectionBox.y + selectionBox.height;

    const flowTopLeft = screenToFlowPosition({ x: boxLeft + wrapperRect.left, y: boxTop + wrapperRect.top });
    const flowBottomRight = screenToFlowPosition({ x: boxRight + wrapperRect.left, y: boxBottom + wrapperRect.top });

    const selectedNodeIds = new Set<string>();
    const selectedEdgeIds = new Set<string>();

    nodes.forEach(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      if (
        nodeX >= flowTopLeft.x &&
        nodeX <= flowBottomRight.x &&
        nodeY >= flowTopLeft.y &&
        nodeY <= flowBottomRight.y
      ) {
        selectedNodeIds.add(node.id);
      }
    });

    edges.forEach(edge => {
      if (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)) {
        selectedEdgeIds.add(edge.id);
      }
    });

    setSelectedIds({ nodeIds: selectedNodeIds, edgeIds: selectedEdgeIds });
    
    setNodes((nds) => nds.map(n => ({ ...n, selected: selectedNodeIds.has(n.id) })));
    setEdges((eds) => eds.map(e => ({ ...e, selected: selectedEdgeIds.has(e.id) })));

    const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
    const selectedEdges = edges.filter(e => selectedEdgeIds.has(e.id));
    onSelectionChange(selectedNodes, selectedEdges);

    setIsSelecting(false);
    setSelectionBox(null);
    setStartPos(null);
  }, [isSelecting, selectionBox, nodes, edges, screenToFlowPosition, setNodes, setEdges, onSelectionChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement | null;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable ||
      activeElement.closest('input') !== null ||
      activeElement.closest('textarea') !== null
    );

    if (isInputFocused) return;

    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      console.log('[Undo] Ctrl+Z pressed');
      console.log('[Undo] history length:', historyRef.current.length);
      console.log('[Undo] redo length:', redoRef.current.length);
      if (historyRef.current.length > 0) {
        const prevState = historyRef.current[historyRef.current.length - 1];
        const currentState = JSON.parse(JSON.stringify(graphDataRef.current));
        console.log('[Undo] Restoring state - nodes:', prevState.nodes.length, 'edges:', prevState.edges.length);
        console.log('[Undo] Current state - nodes:', currentState.nodes.length, 'edges:', currentState.edges.length);
        console.log('[Undo] Node IDs in prev:', prevState.nodes.map((n: any) => n.id));
        console.log('[Undo] Node IDs in current:', currentState.nodes.map((n: any) => n.id));
        setRedo((prev) => [...prev, currentState]);
        setHistory((prev) => prev.slice(0, -1));
        setGraphData(prevState, true);
      } else {
        console.log('[Undo] History is empty, nothing to undo');
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      console.log('[Redo] Ctrl+Y pressed');
      console.log('[Redo] history length:', historyRef.current.length);
      console.log('[Redo] redo length:', redoRef.current.length);
      if (redoRef.current.length > 0) {
        const nextState = redoRef.current[redoRef.current.length - 1];
        const currentState = JSON.parse(JSON.stringify(graphDataRef.current));
        console.log('[Redo] Restoring state - nodes:', nextState.nodes.length, 'edges:', nextState.edges.length);
        console.log('[Redo] Current state - nodes:', currentState.nodes.length, 'edges:', currentState.edges.length);
        setHistory((prev) => [...prev.slice(-49), currentState]);
        setRedo((prev) => prev.slice(0, -1));
        setGraphData(nextState, true);
      } else {
        console.log('[Redo] Redo stack is empty, nothing to redo');
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      if (selectedIds.nodeIds.size > 0) {
        const copiedNodes = nodesRef.current.filter(n => selectedIds.nodeIds.has(n.id));
        setClipboard(copiedNodes);
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      if (clipboard.length > 0) {
        pushHistory();
        const newNodes = clipboard.map(node => {
          const newId = `${node.type}${nodeIdCounter.current++}`;
          return {
            ...node,
            id: newId,
            position: {
              x: node.position.x + 30,
              y: node.position.y + 30,
            },
          };
        });

        setNodes((nds) => [...nds, ...newNodes]);
        setGraphData({
          ...graphDataRef.current,
          nodes: [
            ...graphDataRef.current.nodes,
            ...newNodes.map(n => ({
              id: n.id,
              type: n.type || 'default',
              label: n.data?.label || n.id,
              position: n.position,
              data: n.data,
            })),
          ],
        }, true);
      }
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedIds.nodeIds.size > 0) {
        console.log('[Delete] Deleting nodes:', Array.from(selectedIds.nodeIds));
        console.log('[Delete] Current canvas nodes:', nodesRef.current.map(n => n.id));
        pushHistory();
        setNodes((nds) => {
          const updatedNodes = nds.filter(n => !selectedIds.nodeIds.has(n.id));
          console.log('[Delete] Nodes after filter:', updatedNodes.map(n => n.id));
          return updatedNodes;
        });
        setEdges((eds) => {
          const updatedEdges = eds.filter(e =>
            !selectedIds.nodeIds.has(e.source) &&
            !selectedIds.nodeIds.has(e.target) &&
            !selectedIds.edgeIds.has(e.id)
          );
          setTimeout(() => {
            const currentNodes = nodesRef.current.filter(n => !selectedIds.nodeIds.has(n.id));
            const currentEdges = edgesRef.current.filter(e =>
              !selectedIds.nodeIds.has(e.source) &&
              !selectedIds.nodeIds.has(e.target) &&
              !selectedIds.edgeIds.has(e.id)
            );
            console.log('[Delete] Syncing to store, nodes:', currentNodes.map(n => n.id), 'edges:', currentEdges.map(e => e.id));
            setGraphData({
              nodes: currentNodes.map(n => ({
                id: n.id,
                type: n.type || 'default',
                label: n.data?.label || n.id,
                position: n.position,
                data: n.data,
              })),
              edges: currentEdges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                data: e.data || {},
              })),
              meta: graphDataRef.current.meta || {},
            }, true);
          }, 0);
          return updatedEdges;
        });
      } else if (selectedIds.edgeIds.size > 0) {
        console.log('[Delete] Deleting edges:', Array.from(selectedIds.edgeIds));
        pushHistory();
        setEdges((eds) => {
          const updatedEdges = eds.filter(e => !selectedIds.edgeIds.has(e.id));
          setTimeout(() => {
            const currentEdges = edgesRef.current.filter(e => !selectedIds.edgeIds.has(e.id));
            console.log('[Delete] Syncing edge delete to store, remaining edges:', currentEdges.map(e => e.id));
            setGraphData({
              nodes: nodesRef.current.map(n => ({
                id: n.id,
                type: n.type || 'default',
                label: n.data?.label || n.id,
                position: n.position,
                data: n.data,
              })),
              edges: currentEdges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                data: e.data || {},
              })),
              meta: graphDataRef.current.meta || {},
            }, true);
          }, 0);
          return updatedEdges;
        });
      }
      setSelectedIds({ nodeIds: new Set(), edgeIds: new Set() });
    }
  }, [selectedIds, setNodes, setEdges, clipboard, setGraphData, pushHistory]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-context-menu]')) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      window.addEventListener('mousedown', handleClick);
      return () => window.removeEventListener('mousedown', handleClick);
    }
  }, [contextMenu]);

  const selectedNodesCount = selectedIds.nodeIds.size;
  const selectedEdgesCount = selectedIds.edgeIds.size;

  return (
    <div 
      ref={reactFlowWrapper} 
      className="flex-1 h-full relative"
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        panOnDrag={true}
        zoomOnScroll={true}
        selectionOnDrag={false}
        defaultEdgeOptions={{
          type: 'custom',
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-right">
          <SelectionInfo selectedNodes={selectedNodesCount} selectedEdges={selectedEdgesCount} />
        </Panel>
      </ReactFlow>

      {selectionBox && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
            border: '2px dashed rgba(59, 130, 246, 0.8)',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '4px',
          }}
        />
      )}

      {contextMenu && (
        <div
          className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-[120px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          data-context-menu
        >
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-800 dark:text-gray-200"
            onClick={handleCopyFromContext}
          >
            <span>📋</span> 复制
          </button>
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200"
            onClick={handlePasteFromContext}
            disabled={clipboard.length === 0}
          >
            <span>📌</span> 粘贴
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;
