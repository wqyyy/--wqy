/** 企业评优工作台 mock 数据（源自原型-企业评优） */

export type EvidenceStatus = 'success' | 'warning';

export type EvaluationMaterial = {
  id: number;
  name: string;
  url: string;
  pages: number;
  size: string;
};

export type EvaluationCompany = {
  id: number;
  name: string;
  creditCode: string;
  submitDate: string;
  materials: EvaluationMaterial[];
};

export type Level2Indicator = {
  level: 2;
  code: string;
  name: string;
  maxScore: number;
  rules: string;
  materialRef: string;
};

export type Level1Indicator = {
  level: 1;
  code: string;
  name: string;
  maxScore: number;
  children: Level2Indicator[];
};

export type ScoringCriteria = {
  totalScore: number;
  indicators: Level1Indicator[];
};

export type ScoreEvidence = {
  source: string;
  page: number | null;
  excerpt: string;
  reasoning: string;
  status: EvidenceStatus;
};

export type ScoreItem = {
  indicatorCode: string;
  indicatorName: string;
  maxScore: number;
  aiScore: number;
  finalScore: number;
  manualAdjusted?: boolean;
  evidence: ScoreEvidence;
  expertComment: string;
};

export type ScoringResult = {
  companyId: number;
  companyName: string;
  totalAiScore: number;
  totalFinalScore: number;
  scores: ScoreItem[];
};

// 企业列表
export const evaluationCompanies = [
  {
    id: 1,
    name: '北京智数科技有限公司',
    creditCode: '91110108MA01ABCD12',
    submitDate: '2025-10-25',
    materials: [
      { id: 1, name: '高质量数据集认定申报书.pdf', url: '#', pages: 25, size: '3.2MB' },
      { id: 2, name: '企业营业执照.pdf', url: '#', pages: 1, size: '0.5MB' },
      { id: 3, name: '承诺书.pdf', url: '#', pages: 2, size: '0.3MB' },
      { id: 4, name: '银行账户信息.pdf', url: '#', pages: 1, size: '0.2MB' },
      { id: 5, name: '数据来源合规证明.pdf', url: '#', pages: 8, size: '1.5MB' },
      { id: 6, name: '授权应用文件.pdf', url: '#', pages: 5, size: '0.9MB' },
      { id: 7, name: '数据安全管理制度.pdf', url: '#', pages: 12, size: '2.1MB' },
      { id: 8, name: '交易记录.pdf', url: '#', pages: 3, size: '0.6MB' },
      { id: 9, name: '数据集介绍.pdf', url: '#', pages: 6, size: '1.2MB' }
    ]
  },
  {
    id: 2,
    name: '亦庄数据服务中心',
    creditCode: '91110108MA04EXMN66',
    submitDate: '2025-10-26',
    materials: [
      { id: 1, name: '高质量数据集认定申报书.pdf', url: '#', pages: 22, size: '2.8MB' },
      { id: 2, name: '企业营业执照.pdf', url: '#', pages: 1, size: '0.5MB' },
      { id: 3, name: '承诺书.pdf', url: '#', pages: 2, size: '0.3MB' },
      { id: 4, name: '银行账户信息.pdf', url: '#', pages: 1, size: '0.2MB' },
      { id: 5, name: '数据来源合规证明.pdf', url: '#', pages: 6, size: '1.1MB' },
      { id: 6, name: '授权应用文件.pdf', url: '#', pages: 4, size: '0.7MB' },
      { id: 7, name: '数据安全管理制度.pdf', url: '#', pages: 9, size: '1.6MB' },
      { id: 8, name: '北京数据交易所开放证明.pdf', url: '#', pages: 2, size: '0.4MB' }
    ]
  },
  {
    id: 3,
    name: '经开区AI研究院',
    creditCode: '91110108MA05FGHI78',
    submitDate: '2025-10-28',
    materials: [
      { id: 1, name: '高质量数据集认定申报书.pdf', url: '#', pages: 28, size: '3.6MB' },
      { id: 2, name: '企业营业执照.pdf', url: '#', pages: 1, size: '0.5MB' },
      { id: 3, name: '承诺书.pdf', url: '#', pages: 2, size: '0.3MB' },
      { id: 4, name: '银行账户信息.pdf', url: '#', pages: 1, size: '0.2MB' },
      { id: 5, name: '数据来源合规证明.pdf', url: '#', pages: 10, size: '1.8MB' },
      { id: 6, name: '授权应用文件.pdf', url: '#', pages: 6, size: '1.1MB' },
      { id: 7, name: '数据安全管理制度.pdf', url: '#', pages: 15, size: '2.5MB' },
      { id: 8, name: '国家级认证证书.pdf', url: '#', pages: 3, size: '0.8MB' },
      { id: 9, name: 'DCMM认证证书.pdf', url: '#', pages: 2, size: '0.6MB' },
      { id: 10, name: '交易记录.pdf', url: '#', pages: 5, size: '1.0MB' },
      { id: 11, name: '其他佐证材料.pdf', url: '#', pages: 4, size: '0.9MB' }
    ]
  }
];

