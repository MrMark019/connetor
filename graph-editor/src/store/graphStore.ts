import { create } from 'zustand';
import { GraphData } from '../types/graph';

interface GraphStore {
  graphData: GraphData;
  setGraphData: (data: GraphData, skipHistory?: boolean) => void;
  addNode: (node: GraphData['nodes'][0]) => void;
  updateNode: (id: string, data: Partial<GraphData['nodes'][0]>) => void;
  removeNode: (id: string) => void;
  updateEdge: (id: string, data: Partial<GraphData['edges'][0]>) => void;
  importGraph: (data: GraphData) => void;
  exportGraph: () => GraphData;
  onBeforeChange: (() => void) | null;
  setOnBeforeChange: (callback: (() => void) | null) => void;
}

const initialGraphData: GraphData = {
  nodes: [
    { id: 'R1', type: 'resistor', label: '电阻R1', position: { x: 100, y: 150 }, data: { label: '电阻R1' } },
    { id: 'AND1', type: 'and_gate', label: '与门A', position: { x: 350, y: 100 }, data: { label: '与门A' } },
    { id: 'M1', type: 'custom_module', label: '模块M1', position: { x: 600, y: 150 }, data: { label: '模块M1' } },
  ],
  edges: [
    { 
      id: 'e1', 
      source: 'R1', 
      target: 'AND1', 
      sourceHandle: 'out', 
      targetHandle: 'in1', 
      data: { gain: '+1', direction: 'forward', label: '信号1' } 
    },
    { 
      id: 'e2', 
      source: 'AND1', 
      target: 'M1', 
      sourceHandle: 'out', 
      targetHandle: 'in', 
      data: { gain: '-1', direction: 'forward', signalType: 'feedback', label: '反馈' } 
    },
  ],
  meta: {},
};

export const useGraphStore = create<GraphStore>((set, get) => ({
  graphData: initialGraphData,
  onBeforeChange: null,
  
  setOnBeforeChange: (callback) => set({ onBeforeChange: callback }),
  
  setGraphData: (data, skipHistory = false) => {
    console.log('[Store] setGraphData - skipHistory:', skipHistory, 'nodes:', data.nodes.length, 'edges:', data.edges.length);
    if (!skipHistory) {
      get().onBeforeChange?.();
    }
    set({ graphData: data });
  },
  
  addNode: (node) => {
    get().onBeforeChange?.();
    set((state) => ({
      graphData: {
        ...state.graphData,
        nodes: [...state.graphData.nodes, node],
      },
    }));
  },
  
  updateNode: (id, data) => {
    get().onBeforeChange?.();
    return set((state) => ({
      graphData: {
        ...state.graphData,
        nodes: state.graphData.nodes.map(n => {
          if (n.id !== id) return n;
          const updatedData = { ...n.data, ...data };
          const updatedNode: typeof n = { ...n, data: updatedData };
          if (data.label !== undefined) {
            updatedNode.label = data.label;
          }
          return updatedNode;
        }),
      },
    }));
  },
  
  removeNode: (id) => {
    get().onBeforeChange?.();
    set((state) => ({
      graphData: {
        ...state.graphData,
        nodes: state.graphData.nodes.filter(n => n.id !== id),
        edges: state.graphData.edges.filter(e => e.source !== id && e.target !== id),
      },
    }));
  },
  
  updateEdge: (id, data) => {
    get().onBeforeChange?.();
    set((state) => ({
      graphData: {
        ...state.graphData,
        edges: state.graphData.edges.map(e => 
          e.id === id ? { ...e, data: { ...e.data, ...data } } : e
        ),
      },
    }));
  },
  
  importGraph: (data) => {
    get().onBeforeChange?.();
    set({ graphData: data });
  },
  
  exportGraph: () => get().graphData,
}));
