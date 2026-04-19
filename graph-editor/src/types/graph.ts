export interface Port {
  id: string;
  label: string;
  type: 'input' | 'output';
}

export interface NodeData {
  label: string;
  type: string;
  description?: string;
  ports?: Port[];
  [key: string]: any;
}

export interface EdgeData {
  label?: string;
  gain?: string;
  direction?: string;
  signalType?: string;
  delay?: string;
  weight?: number | string;
  condition?: string;
  customDescription?: string;
  [key: string]: any;
}

export interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    position: { x: number; y: number };
    data: NodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    data: EdgeData;
  }>;
  meta?: {
    exportNL?: string;
    notes?: string;
    [key: string]: any;
  };
}