const extraMaterialNames = [
  '高质量数据集认定申报书.pdf',
  '企业营业执照.pdf',
  '承诺书.pdf',
  '银行账户信息.pdf',
  '数据来源合规证明.pdf',
  '授权应用文件.pdf',
  '数据安全管理制度.pdf',
  '数据交易记录.pdf',
  '数据集认证证书.pdf',
  '省市级认定证明.pdf',
  '其他佐证材料.pdf'
];

function createMaterials(count) {
  return extraMaterialNames.slice(0, count).map((name, index) => ({
    id: index + 1,
    name,
    url: '#',
    pages: index === 0 ? 24 : Math.max(1, index + 1),
    size: index === 0 ? '3.0MB' : `${(0.4 + index * 0.2).toFixed(1)}MB`
  }));
}

evaluationCompanies.push(
  {
    id: 4,
    name: '亦城医工数据创新中心',
    creditCode: '91110108MA07JKL901',
    submitDate: '2025-10-29',
    materials: createMaterials(11)
  },
  {
    id: 5,
    name: '北京车路云数据科技有限公司',
    creditCode: '91110108MA08MNP234',
    submitDate: '2025-10-30',
    materials: createMaterials(10)
  },
  {
    id: 6,
    name: '亦城工业智能有限公司',
    creditCode: '91110108MA09QRS567',
    submitDate: '2025-10-30',
    materials: createMaterials(7)
  },
  {
    id: 7,
    name: '博睿语料科技有限公司',
    creditCode: '91110108MA10TUV890',
    submitDate: '2025-11-01',
    materials: createMaterials(11)
  },
  {
    id: 8,
    name: '中芯安全数据实验室',
    creditCode: '91110108MA11WXY345',
    submitDate: '2025-11-02',
    materials: createMaterials(6)
  }
);

function createGeneratedScoringResult(companyId, companyName, aiScores, finalScores) {
  const flatCriteria = defaultScoringCriteria.indicators.flatMap(indicator => indicator.children);
  const scores = flatCriteria.map((indicator, index) => {
    const aiScore = aiScores[index] ?? finalScores[index] ?? 0;
    const finalScore = finalScores[index] ?? aiScore;
    const status = finalScore >= indicator.maxScore * 0.8 ? 'success' : 'warning';
    return {
      indicatorCode: indicator.code,
      indicatorName: indicator.name,
      maxScore: indicator.maxScore,
      aiScore,
      finalScore,
      evidence: {
        source: index % 3 === 0 ? '申报书.pdf' : index % 3 === 1 ? '申报表.xlsx' : '佐证材料.pdf',
        page: index + 1,
        excerpt: `${companyName} 已提交与「${indicator.name}」相关的申报说明和佐证材料。`,
        reasoning: `依据评分标准「${indicator.name}」进行模拟评分，得 ${finalScore} 分。`,
        status
      },
      expertComment: aiScore === finalScore ? '' : '专家根据材料完整度和证明强度调整终评得分'
    };
  });

  return {
    companyId,
    companyName,
    totalAiScore: scores.reduce((sum, score) => sum + score.aiScore, 0),
    totalFinalScore: scores.reduce((sum, score) => sum + score.finalScore, 0),
    scores
  };
}

