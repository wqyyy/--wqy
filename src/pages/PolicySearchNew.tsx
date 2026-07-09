import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Search,
  Star,
  Sparkles,
  Trash2,
  X,
  FileText,
  Database,
  ArrowRight,
  MousePointerClick,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
// Tabs removed - unified search interface
import { cn } from "@/lib/utils";
import {
  loadFavoritePolicies,
  removeFavoritePolicy,
  upsertFavoritePolicy,
} from "@/lib/policyFavorites";
import {
  loadSearchHistory,
  saveSearchHistory,
  removeSearchHistory,
  type SearchHistoryItem,
} from "@/lib/policySearchHistory";

type SearchTarget = "title" | "content";
type SortMode = "time";
type RegionFilter = "all" | "national" | "beijing" | "yizhuang" | "other";
type YearFilter = "all" | "2020" | "2021" | "2022" | "2023" | "2024" | "2025" | "2026";
type PolicyLevelFilter = "all" | "national" | "province" | "city" | "county" | "township";
type PolicyThemeFilter = "all" | "talent" | "finance" | "fiscal" | "land" | "tax";
type IndustryTypeFilter = "all" | "new-it" | "auto-ev" | "robot-manufacturing" | "biotech-health" | "autonomous-driving" | "ic" | "culture-tech" | "business-service" | "digital-economy" | "productive-service" | "urban-industry" | "integration";

type PolicyResult = {
  id: string;
  title: string;
  department: string;
  docNo: string;
  publishDate: string;
  collected: boolean;
  highlighted?: boolean;
  content?: string;
  summary?: string;
  tags?: string[];
  level?: "national" | "yizhuang" | "beijing" | "other" | "material";
  policyLevel?: PolicyLevelFilter;
  policyTheme?: PolicyThemeFilter[];
  industryType?: IndustryTypeFilter[];
};

const hotKeywords = ["专精特新", "高精尖", "人才十条", "人才引进", "人工智能"];
const publishYears: YearFilter[] = ["all", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
const OTHER_REGION_OPTIONS: Record<string, string[]> = {
  上海市: ["上海市"],
  广东省: ["广州市", "深圳市", "珠海市"],
  江苏省: ["南京市", "苏州市", "无锡市"],
  浙江省: ["杭州市", "宁波市", "温州市"],
  四川省: ["成都市", "绵阳市"],
};

// 智能识别用户输入中的筛选条件
const parseIntelligentQuery = (query: string): {
  yearFilter: YearFilter;
  themeFilter: string;
  regionFilter: RegionFilter;
  searchTarget: SearchTarget;
  cleanedKeyword: string;
  policyLevelFilter: PolicyLevelFilter;
  policyThemeFilter: PolicyThemeFilter;
  industryTypeFilter: IndustryTypeFilter;
} => {
  const normalized = query.toLowerCase();
  let cleanedKeyword = query;

  // 识别年份
  let yearFilter: YearFilter = "all";
  const years = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];
  for (const year of years) {
    if (normalized.includes(year)) {
      yearFilter = year as YearFilter;
      // 从关键词中移除年份
      cleanedKeyword = cleanedKeyword.replace(new RegExp(year, 'gi'), '').trim();
      break;
    }
  }
  // 识别相对时间
  if (normalized.includes("今年") || normalized.includes("本年")) {
    yearFilter = "2026";
    cleanedKeyword = cleanedKeyword.replace(/今年|本年/gi, '').trim();
  } else if (normalized.includes("去年")) {
    yearFilter = "2025";
    cleanedKeyword = cleanedKeyword.replace(/去年/gi, '').trim();
  } else if (normalized.includes("最近") || normalized.includes("近期") || normalized.includes("新发布")) {
    yearFilter = "2025"; // 默认最近为2025-2026
    cleanedKeyword = cleanedKeyword.replace(/最近|近期|新发布/gi, '').trim();
  }

  // 识别主题 - 需要从关键词中移除主题词
  let themeFilter = "all";
  const themeKeywords = ["专精特新", "高精尖", "人才十条", "人才引进", "人工智能", "绿色低碳", "数据要素", "数字经济", "集成电路", "芯片", "机器人", "脑机接口"];
  for (const keyword of themeKeywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      themeFilter = keyword;
      // 从关键词中移除主题词
      cleanedKeyword = cleanedKeyword.replace(new RegExp(keyword, 'gi'), '').trim();
      break;
    }
  }
  // 模糊匹配
  if (themeFilter === "all") {
    if (normalized.includes("数据") || normalized.includes("数字")) {
      themeFilter = "数据要素";
      cleanedKeyword = cleanedKeyword.replace(/数据|数字/gi, '').trim();
    } else if (normalized.includes("人才") || normalized.includes("引进") || normalized.includes("落户")) {
      themeFilter = "人才引进";
      cleanedKeyword = cleanedKeyword.replace(/人才|引进|落户/gi, '').trim();
    } else if (normalized.includes("ai") || normalized.includes("智能") || normalized.includes("大模型")) {
      themeFilter = "人工智能";
      cleanedKeyword = cleanedKeyword.replace(/ai|智能|大模型/gi, '').trim();
    } else if (normalized.includes("专精") || normalized.includes("小巨人")) {
      themeFilter = "专精特新";
      cleanedKeyword = cleanedKeyword.replace(/专精|小巨人/gi, '').trim();
    } else if (normalized.includes("绿色") || normalized.includes("低碳") || normalized.includes("环保")) {
      themeFilter = "绿色低碳";
      cleanedKeyword = cleanedKeyword.replace(/绿色|低碳|环保/gi, '').trim();
    }
  }

  // 识别地区
  let regionFilter: RegionFilter = "all";
  if (normalized.includes("国家") || normalized.includes("国务院") || normalized.includes("中央")) {
    regionFilter = "national";
    cleanedKeyword = cleanedKeyword.replace(/国家|国务院|中央/gi, '').trim();
  } else if (normalized.includes("经开区") || normalized.includes("亦庄") || normalized.includes("开发区")) {
    regionFilter = "yizhuang";
    cleanedKeyword = cleanedKeyword.replace(/经开区|亦庄|开发区/gi, '').trim();
  } else if (normalized.includes("北京市") || normalized.includes("北京")) {
    regionFilter = "beijing";
    cleanedKeyword = cleanedKeyword.replace(/北京市|北京/gi, '').trim();
  } else if (normalized.includes("上海") || normalized.includes("深圳") || normalized.includes("广州") || normalized.includes("杭州") || normalized.includes("南京") || normalized.includes("其他省市")) {
    regionFilter = "other";
    cleanedKeyword = cleanedKeyword.replace(/上海|深圳|广州|杭州|南京|其他省市/gi, '').trim();
  }

  // 识别搜索位置
  let searchTarget: SearchTarget = "title";
  if (normalized.includes("全文") || normalized.includes("内容") || normalized.includes("详细")) {
    searchTarget = "content";
    cleanedKeyword = cleanedKeyword.replace(/全文|内容|详细/gi, '').trim();
  }

  // 识别政策层级
  let policyLevelFilter: PolicyLevelFilter = "all";
  if (normalized.includes("国家级")) {
    policyLevelFilter = "national";
    cleanedKeyword = cleanedKeyword.replace(/国家级/gi, '').trim();
  } else if (normalized.includes("省级") || normalized.includes("省")) {
    policyLevelFilter = "province";
    cleanedKeyword = cleanedKeyword.replace(/省级|省/gi, '').trim();
  } else if (normalized.includes("市级") || normalized.includes("市")) {
    policyLevelFilter = "city";
    cleanedKeyword = cleanedKeyword.replace(/市级|市/gi, '').trim();
  } else if (normalized.includes("县级") || normalized.includes("县")) {
    policyLevelFilter = "county";
    cleanedKeyword = cleanedKeyword.replace(/县级|县/gi, '').trim();
  } else if (normalized.includes("乡级") || normalized.includes("乡")) {
    policyLevelFilter = "township";
    cleanedKeyword = cleanedKeyword.replace(/乡级|乡/gi, '').trim();
  }

  // 识别政策主题
  let policyThemeFilter: PolicyThemeFilter = "all";
  if (normalized.includes("人才")) {
    policyThemeFilter = "talent";
  } else if (normalized.includes("金融")) {
    policyThemeFilter = "finance";
  } else if (normalized.includes("财政")) {
    policyThemeFilter = "fiscal";
  } else if (normalized.includes("土地")) {
    policyThemeFilter = "land";
  } else if (normalized.includes("税收")) {
    policyThemeFilter = "tax";
  }

  // 识别产业类型
  let industryTypeFilter: IndustryTypeFilter = "all";
  if (normalized.includes("信息技术") || normalized.includes("it")) {
    industryTypeFilter = "new-it";
  } else if (normalized.includes("新能源汽车") || normalized.includes("电动车")) {
    industryTypeFilter = "auto-ev";
  } else if (normalized.includes("机器人")) {
    industryTypeFilter = "robot-manufacturing";
  } else if (normalized.includes("生物医药") || normalized.includes("医疗健康")) {
    industryTypeFilter = "biotech-health";
  } else if (normalized.includes("自动驾驶")) {
    industryTypeFilter = "autonomous-driving";
  } else if (normalized.includes("集成电路") || normalized.includes("芯片")) {
    industryTypeFilter = "ic";
  } else if (normalized.includes("文化科技")) {
    industryTypeFilter = "culture-tech";
  } else if (normalized.includes("商务服务")) {
    industryTypeFilter = "business-service";
  } else if (normalized.includes("数字经济")) {
    industryTypeFilter = "digital-economy";
  } else if (normalized.includes("生产性服务")) {
    industryTypeFilter = "productive-service";
  } else if (normalized.includes("城市产业")) {
    industryTypeFilter = "urban-industry";
  } else if (normalized.includes("产业融合")) {
    industryTypeFilter = "integration";
  }

  return { yearFilter, themeFilter, regionFilter, searchTarget, cleanedKeyword, policyLevelFilter, policyThemeFilter, industryTypeFilter };
};

