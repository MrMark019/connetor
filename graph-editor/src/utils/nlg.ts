import { GraphData } from '../types/graph';

const NODE_TYPE_NAMES: Record<string, string> = {
  resistor: '电阻',
  and_gate: '与门',
  custom_module: '模块',
  default: '节点',
  input: '输入',
  output: '输出',
  process: '处理',
  decision: '判断',
  data: '数据',
  trigger: '触发器',
  filter: '滤波器',
  amplifier: '放大器',
  sensor: '传感器',
  actuator: '执行器',
  controller: '控制器',
  gnd: 'GND',
  junction: '节点',
};

const DIRECTION_NAMES: Record<string, string> = {
  forward: '正向',
  backward: '反向',
  bidirectional: '双向',
};

const SIGNAL_TYPE_NAMES: Record<string, string> = {
  feedback: '反馈',
  input: '输入',
  output: '输出',
  control: '控制',
  data: '数据',
  trigger: '触发',
  event: '事件',
  condition: '条件',
};

function getNodeLabel(graphData: GraphData, nodeId: string): string {
  const node = graphData.nodes.find(n => n.id === nodeId);
  return (node?.data?.label as string) || node?.label || nodeId;
}

function getNodeTypeName(nodeType: string): string {
  return NODE_TYPE_NAMES[nodeType] || nodeType || '节点';
}

function getPortLabel(graphData: GraphData, nodeId: string, handleId?: string, isSource: boolean = false): string {
  if (!handleId) {
    return isSource ? '输出端' : '输入端';
  }

  const node = graphData.nodes.find(n => n.id === nodeId);
  const ports = node?.data?.ports;

  if (ports && ports.length > 0) {
    const port = ports.find(p => p.id === handleId);
    if (port) {
      return port.label;
    }
  }

  if (handleId.match(/^in\d*$/)) {
    const num = handleId.replace('in', '');
    return num ? `输入${num}` : '输入端';
  }
  if (handleId.match(/^out\d*$/)) {
    const num = handleId.replace('out', '');
    return num ? `输出${num}` : '输出端';
  }
  if (handleId.match(/^(port|p)\d*$/i)) {
    const num = handleId.replace(/^(port|p)/i, '');
    return num ? `端口${num}` : '端口';
  }

  return handleId;
}

function buildEdgeDescription(graphData: GraphData, edge: GraphData['edges'][0]): string {
  const sourceLabel = getNodeLabel(graphData, edge.source);
  const targetLabel = getNodeLabel(graphData, edge.target);

  const sourcePort = getPortLabel(graphData, edge.source, edge.sourceHandle, true);
  const targetPort = getPortLabel(graphData, edge.target, edge.targetHandle, false);

  const edgeData = edge.data || {};

  let description = `${sourceLabel}的${sourcePort}连接至${targetLabel}的${targetPort}`;

  const details: string[] = [];

  if (edgeData.label) {
    details.push(`标记为"${edgeData.label}"`);
  }

  if (edgeData.gain) {
    details.push(`增益为${edgeData.gain}`);
  }

  if (edgeData.direction) {
    const dirName = DIRECTION_NAMES[edgeData.direction] || edgeData.direction;
    details.push(`方向为${dirName}`);
  }

  if (edgeData.signalType) {
    const signalName = SIGNAL_TYPE_NAMES[edgeData.signalType] || edgeData.signalType;
    details.push(`类型为${signalName}`);
  }

  if (edgeData.delay) {
    details.push(`延迟为${edgeData.delay}`);
  }

  if (edgeData.weight !== undefined) {
    details.push(`权重为${edgeData.weight}`);
  }

  if (edgeData.condition) {
    details.push(`条件为"${edgeData.condition}"`);
  }

  if (edgeData.customDescription) {
    details.push(edgeData.customDescription);
  }

  if (details.length > 0) {
    description += '，' + details.join('，');
  }

  description += '。';
  return description;
}

function graphToNaturalLanguage(graphData: GraphData): string {
  if (graphData.nodes.length === 0) {
    return '当前图为空，没有节点。';
  }

  if (graphData.edges.length === 0) {
    const nodeLabels = graphData.nodes.map(n => n.label).join('、');
    return `当前图包含以下节点：${nodeLabels}，但没有连线。`;
  }

  const descriptions: string[] = [];

  graphData.edges.forEach((edge) => {
    const desc = buildEdgeDescription(graphData, edge);
    descriptions.push(desc);
  });

  return descriptions.join('\n');
}

