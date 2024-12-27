export const price = [
  {
    name: 'FREE',
    type: '免费订阅',
    value: 'FREE',
    desc: '畅享标准模型，无限制的网络能力，一致的图表生成能力。',
    price: {
      origin: 0,
      discounted: 0,
    },
    features: [
      'QuotaGPT 标准模型',
      '基础联网/图表能力',
      '-',
      '基础数据处理能力',
      '16k上下文处理能力',
      '-',
      '-',
      '-',
      '-',
      '-',
    ],
  },
  {
    name: 'PLUS',
    type: '标准订阅',
    value: 'STANDARD',
    desc: '畅享模态模型，大文件分析能力，强化图表生成能力。',
    price: {
      origin: 19.9,
      discounted: 2.99,
    },
    features: [
      'QuotaGPT 标准/强化模型',
      '强化联网/图标能力',
      '强化工具矩阵',
      '强化数据处理能力',
      '32k上下文处理能力',
      '强化图片生成能力',
      '-',
      '外观主题颜色功能',
      '开发者设置能力',
      '积分商城权益',
    ],
  },
  {
    name: 'PRO',
    type: '高级订阅',
    value: 'ULTIMATE',
    desc: '全模态模型，高级文件分析、图片生成能力，高级工具矩阵。',
    price: {
      origin: 49.9,
      discounted: 19.99,
    },
    features: [
      'QuotaGPT 标准/强化/高级模型',
      '高级联网/图表能力',
      '高级工具矩阵',
      '高级数据处理能力',
      '128k上下文处理能力',
      '高级图片生成能力',
      '智能美图能力',
      '外观主题颜色/墙纸功能',
      '开发者设置能力',
      '积分商城权益',
    ],
  },
]