// 模拟的政策数据（带摘要和标签）
const generatePolicies = (): PolicyResult[] => {
  const baseData = [
    // ========== 国家级政策 ==========
    // 2026年
    {
      title: "国务院关于加快绿色低碳产业发展的指导意见",
      department: "国务院办公厅",
      summary: "推动绿色低碳产业高质量发展，支持新能源、节能环保、绿色制造等领域创新。对绿色低碳重大项目给予专项资金支持，建立绿色金融支持体系。支持企业开展碳排放管理、绿色技术改造，对节能降碳项目按投资额30%给予补贴，最高3000万元。",
      tags: ["绿色低碳", "新能源", "节能环保", "碳排放"],
      level: "national" as const,
      docNo: "国办发〔2026〕15号",
      publishDate: "2026-05-10",
    },
    {
      title: "科技部 教育部关于推进高精尖产业技术创新的若干措施",
      department: "科技部、教育部",
      summary: "聚焦高精尖产业关键核心技术攻关，支持集成电路、生物医药、新材料等领域创新。对高精尖技术研发项目给予最高5000万元支持，推动产学研深度融合。建设国家级高精尖产业创新中心，完善技术转移转化体系。",
      tags: ["高精尖", "技术创新", "产学研", "核心技术"],
      level: "national" as const,
      docNo: "国科发高〔2026〕88号",
      publishDate: "2026-04-20",
    },
    // 2025年
    {
      title: "国务院关于促进数据要素市场化配置改革的指导意见",
      department: "国务院办公厅",
      summary: "建立健全数据要素市场体系，推动数据要素有序流通，激活数据要素价值。支持建设区域性、行业性数据交易平台，完善数据交易规则。对数据交易平台建设给予资金支持，推动数据资产入表和数据要素定价机制改革。建立数据要素收益分配机制，保障数据提供方合法权益。",
      tags: ["数据要素", "市场化配置", "数据交易", "政策指导"],
      level: "national" as const,
      docNo: "国办发〔2025〕28号",
      publishDate: "2025-08-15",
    },
    {
      title: "国家发展改革委 国家数据局关于加快推进人工智能产业发展的若干政策措施",
      department: "国家发展改革委员会、国家数据局",
      summary: "加快人工智能产业创新发展，支持大模型技术研发和算力基础设施建设。对人工智能重大项目给予专项资金支持，推动AI技术在制造、医疗、教育等领域的应用。建设国家级人工智能创新中心和开放平台，完善人工智能标准体系和治理框架。",
      tags: ["人工智能", "大模型", "算力建设", "国家战略"],
      level: "national" as const,
      docNo: "发改高技〔2025〕1156号",
      publishDate: "2025-07-20",
    },
    {
      title: "工业和信息化部关于推动专精特新企业高质量发展的实施意见",
      department: "工业和信息化部",
      summary: "建立专精特新企业梯度培育体系，加强对创新型中小企业、专精特新中小企业和专精特新'小巨人'企业的支持。对国家级专精特新'小巨人'企业给予不低于500万元的综合支持，引导地方配套不少于等额资金。完善专精特新企业融资支持体系，建立上市培育机制。",
      tags: ["专精特新", "企业培育", "中小企业", "创新发展"],
      level: "national" as const,
      docNo: "工信部企业〔2025〕89号",
      publishDate: "2025-06-30",
    },
    // 2024年
    {
      title: "国家发展改革委关于促进绿色低碳循环发展经济体系建设的指导意见",
      department: "国家发展改革委员会",
      summary: "构建绿色低碳循环发展经济体系，推动产业结构、能源结构、交通运输结构优化调整。支持绿色技术创新和绿色制造体系建设，对绿色工厂、绿色园区给予资金奖励。建立健全绿色金融体系，推动碳排放权交易市场建设。",
      tags: ["绿色低碳", "循环经济", "绿色金融", "碳交易"],
      level: "national" as const,
      docNo: "发改环资〔2024〕456号",
      publishDate: "2024-09-18",
    },
    {
      title: "人力资源社会保障部关于实施新时代人才强国战略的若干意见",
      department: "人力资源和社会保障部",
      summary: "深入实施新时代人才强国战略，加快建设世界重要人才中心和创新高地。完善高层次人才引进政策，对顶尖人才提供一事一议支持。优化青年人才培养机制，实施博士后创新人才支持计划。健全人才评价体系，破除唯论文、唯职称、唯学历倾向。",
      tags: ["人才强国", "人才引进", "人才评价", "青年人才"],
      level: "national" as const,
      docNo: "人社部发〔2024〕72号",
      publishDate: "2024-07-15",
    },
    // 2023年
    {
      title: "工业和信息化部关于推进机器人产业高质量发展的指导意见",
      department: "工业和信息化部",
      summary: "推动机器人产业高质量发展，提升产业创新能力和国际竞争力。支持工业机器人、服务机器人、特种机器人核心技术攻关，对关键零部件研发给予专项支持。推动机器人在制造、医疗、养老、教育等领域规模化应用，建设机器人应用示范基地。",
      tags: ["机器人", "智能制造", "产业创新", "核心技术"],
      level: "national" as const,
      docNo: "工信部装〔2023〕156号",
      publishDate: "2023-11-08",
    },
    {
      title: "国务院关于进一步优化营商环境降低市场主体制度性交易成本的意见",
      department: "国务院办公厅",
      summary: "持续优化营商环境，降低市场主体制度性交易成本。深化'放管服'改革，推进政务服务标准化规范化便利化。优化涉企审批服务，压缩企业开办时间。加强知识产权保护，完善市场主体退出机制。",
      tags: ["营商环境", "放管服", "政务服务", "制度创新"],
      level: "national" as const,
      docNo: "国办发〔2023〕45号",
      publishDate: "2023-08-22",
    },
    // 2022年
    {
      title: "国家发展改革委 科技部关于构建数据基础制度更好发挥数据要素作用的意见",
      department: "国家发展改革委员会、科技部",
      summary: "构建数据基础制度体系，激活数据要素潜能。建立数据产权制度，推进公共数据、企业数据、个人数据分类分级确权授权使用。建立数据要素流通和交易制度，规范数据交易市场。完善数据要素收益分配机制，保障数据要素各参与方合法权益。",
      tags: ["数据要素", "数据产权", "数据交易", "基础制度"],
      level: "national" as const,
      docNo: "发改高技〔2022〕1735号",
      publishDate: "2022-12-19",
    },


    // ========== 经开区政策 ==========
    // 2026年
    {
      title: "北京经济技术开发区管理委员会印发《关于支持绿色低碳产业发展的若干措施》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "推动绿色低碳产业集聚发展，支持新能源汽车、储能技术、节能环保等领域创新。对绿色低碳重大项目给予最高5000万元支持，对绿色工厂、绿色供应链认证企业给予50-200万元奖励。支持企业开展碳排放核算和碳资产管理，建设碳中和示范园区。",
      tags: ["绿色低碳", "新能源", "碳中和", "绿色工厂"],
      level: "yizhuang" as const,
      docNo: "京技管〔2026〕6号",
      publishDate: "2026-05-28",
    },
    {
      title: "北京经济技术开发区人才工作领导小组办公室关于实施'亦庄人才十条'的通知",
      department: "北京经济技术开发区人才工作领导小组办公室",
      summary: "全面落实人才引进和培育政策，对国家级领军人才提供300万元安家费和最高1000万元科研启动经费。博士学历人才提供50万元购房补贴，硕士学历人才提供30万元补贴。建设人才公寓3000套，提供拎包入住服务。设立10亿元人才创新创业基金，每年支持200个以上项目。",
      tags: ["人才十条", "人才引进", "购房补贴", "创业基金"],
      level: "yizhuang" as const,
      docNo: "京技人才〔2026〕3号",
      publishDate: "2026-04-15",
    },
    // 2025年
    {
      title: "北京经济技术开发区管理委员会印发《关于加快推进数据产业高质量发展的若干措施》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "围绕数据要素流通、数据基础设施与场景应用，推动数据产业集聚与高质量发展。健全数据要素流通交易机制，支持数据基础设施建设，布局智能算力中心、可信数据空间、数据标注基地。对数据交易平台建设给予最高3000万元支持，数据应用场景示范项目给予最高500万元支持。鼓励工业制造、城市治理、医疗健康等领域开放场景。",
      tags: ["数据产业", "数据要素", "智能算力", "场景应用"],
      level: "yizhuang" as const,
      docNo: "京技管〔2025〕8号",
      publishDate: "2025-09-10",
    },
    {
      title: "北京经济技术开发区管理委员会印发《关于加快推动脑机接口技术和产业创新发展的若干措施》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "支持脑机接口核心技术攻关，推动医疗康复、智能交互、教育娱乐等领域应用创新。对承担国家级重大项目的企业给予最高2000万元配套支持，对脑机接口创新产品首台（套）应用给予最高1000万元奖励。建设脑机接口测试验证平台和产业创新中心，构建完整产业生态。",
      tags: ["脑机接口", "技术创新", "医疗康复", "智能交互"],
      level: "yizhuang" as const,
      docNo: "京技管〔2025〕12号",
      publishDate: "2025-08-25",
    },
    {
      title: "北京经济技术开发区经济发展局关于开展2025年生产性服务业十二条政策相关事项申报的通知",
      department: "北京经济技术开发区经济发展局",
      summary: "支持研发设计、检验检测、工业设计、供应链管理等生产性服务业发展。对新引进的生产性服务业企业给予最高500万元落地奖励，对年营收增长率超过30%的企业给予增长性奖励。支持企业建设公共服务平台，按照建设投资的30%给予支持，最高不超过1000万元。",
      tags: ["生产性服务业", "研发设计", "检验检测", "供应链管理"],
      level: "yizhuang" as const,
      docNo: "京技经发〔2025〕45号",
      publishDate: "2025-08-08",
    },
    {
      title: "北京经济技术开发区信息技术产业局关于开展人工智能'模型券'专项奖励申报的通知",
      department: "北京经济技术开发区信息技术产业局",
      summary: "对开展大模型训练的企业提供算力券支持，单个项目最高支持1000万元。支持企业使用公共智算平台进行模型训练和推理，按照实际算力使用费用的50%给予补贴。推动100个AI+应用场景落地，每个场景给予300-500万元资金支持。建设人工智能公共服务平台，提供算力、数据、算法等一体化服务。",
      tags: ["人工智能", "模型券", "算力支持", "场景应用"],
      level: "yizhuang" as const,
      docNo: "京技信〔2025〕33号",
      publishDate: "2025-08-08",
    },
    {
      title: "北京经济技术开发区管理委员会印发《关于支持机器人产业创新发展的若干措施》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "支持工业机器人、服务机器人、特种机器人研发和产业化。对机器人核心零部件研发给予最高1000万元支持，对整机产品首次销售给予销售额20%、最高500万元的奖励。建设机器人检测认证平台和应用示范基地，推动100个机器人应用场景落地。",
      tags: ["机器人", "智能制造", "核心零部件", "应用场景"],
      level: "yizhuang" as const,
      docNo: "京技管〔2025〕15号",
      publishDate: "2025-07-18",
    },
    // 2024年
    {
      title: "北京经济技术开发区管理委员会印发《关于支持高精尖产业发展的若干措施》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "聚焦集成电路、生物医药、新能源汽车、智能制造等高精尖产业，提供全链条政策支持。对高精尖产业重大项目给予最高1亿元支持，对关键核心技术攻关给予最高3000万元支持。建设高精尖产业孵化基地，提供场地、资金、人才等综合服务。",
      tags: ["高精尖", "产业发展", "核心技术", "重大项目"],
      level: "yizhuang" as const,
      docNo: "京技管〔2024〕22号",
      publishDate: "2024-11-05",
    },
    {
      title: "北京经济技术开发区管理委员会印发《关于促进专精特新企业高质量发展的实施细则》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "建立专精特新企业培育库，提供梯度培育和精准服务。对新认定的国家级专精特新'小巨人'企业给予300万元奖励，市级专精特新企业给予100万元奖励。支持企业技术改造和研发创新，按照投资额的20%给予补贴，最高2000万元。建立专精特新企业上市服务机制。",
      tags: ["专精特新", "企业培育", "技术改造", "上市服务"],
      level: "yizhuang" as const,
      docNo: "京技管〔2024〕18号",
      publishDate: "2024-08-30",
    },
    // 2023年
    {
      title: "北京经济技术开发区管理委员会印发《关于支持数字经济发展的若干措施》的通知",
      department: "北京经济技术开发区管理委员会",
      summary: "推动数字经济核心产业发展，支持云计算、大数据、物联网、区块链等技术创新和应用。对数字经济重大项目给予最高5000万元支持，对数字化转型示范项目给予最高1000万元支持。建设数字经济产业园，提供低成本空间和配套服务。",
      tags: ["数字经济", "云计算", "大数据", "数字化转型"],
      level: "yizhuang" as const,
      docNo: "京技管〔2023〕28号",
      publishDate: "2023-10-12",
    },

    // ========== 北京市政策 ==========
    // 2026年
    {
      title: "北京市人民政府关于加快建设国际科技创新中心的若干措施",
      department: "北京市科学技术委员会",
      summary: "加快建设具有全球影响力的国际科技创新中心，强化国家战略科技力量。支持建设世界领先的国家实验室和科研机构，对重大科技基础设施建设给予全额支持。实施基础研究十年行动计划，每年投入不少于50亿元。支持企业牵头承担国家重大科技项目，按照国家资金1:1配套支持。",
      tags: ["科技创新", "国际科创中心", "基础研究", "重大项目"],
      level: "beijing" as const,
      docNo: "京政发〔2026〕12号",
      publishDate: "2026-06-08",
    },
    {
      title: "北京市人民政府关于促进绿色低碳高质量发展的实施意见",
      department: "北京市发展和改革委员会、北京市生态环境局",
      summary: "推动经济社会发展全面绿色转型，构建绿色低碳循环发展经济体系。支持企业实施节能降碳技术改造，按照投资额的30%给予补贴，最高3000万元。对获得绿色工厂、绿色供应链认证的企业给予100-300万元奖励。建设碳普惠平台，推动全社会绿色低碳生活方式。",
      tags: ["绿色低碳", "节能降碳", "绿色工厂", "碳普惠"],
      level: "beijing" as const,
      docNo: "京政发〔2026〕9号",
      publishDate: "2026-05-20",
    },
    // 2025年
    {
      title: "北京市人民政府关于支持专精特新企业高质量发展的若干措施",
      department: "北京市经济和信息化局",
      summary: "围绕专精特新企业培育、融资支持、技术改造和梯度成长提供政策支持。对认定为国家级专精特新'小巨人'企业给予200万元一次性奖励，市级专精特新企业给予50万元支持。建立专精特新企业培育库，提供融资担保、上市辅导等全链条服务。支持企业开展技术改造，按照设备投资额的15%给予补贴，最高不超过1000万元。",
      tags: ["专精特新", "企业培育", "融资支持", "技术改造"],
      level: "beijing" as const,
      docNo: "京政发〔2025〕25号",
      publishDate: "2025-09-05",
    },
    {
      title: "北京市人民政府关于深化人才十条政策落地实施的若干措施",
      department: "北京市人力资源和社会保障局",
      summary: "围绕人才十条、人才服务、住房保障、落户支持和创新激励形成政策体系。加大高层次人才引进和青年人才培育力度。对引进的国家级领军人才提供200万元安家费，博士后青年人才提供30万元生活补贴。在重点功能区工作的人才可优先申请共有产权房和人才公租房。设立人才创新创业基金，每年支持不少于100个优秀项目。",
      tags: ["人才十条", "人才引进", "住房保障", "落户支持"],
      level: "beijing" as const,
      docNo: "京政发〔2025〕18号",
      publishDate: "2025-08-20",
    },
    {
      title: "北京市科学技术委员会 北京市经济和信息化局关于促进人工智能产业创新发展的若干政策",
      department: "北京市科学技术委员会、北京市经济和信息化局",
      summary: "支持人工智能大模型研发、算力设施建设、场景开放应用和产业生态培育。对开展大模型训练的企业提供算力券支持，单个项目最高支持1000万元。支持企业建设智算中心，按照建设投资的30%给予支持，最高不超过5000万元。推动人工智能在制造、医疗、交通、教育等领域深度应用。",
      tags: ["人工智能", "大模型", "算力券", "场景应用"],
      level: "beijing" as const,
      docNo: "京科发〔2025〕102号",
      publishDate: "2025-07-28",
    },
    {
      title: "北京市人民政府关于促进数字经济高质量发展的实施意见",
      department: "北京市经济和信息化局、北京市发展和改革委员会",
      summary: "加快建设全球数字经济标杆城市，推动数据要素市场化配置，培育数字经济新业态新模式。支持企业开展数字化转型，对投资额1000万元以上的数字化改造项目按照投资额的30%给予支持，最高500万元。建设北京国际大数据交易所，推动数据要素有序流通。培育数字经济核心产业，打造世界级数字产业集群。",
      tags: ["数字经济", "数据要素", "数字化转型", "大数据"],
      level: "beijing" as const,
      docNo: "京政发〔2025〕8号",
      publishDate: "2025-06-15",
    },
    {
      title: "北京市人民政府关于促进集成电路产业高质量发展的若干措施",
      department: "北京市经济和信息化局",
      summary: "支持芯片设计、晶圆制造、封装测试全产业链发展。对首次流片成功的芯片设计企业给予流片费用50%的支持，最高300万元。支持企业建设12英寸晶圆生产线，按照设备投资额的20%给予支持，最高不超过5亿元。推动国产芯片在重点领域示范应用，建立芯片适配验证平台。",
      tags: ["集成电路", "芯片设计", "晶圆制造", "国产替代"],
      level: "beijing" as const,
      docNo: "京政发〔2025〕31号",
      publishDate: "2025-09-12",
    },
    // 2024年
    {
      title: "北京市人民政府关于促进高精尖产业高质量发展的意见",
      department: "北京市经济和信息化局",
      summary: "聚焦新一代信息技术、集成电路、医药健康、智能装备、节能环保、新能源智能汽车、新材料、人工智能、软件和信息服务以及科技服务业等高精尖产业。对高精尖产业重大项目给予全链条支持，单个项目最高支持1亿元。建设高精尖产业发展基金，规模不少于500亿元。",
      tags: ["高精尖", "产业发展", "重大项目", "产业基金"],
      level: "beijing" as const,
      docNo: "京政发〔2024〕28号",
      publishDate: "2024-10-15",
    },
    {
      title: "北京市人民政府关于优化营商环境支持企业发展的若干措施",
      department: "北京市发展和改革委员会",
      summary: "持续优化营商环境，降低企业运营成本，激发市场主体活力。深化'放管服'改革，实现企业开办一日办结。优化涉企政策兑现机制，推行'免申即享''即申即享'。加强中小企业融资支持，设立100亿元纾困基金。完善企业服务体系，建立企业诉求快速响应机制。",
      tags: ["营商环境", "企业服务", "融资支持", "政策兑现"],
      level: "beijing" as const,
      docNo: "京政发〔2024〕19号",
      publishDate: "2024-07-22",
    },
    // 2023年
    {
      title: "北京市人民政府关于促进机器人产业创新发展的指导意见",
      department: "北京市经济和信息化局",
      summary: "推动机器人产业创新发展，打造具有全球影响力的机器人产业创新高地。支持工业机器人、服务机器人、特种机器人研发和产业化，对核心技术攻关项目给予最高2000万元支持。建设机器人创新中心和应用示范基地，推动机器人在制造、医疗、养老、教育等领域规模化应用。",
      tags: ["机器人", "产业创新", "应用示范", "核心技术"],
      level: "beijing" as const,
      docNo: "京政发〔2023〕35号",
      publishDate: "2023-09-28",
    },

    // ========== 其他省市政策 ==========
    // 2026年
    {
      title: "深圳市人民政府关于加快建设国际科技创新中心的实施方案",
      department: "深圳市科技创新委员会",
      summary: "打造具有全球影响力的科技和产业创新高地，建设综合性国家科学中心。支持建设重大科技基础设施，对基础研究项目给予长期稳定支持。实施关键核心技术攻关行动，每年投入不少于100亿元。建设鹏城实验室等新型研发机构，探索科技创新体制机制改革。",
      tags: ["科技创新", "基础研究", "核心技术", "新型研发机构"],
      level: "other" as const,
      docNo: "深府〔2026〕18号",
      publishDate: "2026-05-25",
    },
    {
      title: "杭州市人民政府关于支持人才创新创业的若干意见",
      department: "杭州市人力资源和社会保障局",
      summary: "加大人才引进和培育力度，建设人才强市。对顶尖人才团队给予最高1亿元综合支持，领军人才给予500万元资助。实施'杭州人才码'，为人才提供住房、医疗、子女教育等全方位服务。设立100亿元人才创业基金，支持人才创新创业项目。建设国际人才社区，提供国际化生活服务。",
      tags: ["人才引进", "创新创业", "人才服务", "创业基金"],
      level: "other" as const,
      docNo: "杭政〔2026〕14号",
      publishDate: "2026-04-18",
    },
    // 2025年
    {
      title: "上海市人民政府办公厅关于印发《立足数字经济新赛道推动数据要素产业创新发展行动方案（2025-2027年）》的通知",
      department: "上海市人民政府办公厅",
      summary: "推动数据要素产业创新发展，建设上海数据交易所，完善数据流通交易规则。支持企业开展数据产品开发和数据服务创新，对数据要素企业给予研发补贴和场景应用支持，单个项目最高支持1000万元。打造具有国际竞争力的数据要素产业集群，建设数据要素跨境流通枢纽。",
      tags: ["数字经济", "数据要素", "数据交易", "产业创新"],
      level: "other" as const,
      docNo: "沪府办发〔2025〕22号",
      publishDate: "2025-08-18",
    },
    {
      title: "广州市人民政府关于印发广州市数据要素市场化配置改革行动方案的通知",
      department: "广州市人民政府",
      summary: "加快建设数据要素市场体系，推动数据资源开发利用。支持建设广州数据交易所，探索数据资产化路径。对开展数据要素业务的企业给予最高500万元支持，推动公共数据授权运营和数据跨境流通试点。建设数据要素产业园，打造数据要素产业集聚区。",
      tags: ["数据要素", "市场化改革", "数据资产化", "跨境流通"],
      level: "other" as const,
      docNo: "穗府〔2025〕15号",
      publishDate: "2025-07-25",
    },
    {
      title: "深圳市人民政府关于促进人工智能高质量发展的若干措施",
      department: "深圳市科技创新委员会",
      summary: "支持人工智能基础研究、技术创新和产业应用。对人工智能核心技术攻关项目给予最高3000万元支持，对大模型训练提供算力补贴。建设鹏城云脑等新型算力基础设施，推动人工智能在智慧城市、智能制造、生命健康等领域深度应用。",
      tags: ["人工智能", "技术创新", "算力基础设施", "智慧城市"],
      level: "other" as const,
      docNo: "深府〔2025〕28号",
      publishDate: "2025-09-01",
    },
    {
      title: "杭州市人民政府关于推进数字经济创新提质发展的实施意见",
      department: "杭州市人民政府",
      summary: "深化国家数字经济创新发展试验区建设，推动数字产业化和产业数字化。支持云计算、大数据、人工智能等数字产业发展，对重大数字经济项目给予最高1000万元支持。建设城市大脑，推动数字技术在城市治理、公共服务等领域应用。",
      tags: ["数字经济", "数字产业", "城市大脑", "创新发展"],
      level: "other" as const,
      docNo: "杭政〔2025〕19号",
      publishDate: "2025-08-10",
    },
    {
      title: "南京市人民政府办公厅关于推进数据要素市场培育的实施意见",
      department: "南京市人民政府办公厅",
      summary: "培育数据要素市场，促进数据资源开发利用和流通交易。支持企业参与数据要素市场建设，对数据交易平台、数据产品研发给予资金支持，单个项目最高支持500万元。推动政务数据开放共享，建设城市数据大脑和智慧应用场景。",
      tags: ["数据要素", "市场培育", "政务数据", "智慧城市"],
      level: "other" as const,
      docNo: "宁政办发〔2025〕34号",
      publishDate: "2025-07-15",
    },
    // 2024年
    {
      title: "上海市人民政府关于促进专精特新企业高质量发展的实施意见",
      department: "上海市经济和信息化委员会",
      summary: "建立专精特新企业培育体系，加强政策支持和服务保障。对新认定的国家级专精特新'小巨人'企业给予300万元奖励，市级专精特新企业给予100万元支持。支持企业技术改造和数字化转型，按照投资额的20%给予补贴，最高2000万元。建立专精特新企业直通车服务机制。",
      tags: ["专精特新", "企业培育", "技术改造", "服务保障"],
      level: "other" as const,
      docNo: "沪府发〔2024〕25号",
      publishDate: "2024-09-10",
    },
    {
      title: "成都市人民政府关于加快推进绿色低碳产业发展的若干政策措施",
      department: "成都市发展和改革委员会",
      summary: "推动绿色低碳产业集群发展，支持新能源、节能环保、绿色制造等领域创新。对绿色低碳重大项目给予最高3000万元支持，对绿色工厂认证企业给予100万元奖励。建设绿色低碳产业园，提供用地、融资、人才等全方位支持。推动碳排放权交易市场建设。",
      tags: ["绿色低碳", "产业集群", "绿色制造", "碳交易"],
      level: "other" as const,
      docNo: "成府发〔2024〕32号",
      publishDate: "2024-08-05",
    },
    // 2023年
    {
      title: "苏州市人民政府关于支持高精尖产业发展的若干政策",
      department: "苏州市工业和信息化局",
      summary: "聚焦集成电路、生物医药、纳米技术、人工智能等高精尖产业，提供全方位政策支持。对高精尖产业重大项目给予最高5000万元支持，对关键核心技术攻关给予最高2000万元支持。建设高精尖产业园区，提供低成本厂房和配套服务。",
      tags: ["高精尖", "产业支持", "核心技术", "产业园区"],
      level: "other" as const,
      docNo: "苏府〔2023〕48号",
      publishDate: "2023-11-15",
    },
    // 2022年
    {
      title: "广州市人民政府关于促进人工智能产业发展的若干措施",
      department: "广州市工业和信息化局",
      summary: "推动人工智能产业创新发展，打造人工智能产业高地。支持人工智能核心技术研发，对重大技术攻关项目给予最高2000万元支持。建设人工智能产业园和算力中心，对算力基础设施建设按投资额的25%给予补贴，最高3000万元。推动人工智能在制造、医疗、交通等领域应用。",
      tags: ["人工智能", "技术研发", "算力中心", "产业应用"],
      level: "other" as const,
      docNo: "穗府〔2022〕58号",
      publishDate: "2022-10-20",
    },
  ];

  return baseData.map((item, index) => ({
    id: `policy-${index + 1}`,
    title: item.title,
    department: item.department,
    docNo: item.docNo,
    publishDate: item.publishDate,
    collected: false,
    summary: item.summary,
    tags: item.tags,
    level: item.level,
  }));
};