// 评分标准（基于附件3的表格3）
export const defaultScoringCriteria = {
  totalScore: 100,
  indicators: [
    {
      level: 1,
      code: '一',
      name: '数据合规',
      maxScore: 15,
      children: [
        {
          level: 2,
          code: '1.1',
          name: '来源合规',
          maxScore: 5,
          rules: `1.能提供获取关键数据源的合规性证明（如个人明示授权文件、企业合作协议、公共数据使用许可等），完全符合《数据安全法》《个人信息保护法》等法规，得5分
2.能说明采集数据来源，但证明材料不完整，基本符合法规要求，无明显违规风险，得3分`,
          materialRef: '申报书2.1'
        },
        {
          level: 2,
          code: '1.2',
          name: '应用合规',
          maxScore: 5,
          rules: `1.提供明确的授权应用文件（如授权运营协议、使用许可证书），注明授权主体、范围、期限、转授权限制等，得5分
2.授权文件要素不全（如缺期限/范围），证明材料不完整，得3分`,
          materialRef: '申报书2.2'
        },
        {
          level: 2,
          code: '1.3',
          name: '安全合规',
          maxScore: 5,
          rules: `1.提供详细安全制度证明材料（如隐私保护机制、风险评估流程）及技术措施（如加密、备份、访问控制），得5分
2.具有安全制度及安全措施，但证明材料提供不完整，得3分`,
          materialRef: '申报书2.3'
        }
      ]
    },
    {
      level: 1,
      code: '二',
      name: '数据质量',
      maxScore: 40,
      children: [
        {
          level: 2,
          code: '2.1',
          name: '数据成本',
          maxScore: 6,
          rules: `1.案例投入≥1000万元得6分
2.案例投入500-1000万元得4分
3.案例投入0-500万元得2分`,
          materialRef: '申报表-投入资金'
        },
        {
          level: 2,
          code: '2.2',
          name: '数据类型多样性',
          maxScore: 8,
          rules: `1.涵盖结构化、半结构化、非结构化三种类型数据，不同结构的数据集具有关联性，得8分
2.涵盖结构化、半结构化、非结构化中的两种类型数据，不同结构的数据集具有关联性，得5分
3.仅涵盖一种类型数据，得3分`,
          materialRef: '申报表-数据集模态'
        },
        {
          level: 2,
          code: '2.3',
          name: '数据规模',
          maxScore: 10,
          rules: `1.数据总量达到TB级别，或数据记录超千万条，或在特定领域具备行业标杆级体量，得10分
2.数据总量达到GB级别，或数据记录达百万条以上，或在细分领域具备领先优势，得7分
3.数据总量达到GB级别，或数据记录达十万条以上，或能满足基础研究与应用需求，得4分`,
          materialRef: '申报表-数据集规模'
        },
        {
          level: 2,
          code: '2.4',
          name: '更新频率',
          maxScore: 6,
          rules: `1.数据更新频率（如日更/月更）符合行业需求得4-6分
2.更新频率基本符合需求，得1-3分`,
          materialRef: '申报表-数据更新触发方式'
        },
        {
          level: 2,
          code: '2.5',
          name: '全生命周期管控',
          maxScore: 10,
          rules: `1.建立数据集全生命周期管理体系。对数据采集、存储、处理、共享、应用到归档销毁的全过程进行管控。详细描述全生命周期管理流程，得7-10分
2.管理流程描述不完整，缺失环节，得1-6分`,
          materialRef: '申报书3.2'
        }
      ]
    },
    {
      level: 1,
      code: '三',
      name: '应用效果',
      maxScore: 45,
      children: [
        {
          level: 2,
          code: '3.1',
          name: '"人工智能+"贴合度',
          maxScore: 6,
          rules: `1.场景应用符合经开区重点支持的医药健康、自动驾驶、具身智能、工业制造领域，且与业务需求高度贴合，得6分
2.场景应用符合其他领域，且与业务需求贴合，得3分`,
          materialRef: '申报表-核心应用场景'
        },
        {
          level: 2,
          code: '3.2',
          name: '开放性',
          maxScore: 8,
          rules: `1.通过各类数据流通平台进行数据集开放，并提供相关证明材料，得8分
2.数据集未公开开放，企业自用，得4分`,
          materialRef: '申报书4.1'
        },
        {
          level: 2,
          code: '3.3',
          name: '实际应用效果',
          maxScore: 10,
          rules: `1.已达成≥3次用户交易，并提供对应证明材料（如交易记录、合作协议）得10分
2.已达成2次用户交易，并提供对应证明材料得7分
3.已达成1次用户交易，并提供对应证明材料得4分
4.未达成交易或未提供交易证明材料得0分`,
          materialRef: '申报书4.2'
        },
        {
          level: 2,
          code: '3.4',
          name: '经济/社会价值',
          maxScore: 8,
          rules: `1.提供明确可量化的经济社会价值证明，得5-8分
2.经济社会价值描述较模糊，得1-4分`,
          materialRef: '申报书4.3'
        },
        {
          level: 2,
          code: '3.5',
          name: '标杆性',
          maxScore: 5,
          rules: `数据集获得国家级、省市级认可（如国家数据局高质量数据集案例、北京市高质量数据集典型案例）等得3分
获得DCMM2级及以上、DSMM2级及以上、IEEE数据标准认证等得2分`,
          materialRef: '申报书4.3'
        },
        {
          level: 2,
          code: '3.6',
          name: '可复制性与推广性',
          maxScore: 8,
          rules: `1.案例具备明确的推广方案（含适配条件、实施路径），可复制性强得6-8分
2.案例具备推广方案，具有可复制性，得1-5分`,
          materialRef: '申报书5'
        }
      ]
    }
  ]
};

