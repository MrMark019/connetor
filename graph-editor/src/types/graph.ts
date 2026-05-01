export type GraphMode = 'direct' | 'netlist';

export interface Port {
  id: string;
  label: string;
  type: 'input' | 'output';
}

export interface Net {
  id: string;
  name: string;
}

export interface NodeData {
  label: string;
  type: string;
  description?: string;
  ports?: Port[];
  rotation?: number;
  netId?: string;
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
  netId?: string;
  [key: string]: any;
}

export interface GraphData {
  mode?: GraphMode;
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
  nets?: Net[];
  meta?: {
    exportNL?: string;
    notes?: string;
    nlFormat?: 'edge' | 'net';
    [key: string]: any;
  };
}