function graphToNetlistNaturalLanguage(graphData: GraphData): string {
  // 从 edges 中收集所有实际使用的 netId
  const netIds = new Set<string>();
  graphData.edges.forEach(edge => {
    if (edge.data?.netId) netIds.add(edge.data.netId);
  });

  if (netIds.size === 0) {
    return '当前网表为空。';
  }

  // 建立 netId -> netName 的映射
  const netsMap = new Map<string, string>();
  graphData.nets?.forEach(net => netsMap.set(net.id, net.name));
  netIds.forEach(id => {
    if (!netsMap.has(id)) netsMap.set(id, id);
  });

  const descriptions: string[] = [];

  for (const [netId, netName] of netsMap) {
    const portInfos: Array<{ desc: string; junctionId?: string }> = [];

    for (const edge of graphData.edges) {
      if (edge.data?.netId !== netId) continue;

      // source 端（非 junction 模块）
      const sourceNode = graphData.nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.type !== 'junction') {
        const port = getPortLabel(graphData, edge.source, edge.sourceHandle, true);
        const targetNode = graphData.nodes.find(n => n.id === edge.target);
        const junctionId = targetNode?.type === 'junction' ? targetNode.id : undefined;
        portInfos.push({
          desc: `${getNodeLabel(graphData, edge.source)}的${port}`,
          junctionId,
        });
      }

      // target 端（非 junction 模块）
      const targetNode = graphData.nodes.find(n => n.id === edge.target);
      if (targetNode && targetNode.type !== 'junction') {
        const port = getPortLabel(graphData, edge.target, edge.targetHandle, false);
        const sourceNode2 = graphData.nodes.find(n => n.id === edge.source);
        const junctionId = sourceNode2?.type === 'junction' ? sourceNode2.id : undefined;
        portInfos.push({
          desc: `${getNodeLabel(graphData, edge.target)}的${port}`,
          junctionId,
        });
      }
    }

    // 去重
    const seen = new Set<string>();
    const uniquePortInfos = portInfos.filter(p => {
      const key = p.desc + (p.junctionId || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (uniquePortInfos.length > 0) {
      const netLabel = netId === 'Net0' ? 'GND' : netName;
      for (const info of uniquePortInfos) {
        if (info.junctionId) {
          descriptions.push(`${info.desc}通过${info.junctionId}接入${netLabel}`);
        } else {
          descriptions.push(`${info.desc}接入${netLabel}`);
        }
      }
    }
  }

  if (descriptions.length === 0) {
    return '当前网表为空。';
  }

  return descriptions.join('；\n') + '。';
}

export function generateSummary(graphData: GraphData): string {
  const nodeCount = graphData.nodes.length;
  const edgeCount = graphData.edges.length;

  if (nodeCount === 0) {
    return '空图';
  }

  const nodeTypes = new Set(graphData.nodes.map(n => n.type));
  const typeSummary = Array.from(nodeTypes)
    .map(t => `${getNodeTypeName(t)}(${graphData.nodes.filter(n => n.type === t).length})`)
    .join('、');

  return `共 ${nodeCount} 个节点（${typeSummary}），${edgeCount} 条连线`;
}

export function exportToText(graphData: GraphData): string {
  const mode = graphData.mode || 'direct';
  const nlFormat = graphData.meta?.nlFormat || 'edge';

  const summary = generateSummary(graphData);

  let nlDescription: string;
  if (mode === 'netlist' && nlFormat === 'net') {
    nlDescription = graphToNetlistNaturalLanguage(graphData);
  } else {
    nlDescription = graphToNaturalLanguage(graphData);
  }

  let result = '=== 连接图自然语言描述 ===\n\n';
  result += `【概览】${summary}\n\n`;

  if (mode === 'netlist' && nlFormat === 'net') {
    result += `【网表描述】\n`;
  }

  result += '【节点清单】\n';
  graphData.nodes.forEach((node, index) => {
    const typeName = getNodeTypeName(node.type);
    const nodeLabel = (node.data?.label as string) || node.label || node.id;
    result += `${index + 1}. ${nodeLabel}（${typeName}）`;
    if (node.data?.description) {
      result += ` - ${node.data.description}`;
    }
    result += '\n';

    if (node.data?.ports && node.data.ports.length > 0) {
      const inputPorts = node.data.ports.filter(p => p.type === 'input');
      const outputPorts = node.data.ports.filter(p => p.type === 'output');

      if (inputPorts.length > 0) {
        result += `   输入端口：${inputPorts.map(p => p.label).join('、')}\n`;
      }
      if (outputPorts.length > 0) {
        result += `   输出端口：${outputPorts.map(p => p.label).join('、')}\n`;
      }
    }
  });

  if (graphData.edges.length > 0) {
    result += '\n【连接关系】\n';
    result += nlDescription;
  }

  if (graphData.meta?.notes) {
    result += `\n\n【备注】\n${graphData.meta.notes}`;
  }

  return result;
}