const basePolicies: PolicyResult[] = generatePolicies();

const SUMMARY_ANSWER_COLLAPSE_THRESHOLD = 180;

function isLongSummaryAnswer(answer: string) {
  return answer.length > SUMMARY_ANSWER_COLLAPSE_THRESHOLD || answer.split("\n").filter(Boolean).length > 4;
}

export default function PolicySearchNew() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [searchQuery, setSearchQuery] = useState(""); // 实际执行搜索的关键词
  const [searchTarget, setSearchTarget] = useState<SearchTarget>(
    (searchParams.get("target") as SearchTarget) || "title"
  );
  const [sortMode] = useState<SortMode>("time");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [yearFilter, setYearFilter] = useState<YearFilter>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [otherProvince, setOtherProvince] = useState<string>("广东省");
  const [otherCity, setOtherCity] = useState<string>(OTHER_REGION_OPTIONS["广东省"][0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    loadFavoritePolicies().map((item) => item.id)
  );
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryAnswerExpanded, setSummaryAnswerExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // 每页显示10条

  // 新增的三个筛选条件
  const [policyLevelFilter, setPolicyLevelFilter] = useState<PolicyLevelFilter>("all");
  const [policyThemeFilter, setPolicyThemeFilter] = useState<PolicyThemeFilter>("all");
  const [industryTypeFilter, setIndustryTypeFilter] = useState<IndustryTypeFilter>("all");

  // 高级筛选展开状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 搜索历史相关状态
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // 反馈弹窗状态
  const [showFeedback, setShowFeedback] = useState(false);

  // 搜索模式状态：智能检索 or 传统检索
  const [searchMode, setSearchMode] = useState<'intelligent' | 'traditional'>('intelligent');

  // 政策主题和产业类型下拉框状态
  const [showPolicyThemeDropdown, setShowPolicyThemeDropdown] = useState(false);
  const [showIndustryTypeDropdown, setShowIndustryTypeDropdown] = useState(false);
  const policyThemeDropdownRef = useRef<HTMLDivElement>(null);
  const industryTypeDropdownRef = useRef<HTMLDivElement>(null);

  const policies: PolicyResult[] = basePolicies;

  // 加载搜索历史（在组件挂载后）
  useEffect(() => {
    setSearchHistory(loadSearchHistory());
  }, []);

  // 点击外部关闭历史记录下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        historyDropdownRef.current &&
        !historyDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
      // 关闭政策主题下拉框
      if (
        policyThemeDropdownRef.current &&
        !policyThemeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPolicyThemeDropdown(false);
      }
      // 关闭产业类型下拉框
      if (
        industryTypeDropdownRef.current &&
        !industryTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowIndustryTypeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 重置所有筛选条件
  const handleReset = () => {
    setKeyword("");
    setSearchQuery("");
    setYearFilter("all");
    setThemeFilter("all");
    setRegionFilter("all");
    setSearchTarget("title");
    setSelectedIds([]);
    setPolicyLevelFilter("all");
    setPolicyThemeFilter("all");
    setIndustryTypeFilter("all");
    // 重置后，如果搜索框获得焦点且为空，显示搜索历史
    if (searchInputRef.current === document.activeElement) {
      setShowHistory(true);
    }
  };

  // 切换搜索模式
  const toggleSearchMode = () => {
    const newMode = searchMode === 'intelligent' ? 'traditional' : 'intelligent';
    setSearchMode(newMode);

    // 切换模式时重置筛选条件，但保持搜索结果
    setYearFilter("all");
    setThemeFilter("all");
    setRegionFilter("all");
    setSearchTarget("title");
    setPolicyLevelFilter("all");
    setPolicyThemeFilter("all");
    setIndustryTypeFilter("all");
    setShowAdvancedFilters(false);
  };

  // 搜索按钮处理函数
  const handleSearch = () => {
    const trimmedKeyword = keyword.trim();

    // 如果搜索框为空，执行重置逻辑
    if (!trimmedKeyword) {
      setSearchQuery("");
      return;
    }

    // 智能检索模式：解析自然语言并应用筛选条件
    if (searchMode === 'intelligent') {
      const parsed = parseIntelligentQuery(trimmedKeyword);
      setYearFilter(parsed.yearFilter);
      setThemeFilter(parsed.themeFilter);
      setRegionFilter(parsed.regionFilter);
      setSearchTarget(parsed.searchTarget);
      setPolicyLevelFilter(parsed.policyLevelFilter);
      setPolicyThemeFilter(parsed.policyThemeFilter);
      setIndustryTypeFilter(parsed.industryTypeFilter);

      // 使用清洗后的关键词进行搜索
      setSearchQuery(parsed.cleanedKeyword.trim());
    } else {
      // 传统检索模式：直接使用关键词，不解析
      setSearchQuery(trimmedKeyword);
    }

    // 保存搜索历史（只保存关键词）
    saveSearchHistory(trimmedKeyword);
    setSearchHistory(loadSearchHistory());

    // 关闭历史记录下拉框
    setShowHistory(false);
  };

  // 应用历史记录（点击历史记录项）
  const applyHistoryItem = (item: SearchHistoryItem) => {
    setKeyword(item.keyword);
    setShowHistory(false);

    // 自动执行搜索
    const trimmedKeyword = item.keyword.trim();
    const parsed = parseIntelligentQuery(trimmedKeyword);
    setYearFilter(parsed.yearFilter);
    setThemeFilter(parsed.themeFilter);
    setRegionFilter(parsed.regionFilter);
    setSearchTarget(parsed.searchTarget);
    setPolicyLevelFilter(parsed.policyLevelFilter);
    setPolicyThemeFilter(parsed.policyThemeFilter);
    setIndustryTypeFilter(parsed.industryTypeFilter);
    setSearchQuery(parsed.cleanedKeyword.trim());

    // 保存搜索历史
    saveSearchHistory(trimmedKeyword);
    setSearchHistory(loadSearchHistory());
  };

  // 删除历史记录
  const deleteHistoryItem = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeSearchHistory(id);
    setSearchHistory(loadSearchHistory());
  };

  // 过滤和筛选逻辑
  const pageResults = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    // 应用地区、年份、主题筛选
    const applyFilters = (items: PolicyResult[]) => {
      let filtered = items;

      // 地区筛选
      if (regionFilter !== "all") {
        filtered = filtered.filter((item) => {
          if (regionFilter === "national") return item.level === "national";
          if (regionFilter === "yizhuang") return item.level === "yizhuang";
          if (regionFilter === "beijing") return item.level === "beijing";
          return item.level === "other";
        });
      }

      // 年份筛选
      if (yearFilter !== "all") {
        filtered = filtered.filter((item) => item.publishDate.startsWith(yearFilter));
      }

      // 主题筛选
      if (themeFilter !== "all") {
        filtered = filtered.filter((item) => {
          const text = `${item.title} ${item.summary ?? ""} ${item.tags?.join(" ") ?? ""}`;
          return text.includes(themeFilter);
        });
      }

      // 新增的三个筛选条件
      if (policyLevelFilter !== "all") {
        filtered = filtered.filter((item) => item.policyLevel === policyLevelFilter);
      }

      if (policyThemeFilter !== "all") {
        filtered = filtered.filter((item) => item.policyTheme?.includes(policyThemeFilter) ?? false);
      }

      if (industryTypeFilter !== "all") {
        filtered = filtered.filter((item) => item.industryType?.includes(industryTypeFilter) ?? false);
      }

      return filtered;
    };

    // 如果没有搜索关键词，返回所有政策并应用筛选条件
    if (!normalized) {
      const filtered = applyFilters(policies);

      if (sortMode === "time") {
        return [...filtered].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
      }

      return [...filtered];
    }

    // 有搜索关键词时，按关键词过滤后再应用筛选条件
    const keywordFiltered = policies.filter((item) => {
      const titleText = `${item.title} ${item.department}`.toLowerCase();
      const contentText = `${item.content ?? ""} ${item.summary ?? ""}`.toLowerCase();
      return searchTarget === "content"
        ? `${titleText} ${contentText}`.includes(normalized)
        : titleText.includes(normalized);
    });

    const filtered = applyFilters(keywordFiltered);

    if (sortMode === "time") {
      return [...filtered].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
    }

    return [...filtered];
  }, [searchQuery, sortMode, searchTarget, regionFilter, yearFilter, themeFilter, policyLevelFilter, policyThemeFilter, industryTypeFilter, policies]);

  // 总的分页数据
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return pageResults.slice(startIndex, endIndex);
  }, [pageResults, currentPage, pageSize]);

  const totalPages = Math.ceil(pageResults.length / pageSize);

  // 提取所有标签并统计频次
  const topTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    pageResults.forEach((policy) => {
      policy.tags?.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [pageResults]);

  // 生成结构化的AI总结
  useEffect(() => {
    // 只在有搜索关键词时生成AI总结
    // 使用 keyword 而不是 searchQuery，确保即使是纯筛选条件（如"2024"）也能生成总结
    if (keyword.trim() && pageResults.length > 0) {
      const kw = keyword.trim();

      // 统计各层级数量
      const nationalCount = pageResults.filter((p) => p.level === "national").length;
      const yizhuangCount = pageResults.filter((p) => p.level === "yizhuang").length;
      const beijingCount = pageResults.filter((p) => p.level === "beijing").length;
      const otherCount = pageResults.filter((p) => p.level === "other").length;
      const materialCount = pageResults.filter((p) => favoriteIds.includes(p.id)).length;

      // 生成筛选条件说明
      let filterInfo = "";
      if (yearFilter !== "all") {
        filterInfo += `时间范围：${yearFilter}年；`;
      }
      if (regionFilter !== "all") {
        const regionMap: Record<RegionFilter, string> = {
          all: "全部",
          national: "国家级",
          beijing: "北京市",
          yizhuang: "经开区",
          other: "其他省市",
        };
        filterInfo += `地区：${regionMap[regionFilter]}；`;
      }
      if (themeFilter !== "all") {
        filterInfo += `主题：${themeFilter}；`;
      }
      if (searchTarget === "content") {
        filterInfo += `搜索范围：全文；`;
      }

      let intelligentAnswer = "";
      if (kw.includes("数据") || kw.includes("数字")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，聚焦数据要素市场化配置和数字经济发展。

**国家层面**：建立数据要素市场体系，推动数据资产入表和要素定价机制改革，支持区域性、行业性数据交易平台建设。

**经开区层面**：对数据交易平台建设给予最高3000万元支持，数据应用场景示范项目最高500万元。布局智能算力中心、可信数据空间和数据标注基地，推动工业制造、城市治理、医疗健康等领域场景开放。

**北京市层面**：建设全球数字经济标杆城市，对投资1000万元以上的数字化改造项目按30%补贴，最高500万元。建设北京国际大数据交易所，推动数据要素有序流通。

**其他省市**：上海、广州、深圳等地积极探索数据资产化路径，推动数据跨境流通和公共数据授权运营试点。

**建议关注**：数据要素市场化配置政策、数据交易平台建设支持、数字化转型补贴项目。`;
      } else if (kw.includes("人才")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，构建了完整的人才支持体系。

**高层次人才**：国家级领军人才可获200万元安家费，两院院士提供1000万元科研经费+300万元安家费，享受优先落户和子女入学政策。

**青年人才**：博士后提供30万元生活补贴，博士首次购房可获30万元补贴，设立人才创新创业基金年支持100个以上优秀项目。

**住房保障**：重点功能区工作人才优先申请共有产权房和人才公租房，高层次人才可申请人才公寓。

**配套服务**：一站式人才服务窗口，配偶就业安置，子女教育优先，医疗保健绿色通道。

**建议关注**：人才十条实施细则、人才引进专项政策、住房保障措施。`;
      } else if (kw.includes("专精特新")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，建立了"创新型中小企业→专精特新中小企业→小巨人企业"三级培育体系。

**国家层面**：国家级专精特新"小巨人"企业给予不低于500万元综合支持，引导地方配套不少于等额资金。完善融资支持体系，建立上市培育机制。

**北京市层面**：国家级"小巨人"企业200万元一次性奖励，市级专精特新企业50万元支持。技术改造按设备投资额15%补贴，最高1000万元。

**经开区层面**：国家级"小巨人"企业300万元奖励，市级专精特新企业100万元支持。技术改造按投资额20%补贴，最高2000万元。

**融资支持**：建立专精特新企业培育库，提供融资担保、上市辅导等全链条服务。设立中小企业发展基金，小微企业贷款给予贴息支持。

**建议关注**：专精特新企业认定标准、融资支持政策、技术改造专项补贴。`;
      } else if (kw.includes("人工智能") || kw.includes("AI") || kw.includes("大模型")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，全面支持人工智能产业发展。

**国家层面**：推动大模型技术研发和算力基础设施建设，对重大项目给予专项资金支持，建设国家级人工智能创新中心和开放平台。

**经开区层面**：对大模型训练项目提供算力券支持（最高1000万元），使用公共智算平台按算力费用50%补贴。推动100个AI+应用场景落地，每个场景300-500万元。

**北京市层面**：智算中心建设按投资额30%支持，最高5000万元。推动人工智能在制造、医疗、交通、教育等领域深度应用。

**其他省市**：深圳对AI核心技术攻关项目给予最高3000万元支持，建设鹏城云脑等新型算力基础设施。

**建议关注**：算力券申领政策、AI场景应用支持、智算中心建设补贴。`;
      } else if (kw.includes("绿色") || kw.includes("低碳")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，全面推动绿色低碳发展。

**国家层面**：构建绿色低碳循环发展经济体系，支持绿色技术创新和绿色制造体系建设，对绿色工厂、绿色园区给予资金奖励。建立健全绿色金融体系，推动碳排放权交易市场建设。

**经开区层面**：对绿色低碳重大项目给予最高5000万元支持，对绿色工厂、绿色供应链认证企业给予50-200万元奖励。支持企业开展碳排放核算和碳资产管理，建设碳中和示范园区。

**北京市层面**：支持企业实施节能降碳技术改造，按照投资额的30%给予补贴，最高3000万元。对获得绿色工厂、绿色供应链认证的企业给予100-300万元奖励。

**建议关注**：绿色低碳项目支持、节能降碳技术改造补贴、绿色认证奖励政策。`;
      } else if (kw.includes("高精尖")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，聚焦高精尖产业发展。

**支持领域**：集成电路、生物医药、新材料、人工智能、新能源汽车、智能装备等高精尖产业。

**经开区层面**：对高精尖产业重大项目给予最高1亿元支持，对关键核心技术攻关给予最高3000万元支持。建设高精尖产业孵化基地。

**北京市层面**：对高精尖产业重大项目给予全链条支持，单个项目最高支持1亿元。建设高精尖产业发展基金，规模不少于500亿元。

**建议关注**：高精尖产业重大项目支持、核心技术攻关资助、产业基金申请。`;
      } else if (kw.includes("脑机接口")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，重点支持脑机接口技术创新和产业化。

**经开区层面**：对承担国家级重大项目的企业给予最高2000万元配套支持，脑机接口创新产品首台（套）应用奖励最高1000万元。建设脑机接口测试验证平台和产业创新中心。

**应用领域**：医疗康复、智能交互、教育娱乐等领域应用创新，构建完整产业生态。

**建议关注**：脑机接口技术攻关支持、首台套应用奖励、测试验证平台建设。`;
      } else if (kw.includes("机器人")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，支持工业机器人、服务机器人、特种机器人研发和产业化。

**国家层面**：推动机器人产业高质量发展，支持关键零部件研发给予专项支持，推动机器人规模化应用。

**经开区层面**：机器人核心零部件研发给予最高1000万元支持，整机产品首次销售给予销售额20%、最高500万元奖励。建设机器人检测认证平台和应用示范基地，推动100个机器人应用场景落地。

**北京市层面**：对核心技术攻关项目给予最高2000万元支持，建设机器人创新中心和应用示范基地。

**建议关注**：核心零部件研发支持、首次销售奖励、应用场景推广政策。`;
      } else if (kw.includes("集成电路") || kw.includes("芯片")) {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，支持芯片设计、晶圆制造、封装测试全产业链发展。

**北京市层面**：首次流片成功的芯片设计企业给予流片费用50%支持，最高300万元。12英寸晶圆生产线建设按设备投资额20%支持，最高5亿元。建立芯片适配验证平台，推动国产芯片示范应用。

**建议关注**：流片费用补贴、晶圆生产线建设支持、国产芯片应用推广。`;
      } else {
        intelligentAnswer = `检索到${pageResults.length}条相关政策${filterInfo ? `（${filterInfo}）` : ""}，涵盖产业发展、企业培育、人才引进、科技创新等多个领域。

**产业支持**：聚焦数字经济、人工智能、数据要素、专精特新等重点领域，提供项目补贴、税收优惠、用地保障等全方位支持。

**企业培育**：构建"初创企业→成长企业→领军企业"全生命周期服务体系，提供融资、市场、人才等资源对接。

**人才引进**：实施"人才十条"政策，提供安家费、购房补贴、落户支持、子女教育等综合保障。

**创新驱动**：支持企业建设研发中心、申报科技项目、开展产学研合作，推动科技成果转化。

**建议关注**：根据企业所属行业和发展阶段，重点关注相应的专项支持政策。`;
      }

      setAiSummary(JSON.stringify({
        overview: {
          national: nationalCount,
          yizhuang: yizhuangCount,
          beijing: beijingCount,
          other: otherCount,
          material: materialCount,
          total: pageResults.length,
        },
        topTags,
        answer: intelligentAnswer,
        filters: filterInfo ? {
          year: yearFilter !== "all" ? yearFilter : null,
          region: regionFilter !== "all" ? regionFilter : null,
          theme: themeFilter !== "all" ? themeFilter : null,
          searchTarget: searchTarget === "content" ? "全文" : "标题",
        } : null,
      }));
    } else {
      setAiSummary("");
    }
  }, [keyword, pageResults, favoriteIds, topTags, yearFilter, regionFilter, themeFilter, searchTarget]);

  useEffect(() => {
    setSummaryAnswerExpanded(false);
  }, [aiSummary]);

  const totalResults = pageResults.length;

  // 当搜索条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, regionFilter, yearFilter, themeFilter, policyLevelFilter, policyThemeFilter, industryTypeFilter]);

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到结果顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allSelected =
    paginatedResults.length > 0 &&
    selectedIds.length > 0 &&
    paginatedResults.every((item) => selectedIds.includes(item.id));

  const toggleCollected = (item: PolicyResult) => {
    const isCollected = favoriteIds.includes(item.id);
    if (isCollected) {
      removeFavoritePolicy(item.id);
      setFavoriteIds((prev) => prev.filter((id) => id !== item.id));
      return;
    }
    upsertFavoritePolicy({
      id: item.id,
      title: item.title,
      department: item.department,
      docNo: item.docNo,
      publishDate: item.publishDate,
      content: item.summary,
    });
    setFavoriteIds((prev) => Array.from(new Set([...prev, item.id])));
  };

  const handleBatchCollect = () => {
    const selectedItems = pageResults.filter((item) => selectedIds.includes(item.id));
    selectedItems.forEach((item) =>
      upsertFavoritePolicy({
        id: item.id,
        title: item.title,
        department: item.department,
        docNo: item.docNo,
        publishDate: item.publishDate,
        content: item.summary,
      })
    );
    setFavoriteIds((prev) => Array.from(new Set([...prev, ...selectedItems.map((item) => item.id)])));
    setSelectedIds([]); // 清空所有勾选
  };

  const handleBatchUncollect = () => {
    selectedIds.forEach((id) => removeFavoritePolicy(id));
    setFavoriteIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    setSelectedIds([]); // 清空所有勾选
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedResults.map((item) => item.id) : []);
  };

  const toggleSelectItem = (policyId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, policyId]));
      }
      return current.filter((id) => id !== policyId);
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => navigate("/policy-writing")}
              className="inline-flex items-center gap-1 transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              返回政策制定
            </button>
            <span>/</span>
            <span className="text-foreground">政策检索</span>
          </div>

          {/* 意见反馈按钮 */}
          <Button
            onClick={() => setShowFeedback(true)}
            variant="outline"
            className="flex items-center gap-2 rounded-xl border-[#d8dbe2] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <MessageSquare className="h-4 w-4" />
            意见反馈
          </Button>
        </div>

        <Card className="rounded-[28px] border-none bg-white px-6 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  value={keyword}
                  onChange={(event) => {
                    const newValue = event.target.value;
                    setKeyword(newValue);
                    // 当用户清空搜索框时，如果输入框有焦点，显示搜索历史
                    if (!newValue.trim() && document.activeElement === searchInputRef.current) {
                      setShowHistory(true);
                    } else if (newValue.trim()) {
                      // 有内容时隐藏搜索历史
                      setShowHistory(false);
                    }
                  }}
                  onFocus={() => {
                    // 只在搜索框为空时显示搜索历史
                    if (!keyword.trim()) {
                      setShowHistory(true);
                    }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder={searchMode === 'intelligent'
                      ? "请输入自然语言查询，如：2025年人工智能相关政策、2024绿色低碳"
                      : "请输入政策关键词"}
                    className="h-14 rounded-2xl border-[#d9dce3] bg-white pl-5 pr-32 text-base shadow-none placeholder:text-[#b0b4be] focus-visible:ring-primary"
                  />

                  {/* 模式切换按钮 - 在搜索图标左侧 */}
                  <button
                    type="button"
                    onClick={toggleSearchMode}
                    className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-primary/5 group"
                    title={searchMode === 'intelligent' ? '切换到传统检索' : '切换到智能检索'}
                  >
                    {searchMode === 'intelligent' ? (
                      <>
                        <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-primary">智能检索</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 text-[#6b7280] group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-[#6b7280]">传统检索</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 cursor-pointer transition-colors"
                  >
                    <Search className="h-5 w-5 text-[#6b7280] hover:text-primary" />
                  </button>

                  {/* 搜索历史下拉框 - 只在搜索框为空时显示 */}
                  {showHistory && !keyword.trim() && searchHistory.length > 0 && (
                    <div
                      ref={historyDropdownRef}
                      className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[400px] overflow-y-auto rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                    >
                      <div className="border-b border-[#f0f1f3] px-5 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                            <Clock className="h-4 w-4" />
                            <span>搜索历史</span>
                          </div>
                          <span className="text-xs text-[#9ca3af]">最近10条</span>
                        </div>
                      </div>
                      <div className="py-2">
                        {searchHistory.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => applyHistoryItem(item)}
                            className="group flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-[#f9fafb]"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <Clock className="h-4 w-4 flex-shrink-0 text-[#9ca3af]" />
                              <span className="truncate text-[15px] text-foreground">
                                {item.keyword}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => deleteHistoryItem(item.id, e)}
                              className="flex-shrink-0 rounded-lg p-1 opacity-0 transition-opacity hover:bg-[#f3f4f6] group-hover:opacity-100"
                            >
                              <X className="h-4 w-4 text-[#9ca3af]" />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-14 px-5 rounded-2xl bg-[#f5f7fa] transition-colors hover:bg-[#ebedf0] flex items-center gap-2 text-muted-foreground"
                  title="重置所有筛选条件"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            {/* 发布时间 + 地区 + 搜索位置 + 更多筛选 - 仅在传统检索模式显示 */}
            {searchMode === 'traditional' && (
            <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* 发布时间筛选 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">发布时间：</span>
                  {publishYears.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setYearFilter(year)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-sm transition-colors whitespace-nowrap",
                        yearFilter === year
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[#d8dbe2] text-foreground hover:border-primary/40"
                      )}
                    >
                      {year === "all" ? "全部" : year}
                    </button>
                  ))}
                </div>

                {/* 地区筛选 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">地区：</span>
                  {[
                    { key: "all" as RegionFilter, label: "全部" },
                    { key: "national" as RegionFilter, label: "国家级" },
                    { key: "beijing" as RegionFilter, label: "北京市" },
                    { key: "yizhuang" as RegionFilter, label: "经开区" },
                    { key: "other" as RegionFilter, label: "其他省市" }
                  ].map((region) => (
                    <button
                      key={region.key}
                      type="button"
                      onClick={() => setRegionFilter(region.key)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-sm transition-colors whitespace-nowrap",
                        regionFilter === region.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-[#d8dbe2] text-foreground hover:border-primary/40"
                      )}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>

                {/* 搜索位置 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">搜索位置：</span>
                  <button
                    type="button"
                    onClick={() => setSearchTarget("title")}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        searchTarget === "title" ? "border-primary" : "border-[#d1d5db]"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          searchTarget === "title" ? "bg-primary" : "bg-transparent"
                        )}
                      />
                    </span>
                    标题
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchTarget("content")}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        searchTarget === "content" ? "border-primary" : "border-[#d1d5db]"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          searchTarget === "content" ? "bg-primary" : "bg-transparent"
                        )}
                      />
                    </span>
                    全文
                  </button>
                </div>
              </div>

              {/* 更多筛选按钮 */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
              >
                <span>更多筛选</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showAdvancedFilters && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* 展开的高级筛选条件 */}
            {showAdvancedFilters && (
              <div className="flex items-center gap-6">
                {/* 政策主题 */}
                <div className="relative flex items-center gap-3" ref={policyThemeDropdownRef}>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">政策主题：</span>
                  <button
                    type="button"
                    onClick={() => setShowPolicyThemeDropdown(!showPolicyThemeDropdown)}
                    className="h-9 w-[120px] rounded-lg border border-[#d8dbe2] bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors hover:border-primary/40 flex items-center justify-between"
                  >
                    <span>
                      {policyThemeFilter === 'all' && '全部'}
                      {policyThemeFilter === 'talent' && '人才'}
                      {policyThemeFilter === 'finance' && '金融'}
                      {policyThemeFilter === 'fiscal' && '财政激励'}
                      {policyThemeFilter === 'land' && '土地支持'}
                      {policyThemeFilter === 'tax' && '税收'}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-[#9ca3af] transition-transform",
                        showPolicyThemeDropdown && "rotate-180"
                      )}
                    />
                  </button>

                  {/* 下拉菜单 */}
                  {showPolicyThemeDropdown && (
                    <div className="absolute left-20 top-[calc(100%+4px)] z-50 w-[120px] rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.1)] overflow-hidden">
                      {[
                        { key: 'all' as PolicyThemeFilter, label: '全部' },
                        { key: 'talent' as PolicyThemeFilter, label: '人才' },
                        { key: 'finance' as PolicyThemeFilter, label: '金融' },
                        { key: 'fiscal' as PolicyThemeFilter, label: '财政激励' },
                        { key: 'land' as PolicyThemeFilter, label: '土地支持' },
                        { key: 'tax' as PolicyThemeFilter, label: '税收' }
                      ].map((theme) => (
                        <button
                          key={theme.key}
                          type="button"
                          onClick={() => {
                            setPolicyThemeFilter(theme.key);
                            setShowPolicyThemeDropdown(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2.5 text-left text-sm transition-colors",
                            policyThemeFilter === theme.key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-[#f9fafb]"
                          )}
                        >
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 产业类型 */}
                <div className="relative flex items-center gap-3" ref={industryTypeDropdownRef}>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">产业类型：</span>
                  <button
                    type="button"
                    onClick={() => setShowIndustryTypeDropdown(!showIndustryTypeDropdown)}
                    className="h-9 w-[240px] rounded-lg border border-[#d8dbe2] bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors hover:border-primary/40 flex items-center justify-between"
                  >
                    <span className="truncate">
                      {industryTypeFilter === 'all' && '全部'}
                      {industryTypeFilter === 'new-it' && '新一代信息技术产业'}
                      {industryTypeFilter === 'auto-ev' && '高端汽车和新能源智能汽车产业'}
                      {industryTypeFilter === 'robot-manufacturing' && '机器人和智能制造产业'}
                      {industryTypeFilter === 'biotech-health' && '生物技术和大健康产业'}
                      {industryTypeFilter === 'autonomous-driving' && '自动驾驶产业'}
                      {industryTypeFilter === 'ic' && '集成电路产业'}
                      {industryTypeFilter === 'culture-tech' && '科文融合产业'}
                      {industryTypeFilter === 'business-service' && '商业服务业产业'}
                      {industryTypeFilter === 'digital-economy' && '数字经济企业'}
                      {industryTypeFilter === 'productive-service' && '生产性服务业'}
                      {industryTypeFilter === 'urban-industry' && '都市产业'}
                      {industryTypeFilter === 'integration' && '两业融合'}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-[#9ca3af] transition-transform flex-shrink-0",
                        showIndustryTypeDropdown && "rotate-180"
                      )}
                    />
                  </button>

                  {/* 下拉菜单 */}
                  {showIndustryTypeDropdown && (
                    <div className="absolute left-20 top-[calc(100%+4px)] z-50 w-[280px] rounded-xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.1)] overflow-hidden max-h-[360px] overflow-y-auto custom-scrollbar">
                      {[
                        { key: 'all' as IndustryTypeFilter, label: '全部' },
                        { key: 'new-it' as IndustryTypeFilter, label: '新一代信息技术产业' },
                        { key: 'auto-ev' as IndustryTypeFilter, label: '高端汽车和新能源智能汽车产业' },
                        { key: 'robot-manufacturing' as IndustryTypeFilter, label: '机器人和智能制造产业' },
                        { key: 'biotech-health' as IndustryTypeFilter, label: '生物技术和大健康产业' },
                        { key: 'autonomous-driving' as IndustryTypeFilter, label: '自动驾驶产业' },
                        { key: 'ic' as IndustryTypeFilter, label: '集成电路产业' },
                        { key: 'culture-tech' as IndustryTypeFilter, label: '科文融合产业' },
                        { key: 'business-service' as IndustryTypeFilter, label: '商业服务业产业' },
                        { key: 'digital-economy' as IndustryTypeFilter, label: '数字经济企业' },
                        { key: 'productive-service' as IndustryTypeFilter, label: '生产性服务业' },
                        { key: 'urban-industry' as IndustryTypeFilter, label: '都市产业' },
                        { key: 'integration' as IndustryTypeFilter, label: '两业融合' }
                      ].map((industry) => (
                        <button
                          key={industry.key}
                          type="button"
                          onClick={() => {
                            setIndustryTypeFilter(industry.key);
                            setShowIndustryTypeDropdown(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left text-sm transition-colors leading-relaxed",
                            industryTypeFilter === industry.key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-[#f9fafb]"
                          )}
                        >
                          {industry.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        </Card>

        {searchMode === 'intelligent' && aiSummary && (
            <Card className="rounded-[28px] border-none bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <h4 className="text-base font-semibold text-foreground">AI 为您总结</h4>

                  {(() => {
                    const summary = JSON.parse(aiSummary);
                    return (
                      <>
                        <div>
                          <h5 className="mb-2 text-sm font-semibold text-foreground">搜索结果概览</h5>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {summary.overview.national > 0 && (
                              <span>国家级政策 <span className="font-semibold text-primary">{summary.overview.national}</span> 条</span>
                            )}
                            {summary.overview.yizhuang > 0 && (
                              <span>经开区政策 <span className="font-semibold text-primary">{summary.overview.yizhuang}</span> 条</span>
                            )}
                            {summary.overview.beijing > 0 && (
                              <span>北京市政策 <span className="font-semibold text-primary">{summary.overview.beijing}</span> 条</span>
                            )}
                            {summary.overview.other > 0 && (
                              <span>其他省市政策 <span className="font-semibold text-primary">{summary.overview.other}</span> 条</span>
                            )}
                            {summary.overview.material > 0 && (
                              <span>我的素材库 <span className="font-semibold text-primary">{summary.overview.material}</span> 条</span>
                            )}
                          </div>
                        </div>

                        {summary.topTags.length > 0 && (
                          <div>
                            <h5 className="mb-2 text-sm font-semibold text-foreground">主要研究主题</h5>
                            <div className="flex flex-wrap gap-2">
                              {summary.topTags.map((tag: string) => (
                                <Badge
                                  key={tag}
                                  className="cursor-pointer rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20"
                                  onClick={() => setThemeFilter(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold text-foreground">智能简要回答</h5>
                            {isLongSummaryAnswer(summary.answer) ? (
                              <button
                                type="button"
                                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
                                onClick={() => setSummaryAnswerExpanded((current) => !current)}
                              >
                                {summaryAnswerExpanded ? "收起" : "展开"}
                                <ChevronDown
                                  className={cn("h-4 w-4 transition-transform", summaryAnswerExpanded && "rotate-180")}
                                />
                              </button>
                            ) : null}
                          </div>
                          <p
                            className={cn(
                              "text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
                              !summaryAnswerExpanded &&
                                isLongSummaryAnswer(summary.answer) &&
                                "max-h-[6.5rem] overflow-hidden",
                            )}
                          >
                            {summary.answer}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </Card>
          )}

        <Card className="overflow-hidden rounded-[28px] border-none bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[#eef0f3] px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-6 text-[15px]">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                      />
                      <span className="text-[18px] font-semibold text-foreground">
                        相关结果
                        <span className="mx-1 text-primary">{totalResults}</span>条
                      </span>
                    </div>

                    <button type="button" className="text-[15px] font-medium text-muted-foreground hover:text-foreground">
                      按时间排序
                    </button>
                  </div>

                  {/* 流程示意 - 温馨提示风格 */}
                  <div className="flex items-center gap-1.5 text-[13px] text-[#9ca3af]">
                    {/* 步骤1: 检索结果 */}
                    <div className="relative group">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md cursor-help transition-colors hover:bg-[#f9fafb] hover:text-[#6b7280]">
                        <Search className="h-3.5 w-3.5" />
                        <span className="whitespace-nowrap">检索结果</span>
                      </div>

                      {/* 悬停信息卡片 */}
                      <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-lg bg-white border border-[#e5e7eb] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Search className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <h4 className="text-xs font-semibold text-foreground">检索结果</h4>
                          </div>
                          <p className="text-xs text-[#6b7280] leading-relaxed">
                            通过AI分析总结政策要点，智能检索相关政策文件
                          </p>
                        </div>
                        {/* 小三角 */}
                        <div className="absolute left-6 -top-1 w-2 h-2 bg-white border-l border-t border-[#e5e7eb] rotate-45"></div>
                      </div>
                    </div>

                    {/* 箭头 */}
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />

                    {/* 步骤2: 政策详情 */}
                    <div className="relative group">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md cursor-help transition-colors hover:bg-[#f9fafb] hover:text-[#6b7280]">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="whitespace-nowrap">政策详情</span>
                      </div>

                      {/* 悬停信息卡片 */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 rounded-lg bg-white border border-[#e5e7eb] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <h4 className="text-xs font-semibold text-foreground">政策详情</h4>
                          </div>
                          <p className="text-xs text-[#6b7280] leading-relaxed">
                            点击政策标题查看完整政策全文和详细信息
                          </p>
                        </div>
                        {/* 小三角 */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-white border-l border-t border-[#e5e7eb] rotate-45"></div>
                      </div>
                    </div>

                    {/* 箭头 */}
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />

                    {/* 步骤3: 加入储备库 */}
                    <div className="relative group">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md cursor-help transition-colors hover:bg-[#f9fafb] hover:text-[#6b7280]">
                        <Database className="h-3.5 w-3.5" />
                        <span className="whitespace-nowrap">加入储备库</span>
                      </div>

                      {/* 悬停信息卡片 */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 rounded-lg bg-white border border-[#e5e7eb] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <MousePointerClick className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <h4 className="text-xs font-semibold text-foreground">加入储备库</h4>
                          </div>
                          <p className="text-xs text-[#6b7280] leading-relaxed">
                            在政策全文中拖拽鼠标选择具体条款，右键可加入条款储备库供后续参考
                          </p>
                        </div>
                        {/* 小三角 */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-white border-l border-t border-[#e5e7eb] rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* 智能检索模式下的地区筛选 - 标签形式 */}
                  {searchMode === 'intelligent' && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">地区：</span>
                        {[
                          { key: "all" as RegionFilter, label: "全部" },
                          { key: "national" as RegionFilter, label: "国家级" },
                          { key: "beijing" as RegionFilter, label: "北京市" },
                          { key: "yizhuang" as RegionFilter, label: "经开区" },
                          { key: "other" as RegionFilter, label: "其他省市" }
                        ].map((region) => (
                          <button
                            key={region.key}
                            type="button"
                            onClick={() => setRegionFilter(region.key)}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-sm font-medium transition-all whitespace-nowrap",
                              regionFilter === region.key
                                ? "bg-primary text-white shadow-sm"
                                : "bg-[#f5f7fa] text-[#6b7280] hover:bg-[#ebedf0]"
                            )}
                          >
                            {region.label}
                          </button>
                        ))}
                      </div>

                      {/* 分隔线 */}
                      <div className="h-6 w-px bg-[#e5e7eb]"></div>
                    </>
                  )}

                  <Button
                    size="sm"
                    className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                    onClick={handleBatchCollect}
                    disabled={selectedIds.length === 0}
                  >
                    <Star className="h-3.5 w-3.5" />
                    批量收藏
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg border-[#d8dbe2] px-4 text-sm font-medium text-muted-foreground hover:border-red-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={handleBatchUncollect}
                    disabled={selectedIds.length === 0}
                  >
                    取消收藏
                  </Button>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#eef0f3]">
              {paginatedResults.map((item, index) => {
                const selected = selectedIds.includes(item.id);
                const isCollected = favoriteIds.includes(item.id);
                const itemNumber = (currentPage - 1) * pageSize + index + 1;

                return (
                  <div key={item.id} className="flex gap-4 px-6 py-6 hover:bg-[#f9fafb]">
                    <div className="flex items-start gap-3 pt-1">
                      <span className="text-sm font-medium text-muted-foreground">{itemNumber}.</span>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => toggleSelectItem(item.id, Boolean(checked))}
                      />
                    </div>

                    <div className="min-w-0 space-y-3" style={{ width: 'calc(100% - 180px)' }}>
                      <h3 className="text-[17px] font-semibold leading-7 text-foreground">
                        {item.title}
                      </h3>

                      {item.summary && (
                        <p className="text-[14px] leading-6 text-muted-foreground text-justify">{item.summary}</p>
                      )}

                      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr] gap-x-4 text-[13px] text-[#8b90a0]">
                        <span className="whitespace-nowrap">发文单位：</span>
                        <span className="break-words -ml-[6px]">{item.department}</span>
                        <span className="whitespace-nowrap">发文字号：</span>
                        <span className="break-words -ml-[6px]">{item.docNo}</span>
                        <span className="whitespace-nowrap">发文时间：</span>
                        <span className="break-words -ml-[6px]">{item.publishDate}</span>
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-full border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs text-primary"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="w-[100px] flex-shrink-0 flex items-start pt-1">
                      <button
                        type="button"
                        onClick={() => toggleCollected(item)}
                        className={cn(
                          "flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          isCollected
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "bg-gray-50 text-muted-foreground hover:bg-gray-100"
                        )}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            isCollected && "fill-amber-500 text-amber-500"
                          )}
                        />
                        <span>{isCollected ? "已收藏" : "收藏"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 总的分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 border-t border-[#eef0f3] px-6 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-9 px-4"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <span className="text-sm text-muted-foreground">
                    共 {totalResults} 条结果
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-9 px-4"
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>

        {/* 意见反馈弹窗 */}
        {showFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] border-none bg-white shadow-[0_20px_80px_rgba(15,23,42,0.15)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eef0f3] bg-white px-8 py-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">政策检索意见反馈</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  className="rounded-lg p-2 transition-colors hover:bg-[#f3f4f6]"
                >
                  <X className="h-5 w-5 text-[#6b7280]" />
                </button>
              </div>

              <div className="space-y-8 px-8 py-6">
                {/* 问题1: 检索结果质量 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">本次检索结果的相关性如何？</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">请评价检索到的政策与您的搜索意图的匹配程度</p>
                    </div>
                  </div>
                  <div className="ml-8 flex flex-wrap gap-3">
                    {["非常相关", "比较相关", "一般相关", "不太相关", "完全不相关"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="rounded-full border border-[#d8dbe2] px-4 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 问题2: 筛选功能评价 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">筛选条件是否满足您的需求？</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">包括政策层级、政策主题、产业类型等筛选维度</p>
                    </div>
                  </div>
                  <div className="ml-8 flex flex-wrap gap-3">
                    {["完全满足", "基本满足", "部分满足", "不太满足", "完全不满足"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="rounded-full border border-[#d8dbe2] px-4 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 问题3: 功能改进建议 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">3</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">检索功能还需要哪些改进？</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">可多选，帮助我们了解您的具体需求</p>
                    </div>
                  </div>
                  <div className="ml-8 flex flex-wrap gap-3">
                    {[
                      "增加更多筛选条件",
                      "提高检索速度",
                      "优化结果排序",
                      "增强关键词匹配",
                      "添加智能推荐",
                      "改进界面布局",
                    ].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="rounded-full border border-[#d8dbe2] px-4 py-2 text-sm transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 问题4: 详细意见 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">4</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">其他意见和建议</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">请详细描述您遇到的问题或改进建议（选填）</p>
                    </div>
                  </div>
                  <div className="ml-8">
                    <textarea
                      placeholder="请输入您的意见和建议，我们会认真阅读并持续改进..."
                      className="w-full rounded-xl border border-[#d8dbe2] p-4 text-sm text-foreground outline-none transition-colors placeholder:text-[#b0b4be] focus:border-primary focus:ring-2 focus:ring-primary/20"
                      rows={6}
                    />
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-[#eef0f3] bg-white px-8 py-6">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedback(false)}
                  className="h-12 rounded-xl border-[#d8dbe2] px-8 text-base"
                >
                  取消
                </Button>
                <Button
                  onClick={() => {
                    setShowFeedback(false);
                    // 这里可以添加提交反馈的逻辑
                  }}
                  className="h-12 rounded-xl bg-primary px-8 text-base font-semibold hover:bg-primary/90"
                >
                  提交反馈
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