// 模拟评分结果
export const defaultScoringResults = [
  {
    companyId: 1,
    companyName: '北京智数科技有限公司',
    totalAiScore: 85,
    totalFinalScore: 86,
    scores: [
      {
        indicatorCode: '1.1',
        indicatorName: '来源合规',
        maxScore: 5,
        aiScore: 5,
        finalScore: 5,
        evidence: {
          source: '申报书.pdf',
          page: 3,
          excerpt: '本公司已获取数据源合规性证明，包括个人明示授权文件、企业合作协议，完全符合《数据安全法》《个人信息保护法》等相关法规要求...',
          reasoning: '完全符合评分标准第1条，提供了完整的合规性证明材料',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '1.2',
        indicatorName: '应用合规',
        maxScore: 5,
        aiScore: 5,
        finalScore: 5,
        evidence: {
          source: '授权文件.pdf',
          page: 1,
          excerpt: '授权主体：XX数据管理机构\n授权范围：数据分析与AI模型训练\n授权期限：2025年1月1日至2027年12月31日\n转授权限制：需经书面同意',
          reasoning: '授权文件要素完整，符合标准第1条要求',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '1.3',
        indicatorName: '安全合规',
        maxScore: 5,
        aiScore: 3,
        finalScore: 4,
        evidence: {
          source: '申报书.pdf',
          page: 5,
          excerpt: '公司建立了数据安全管理制度，包括加密存储、定期备份机制，并实施了访问控制策略...',
          reasoning: '安全制度描述完整但未提供技术措施详细证明，符合标准第2条',
          status: 'warning'
        },
        expertComment: '补充现场核查材料后可得4分'
      },
      {
        indicatorCode: '2.1',
        indicatorName: '数据成本',
        maxScore: 6,
        aiScore: 6,
        finalScore: 6,
        evidence: {
          source: '申报表.xlsx',
          page: 1,
          excerpt: '案例投入资金：1200万元',
          reasoning: '1200万元 ≥ 1000万元，符合标准第1条',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '2.2',
        indicatorName: '数据类型多样性',
        maxScore: 8,
        aiScore: 5,
        finalScore: 6,
        evidence: {
          source: '申报表.xlsx',
          page: 1,
          excerpt: '数据集模态：结构化、半结构化',
          reasoning: '涵盖两种类型数据，符合标准第2条',
          status: 'warning'
        },
        expertComment: '现场确认有非结构化数据但未在申报表体现，调整为6分'
      },
      {
        indicatorCode: '2.3',
        indicatorName: '数据规模',
        maxScore: 10,
        aiScore: 10,
        finalScore: 10,
        evidence: {
          source: '申报书.pdf',
          page: 8,
          excerpt: '数据集总量：2.5TB，包含1500万条数据记录，在医药健康领域具有标杆地位',
          reasoning: '达到TB级别且超千万条记录，符合标准第1条',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '2.4',
        indicatorName: '更新频率',
        maxScore: 6,
        aiScore: 5,
        finalScore: 5,
        evidence: {
          source: '申报表.xlsx',
          page: 1,
          excerpt: '数据更新触发方式：每日自动更新',
          reasoning: '日更新频率符合行业需求，得5分',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '2.5',
        indicatorName: '全生命周期管控',
        maxScore: 10,
        aiScore: 8,
        finalScore: 8,
        evidence: {
          source: '申报书.pdf',
          page: 10,
          excerpt: '建立了完整的数据全生命周期管理体系，涵盖数据采集、存储、处理、共享、应用到归档销毁的全流程管控...',
          reasoning: '全生命周期管理流程描述详细，得8分',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '3.1',
        indicatorName: '"人工智能+"贴合度',
        maxScore: 6,
        aiScore: 6,
        finalScore: 6,
        evidence: {
          source: '申报表.xlsx',
          page: 1,
          excerpt: '核心应用场景：医药健康领域的AI辅助诊断',
          reasoning: '符合经开区重点支持的医药健康领域，得6分',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '3.2',
        indicatorName: '开放性',
        maxScore: 8,
        aiScore: 4,
        finalScore: 4,
        evidence: {
          source: '申报书.pdf',
          page: 12,
          excerpt: '数据集目前主要用于企业内部研发和合作伙伴使用',
          reasoning: '数据集未公开开放，企业自用，符合标准第2条',
          status: 'warning'
        },
        expertComment: ''
      },
      {
        indicatorCode: '3.3',
        indicatorName: '实际应用效果',
        maxScore: 10,
        aiScore: 10,
        finalScore: 10,
        evidence: {
          source: '交易记录.pdf',
          page: 1,
          excerpt: '已与5家医疗机构达成数据合作协议，提供交易记录和合作协议',
          reasoning: '已达成≥3次用户交易，并提供证明材料，符合标准第1条',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '3.4',
        indicatorName: '经济/社会价值',
        maxScore: 8,
        aiScore: 7,
        finalScore: 7,
        evidence: {
          source: '申报书.pdf',
          page: 15,
          excerpt: '数据集应用带来年度经济价值约800万元，辅助诊断准确率提升15%，社会效益显著',
          reasoning: '提供了可量化的经济社会价值证明，得7分',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '3.5',
        indicatorName: '标杆性',
        maxScore: 5,
        aiScore: 3,
        finalScore: 3,
        evidence: {
          source: '认证证书.pdf',
          page: 1,
          excerpt: '获得北京市高质量数据集典型案例认定',
          reasoning: '获得省市级认可，符合标准要求，得3分',
          status: 'success'
        },
        expertComment: ''
      },
      {
        indicatorCode: '3.6',
        indicatorName: '可复制性与推广性',
        maxScore: 8,
        aiScore: 7,
        finalScore: 7,
        evidence: {
          source: '申报书.pdf',
          page: 18,
          excerpt: '案例具备明确的推广方案，包括适配条件、实施路径和技术支持方案，可复制性强',
          reasoning: '推广方案完整，可复制性强，得7分',
          status: 'success'
        },
        expertComment: ''
      }
    ]
  },
  {
    companyId: 2,
    companyName: '亦庄数据服务中心',
    totalAiScore: 78,
    totalFinalScore: 78,
    scores: [
      { indicatorCode: '1.1', indicatorName: '来源合规', maxScore: 5, aiScore: 4, finalScore: 4, evidence: { source: '申报书.pdf', page: 2, excerpt: '提供了数据来源说明，但部分合规证明材料不完整', reasoning: '证明材料不完整，基本符合法规，得3分', status: 'warning' }, expertComment: '' },
      { indicatorCode: '1.2', indicatorName: '应用合规', maxScore: 5, aiScore: 5, finalScore: 5, evidence: { source: '授权文件.pdf', page: 1, excerpt: '授权文件要素完整', reasoning: '符合标准要求，得5分', status: 'success' }, expertComment: '' },
      { indicatorCode: '1.3', indicatorName: '安全合规', maxScore: 5, aiScore: 3, finalScore: 3, evidence: { source: '申报书.pdf', page: 4, excerpt: '安全制度基本完备', reasoning: '证明材料不完整，得3分', status: 'warning' }, expertComment: '' },
      { indicatorCode: '2.1', indicatorName: '数据成本', maxScore: 6, aiScore: 4, finalScore: 4, evidence: { source: '申报表.xlsx', page: 1, excerpt: '投入资金：650万元', reasoning: '500-1000万元，得4分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.2', indicatorName: '数据类型多样性', maxScore: 8, aiScore: 8, finalScore: 8, evidence: { source: '申报表.xlsx', page: 1, excerpt: '涵盖结构化、半结构化、非结构化三种数据类型', reasoning: '符合标准第1条，得8分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.3', indicatorName: '数据规模', maxScore: 10, aiScore: 7, finalScore: 7, evidence: { source: '申报书.pdf', page: 7, excerpt: '数据总量800GB，记录数350万条', reasoning: '达到GB级别，百万条以上，得7分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.4', indicatorName: '更新频率', maxScore: 6, aiScore: 4, finalScore: 4, evidence: { source: '申报表.xlsx', page: 1, excerpt: '月度更新', reasoning: '更新频率符合需求，得4分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.5', indicatorName: '全生命周期管控', maxScore: 10, aiScore: 6, finalScore: 6, evidence: { source: '申报书.pdf', page: 9, excerpt: '管理流程描述基本完整', reasoning: '流程有缺失环节，得6分', status: 'warning' }, expertComment: '' },
      { indicatorCode: '3.1', indicatorName: '"人工智能+"贴合度', maxScore: 6, aiScore: 6, finalScore: 6, evidence: { source: '申报表.xlsx', page: 1, excerpt: '应用于数据治理与AI结合领域', reasoning: '属于AI+应用领域，与业务需求贴合，得6分', status: 'success' }, expertComment: '现场补充材料证明属于AI+应用，调整为6分' },
      { indicatorCode: '3.2', indicatorName: '开放性', maxScore: 8, aiScore: 8, finalScore: 8, evidence: { source: '数据合规证明.pdf', page: 1, excerpt: '通过北京数据交易所开放', reasoning: '通过平台开放，提供证明，得8分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.3', indicatorName: '实际应用效果', maxScore: 10, aiScore: 7, finalScore: 7, evidence: { source: '交易记录.pdf', page: 1, excerpt: '达成2次用户交易', reasoning: '2次交易，得7分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.4', indicatorName: '经济/社会价值', maxScore: 8, aiScore: 5, finalScore: 5, evidence: { source: '申报书.pdf', page: 13, excerpt: '经济价值约300万元', reasoning: '可量化证明，得5分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.5', indicatorName: '标杆性', maxScore: 5, aiScore: 0, finalScore: 3, evidence: { source: '申报书.pdf', page: 14, excerpt: '入选北京市经开区2024年度数据要素示范案例', reasoning: '获得省市级认可，得3分', status: 'success' }, expertComment: '补充材料确认入选北京市经开区示范案例，调整为3分' },
      { indicatorCode: '3.6', indicatorName: '可复制性与推广性', maxScore: 8, aiScore: 6, finalScore: 8, evidence: { source: '申报书.pdf', page: 16, excerpt: '具备完整的推广方案、适配条件说明及实施路径', reasoning: '方案完整，可复制性强，得8分', status: 'success' }, expertComment: '现场确认推广方案完整，调整为8分' }
    ]
  },
  {
    companyId: 3,
    companyName: '经开区AI研究院',
    totalAiScore: 92,
    totalFinalScore: 92,
    scores: [
      { indicatorCode: '1.1', indicatorName: '来源合规', maxScore: 5, aiScore: 5, finalScore: 5, evidence: { source: '申报书.pdf', page: 3, excerpt: '完整合规证明', reasoning: '完全符合，得5分', status: 'success' }, expertComment: '' },
      { indicatorCode: '1.2', indicatorName: '应用合规', maxScore: 5, aiScore: 5, finalScore: 5, evidence: { source: '授权文件.pdf', page: 1, excerpt: '授权要素完整', reasoning: '符合标准，得5分', status: 'success' }, expertComment: '' },
      { indicatorCode: '1.3', indicatorName: '安全合规', maxScore: 5, aiScore: 5, finalScore: 5, evidence: { source: '申报书.pdf', page: 5, excerpt: '详细安全制度和技术措施', reasoning: '完整证明，得5分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.1', indicatorName: '数据成本', maxScore: 6, aiScore: 6, finalScore: 6, evidence: { source: '申报表.xlsx', page: 1, excerpt: '投入2000万元', reasoning: '≥1000万，得6分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.2', indicatorName: '数据类型多样性', maxScore: 8, aiScore: 8, finalScore: 8, evidence: { source: '申报表.xlsx', page: 1, excerpt: '三种类型数据', reasoning: '符合标准，得8分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.3', indicatorName: '数据规模', maxScore: 10, aiScore: 10, finalScore: 8, evidence: { source: '申报书.pdf', page: 8, excerpt: '5TB，2000万条记录', reasoning: 'TB级别，但行业标杆性描述较弱，得8分', status: 'success' }, expertComment: '根据材料详实度调整' },
      { indicatorCode: '2.4', indicatorName: '更新频率', maxScore: 6, aiScore: 6, finalScore: 6, evidence: { source: '申报表.xlsx', page: 1, excerpt: '实时更新', reasoning: '完全符合，得6分', status: 'success' }, expertComment: '' },
      { indicatorCode: '2.5', indicatorName: '全生命周期管控', maxScore: 10, aiScore: 10, finalScore: 10, evidence: { source: '申报书.pdf', page: 10, excerpt: '完整生命周期管理体系', reasoning: '详细描述，得10分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.1', indicatorName: '"人工智能+"贴合度', maxScore: 6, aiScore: 6, finalScore: 6, evidence: { source: '申报表.xlsx', page: 1, excerpt: '自动驾驶领域', reasoning: '重点领域，得6分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.2', indicatorName: '开放性', maxScore: 8, aiScore: 8, finalScore: 8, evidence: { source: '申报书.pdf', page: 12, excerpt: '多平台开放', reasoning: '提供证明，得8分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.3', indicatorName: '实际应用效果', maxScore: 10, aiScore: 10, finalScore: 6, evidence: { source: '交易记录.pdf', page: 1, excerpt: '8次用户交易', reasoning: '≥3次，但证明材料详尽程度一般，得6分', status: 'success' }, expertComment: '根据证明材料详尽度调整' },
      { indicatorCode: '3.4', indicatorName: '经济/社会价值', maxScore: 8, aiScore: 8, finalScore: 8, evidence: { source: '申报书.pdf', page: 15, excerpt: '年度价值2000万元', reasoning: '明确可量化，得8分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.5', indicatorName: '标杆性', maxScore: 5, aiScore: 5, finalScore: 5, evidence: { source: '认证证书.pdf', page: 1, excerpt: '国家级案例+DCMM3级', reasoning: '国家级+认证，得5分', status: 'success' }, expertComment: '' },
      { indicatorCode: '3.6', indicatorName: '可复制性与推广性', maxScore: 8, aiScore: 8, finalScore: 6, evidence: { source: '申报书.pdf', page: 18, excerpt: '推广方案基本完整', reasoning: '具备推广方案，可复制性中等，得6分', status: 'success' }, expertComment: '根据方案详尽度调整' }
    ]
  }
];

defaultScoringResults.push(
  createGeneratedScoringResult(
    4,
    '亦城医工数据创新中心',
    [5, 4, 3, 6, 7, 8, 5, 7, 6, 6, 8, 6, 4, 7],
    [5, 4, 4, 6, 7, 8, 5, 8, 6, 6, 8, 7, 4, 7]
  ),
  createGeneratedScoringResult(
    5,
    '北京车路云数据科技有限公司',
    [4, 4, 4, 4, 8, 7, 5, 6, 6, 7, 7, 6, 2, 6],
    [4, 4, 4, 4, 8, 7, 5, 7, 6, 8, 7, 6, 2, 6]
  ),
  createGeneratedScoringResult(
    6,
    '亦城工业智能有限公司',
    [3, 4, 3, 4, 5, 7, 4, 5, 6, 4, 4, 4, 0, 5],
    [3, 4, 3, 4, 5, 7, 4, 5, 6, 4, 4, 4, 0, 5]
  ),
  createGeneratedScoringResult(
    7,
    '博睿语料科技有限公司',
    [5, 5, 4, 6, 8, 10, 5, 9, 6, 8, 9, 8, 5, 8],
    [5, 5, 4, 6, 8, 10, 5, 9, 6, 8, 10, 8, 5, 8]
  ),
  createGeneratedScoringResult(
    8,
    '中芯安全数据实验室',
    [3, 3, 3, 2, 5, 4, 3, 4, 3, 4, 0, 3, 0, 3],
    [3, 3, 3, 2, 5, 4, 3, 4, 3, 4, 0, 3, 0, 3]
  )
);

