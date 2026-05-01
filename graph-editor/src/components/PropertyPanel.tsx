import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Divider, Tabs, Button, Space, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useGraphStore } from '../store/graphStore';
import { Edge, Node } from '@xyflow/react';
import { Port } from '../types/graph';

interface PropertyPanelProps {
  selectedElement: Node | Edge | null;
  onClose: () => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedElement, onClose }) => {
  const [form] = Form.useForm();
  const { updateNode, updateEdge, graphData, updateNet } = useGraphStore();
  const [visible, setVisible] = useState(false);
  const [ports, setPorts] = useState<Port[]>([]);
  const [netName, setNetName] = useState('');
  const mode = graphData.mode || 'direct';

  const connectionDescription = React.useMemo(() => {
    if (!selectedElement || !('source' in selectedElement)) return '';
    const edge = selectedElement as Edge;
    const sourceNode = graphData.nodes.find(n => n.id === edge.source);
    const targetNode = graphData.nodes.find(n => n.id === edge.target);

    const getPortLabel = (node: typeof sourceNode, handleId: string | null | undefined) => {
      if (!node || !handleId) return '';
      const port = node.data?.ports?.find((p: Port) => p.id === handleId);
      return port ? port.label : handleId;
    };

    const sourceLabel = sourceNode?.data?.label || edge.source;
    const targetLabel = targetNode?.data?.label || edge.target;
    const sourcePort = getPortLabel(sourceNode, edge.sourceHandle);
    const targetPort = getPortLabel(targetNode, edge.targetHandle);

    return `${sourceLabel} 的 ${sourcePort} → ${targetLabel} 的 ${targetPort}`;
  }, [selectedElement, graphData.nodes]);

  useEffect(() => {
    if (selectedElement) {
      setVisible(true);
      if ('source' in selectedElement) {
        const edge = selectedElement as Edge;
        form.setFieldsValue({
          label: edge.data?.label || '',
          gain: edge.data?.gain || '',
          direction: edge.data?.direction || 'forward',
          signalType: edge.data?.signalType || '',
          delay: edge.data?.delay || '',
          weight: edge.data?.weight ?? '',
          condition: edge.data?.condition || '',
          customDescription: edge.data?.customDescription || '',
        });
        setPorts([]);
        const nid = edge.data?.netId as string | undefined;
        if (nid) {
          const net = graphData.nets?.find(n => n.id === nid);
          setNetName(net?.name || nid);
        } else {
          setNetName('');
        }
      } else {
        const node = selectedElement as Node;
        form.setFieldsValue({
          label: node.data?.label || '',
          description: node.data?.description || '',
        });
        setPorts(node.data?.ports || [
          { id: 'in1', label: '输入', type: 'input' },
          { id: 'out1', label: '输出', type: 'output' },
        ]);
      }
    } else {
      setVisible(false);
      setPorts([]);
    }
  }, [selectedElement, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      if (!selectedElement) return;

      console.log('[PropertyPanel] handleSave called');
      console.log('[PropertyPanel] selectedElement:', selectedElement);
      console.log('[PropertyPanel] form values:', values);
      console.log('[PropertyPanel] ports:', ports);

      if ('source' in selectedElement) {
        console.log('[PropertyPanel] Updating edge:', selectedElement.id, values);
        updateEdge(selectedElement.id, values);
      } else {
        const updateData = { ...values, ports };
        console.log('[PropertyPanel] Updating node:', selectedElement.id, updateData);
        updateNode(selectedElement.id, updateData);
      }
      setVisible(false);
      onClose();
    });
  };

  const handleNetRename = () => {
    if (!selectedElement || !('source' in selectedElement)) return;
    const edge = selectedElement as Edge;
    const netId = edge.data?.netId as string | undefined;
    if (!netId || !netName.trim()) return;
    const trimmed = netName.trim();
    const existing = graphData.nets?.find(n => n.name === trimmed && n.id !== netId);
    if (existing) {
      message.warning('该网表名称已存在');
      return;
    }
    updateNet(netId, { name: trimmed });
    message.success('网表名称已更新');
  };

  const addPort = (type: 'input' | 'output') => {
    const newPort: Port = {
      id: `${type}${Date.now()}`,
      label: type === 'input' ? `输入${ports.filter(p => p.type === 'input').length + 1}` : `输出${ports.filter(p => p.type === 'output').length + 1}`,
      type,
    };
    setPorts([...ports, newPort]);
  };

  const removePort = (id: string) => {
    setPorts(ports.filter(p => p.id !== id));
  };

  const updatePort = (id: string, field: keyof Port, value: string) => {
    setPorts(ports.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const isEdge = selectedElement && 'source' in selectedElement;
  const inputPorts = ports.filter(p => p.type === 'input');
  const outputPorts = ports.filter(p => p.type === 'output');

  return (
    <Modal
      title={isEdge ? '连线属性' : '节点属性'}
      open={visible}
      onOk={handleSave}
      onCancel={() => {
        setVisible(false);
        onClose();
      }}
      okText="保存"
      cancelText="取消"
      width={600}
    >
      <Form form={form} layout="vertical">
        {isEdge && connectionDescription && (
          <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">连接关系：</span>
            {connectionDescription}
          </div>
        )}

        <Form.Item name="label" label="标签">
          <Input placeholder="输入标签名称" />
        </Form.Item>

        {!isEdge && (
          <>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={2} placeholder="输入节点描述（将出现在自然语言导出中）" />
            </Form.Item>

            <Divider orientation="left">端口配置</Divider>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">输入端口</span>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => addPort('input')}
                  >
                    添加
                  </Button>
                </div>
                <div className="space-y-2">
                  {inputPorts.map((port) => (
                    <div key={port.id} className="flex items-center gap-2">
                      <Input
                        value={port.label}
                        onChange={(e) => updatePort(port.id, 'label', e.target.value)}
                        placeholder="端口名称"
                        size="small"
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removePort(port.id)}
                      />
                    </div>
                  ))}
                  {inputPorts.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">暂无输入端口</div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">输出端口</span>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => addPort('output')}
                  >
                    添加
                  </Button>
                </div>
                <div className="space-y-2">
                  {outputPorts.map((port) => (
                    <div key={port.id} className="flex items-center gap-2">
                      <Input
                        value={port.label}
                        onChange={(e) => updatePort(port.id, 'label', e.target.value)}
                        placeholder="端口名称"
                        size="small"
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => removePort(port.id)}
                      />
                    </div>
                  ))}
                  {outputPorts.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">暂无输出端口</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {isEdge && mode === 'netlist' && netName && (
          <>
            <Divider orientation="left">网表信息</Divider>
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={netName}
                onChange={(e) => setNetName(e.target.value)}
                placeholder="网表名称"
                size="small"
              />
              <Button type="primary" size="small" onClick={handleNetRename}>
                重命名
              </Button>
            </div>
          </>
        )}

        {isEdge && (
          <>
            <Divider orientation="left">连线元数据</Divider>

            <Form.Item name="direction" label="方向">
              <Select placeholder="选择方向">
                <Select.Option value="forward">正向</Select.Option>
                <Select.Option value="backward">反向</Select.Option>
                <Select.Option value="bidirectional">双向</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="signalType" label="类型">
              <Select placeholder="选择类型">
                <Select.Option value="feedback">反馈</Select.Option>
                <Select.Option value="input">输入</Select.Option>
                <Select.Option value="output">输出</Select.Option>
                <Select.Option value="control">控制</Select.Option>
                <Select.Option value="data">数据</Select.Option>
                <Select.Option value="trigger">触发</Select.Option>
                <Select.Option value="event">事件</Select.Option>
                <Select.Option value="condition">条件</Select.Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="gain" label="增益/系数">
                <Input placeholder="如: +1, -1, 0.5" />
              </Form.Item>

              <Form.Item name="weight" label="权重">
                <Input placeholder="数值" type="number" />
              </Form.Item>
            </div>

            <Form.Item name="delay" label="延迟">
              <Input placeholder="例如: 10ms, 2s" />
            </Form.Item>

            <Form.Item name="condition" label="条件">
              <Input placeholder="例如: x > 0, 温度 > 阈值" />
            </Form.Item>

            <Form.Item name="customDescription" label="自定义描述">
              <Input.TextArea rows={2} placeholder="自定义描述文本（将直接出现在自然语言导出中）" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default PropertyPanel;
