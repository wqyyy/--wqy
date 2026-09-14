window.POLICY_DATA = {
  "companies": [
    {
      "id": "beijing-benz",
      "name": "北京奔驰汽车有限公司",
      "rawTags": [
        "注册资本：1000万元",
        "企业性质：有限责任公司",
        "上市情况：上市企业",
        "规上企业：规上企业",
        "四上企业：规模以上工业企业",
        "所属产业：新一代信息技术产业",
        "所属行业：人工智能",
        "行业特定资质：北京自动驾驶测试资质",
        "人才资质：青年拔尖人才",
        "资质称号：北京市企业技术中心",
        "资质称号：知识产权示范企业",
        "资质称号：科技型中小企业",
        "资质称号：（制造业）隐形冠军",
        "资质称号：国家级研发机构",
        "资质称号：博士后工作站",
        "重点清单：服务包企业（市级、区级）",
        "上年度第一季度研发费用：3000万元"
      ],
      "standardTags": [
        "企业",
        "上市企业",
        "规上企业",
        "四上企业",
        "大型企业",
        "制造业",
        "工业企业",
        "新一代信息技术产业",
        "高端汽车和新能源智能汽车产业",
        "人工智能产业",
        "自动驾驶产业",
        "人工智能",
        "智能网联",
        "注册资本",
        "企业技术中心",
        "科技型中小企业",
        "隐形冠军企业",
        "国家级研发机构",
        "重点企业",
        "上年度第一季度研发费用大于等于3000万"
      ],
      "facts": {
        "subjectType": "企业",
        "legalEntity": true,
        "creditGood": true,
        "registeredOrOperatesInZone": true,
        "actualOperationInYizhuang": true,
        "industry": "制造业",
        "industryDirections": [
          "新一代信息技术产业",
          "高端汽车和新能源智能汽车产业",
          "人工智能产业",
          "自动驾驶产业"
        ],
        "qualifications": [
          "企业技术中心",
          "科技型中小企业",
          "隐形冠军企业",
          "国家级研发机构",
          "北京自动驾驶测试资质",
          "青年拔尖人才",
          "知识产权示范企业",
          "博士后工作站",
          "服务包企业"
        ],
        "aboveScaleEnterprise": true,
        "enterpriseScale": "大型企业",
        "employeeCount": 10000,
        "taxPayment2024": 30,
        "publicReadingSpace": false,
        "drugResearchProduction": false,
        "hasQualifiedTalent": true,
        "hasModelApplication": null,
        "modelServiceAmount": null,
        "hasXrProject": null,
        "xrInvestmentAmount": null,
        "dataTechIpAchievement": null,
        "hasDataInfra": null,
        "dataInfraInvestmentAmount": null,
        "revenueLastYear": null,
        "rdExpenseGrowthRate": null,
        "rdExpenseQ1LastYear": 3000,
        "rdExpenseQ1GrowthRate": null
      }
    }
  ],
  "questionBank": [
    {
      "id": "registeredOrOperatesInZone",
      "field": "registeredOrOperatesInZone",
      "label": "是否注册或实际经营在经开区",
      "type": "boolean",
      "question": "请问贵企业是否注册在北京经济技术开发区，或主要生产研发活动在区内？"
    },
    {
      "id": "creditGood",
      "field": "creditGood",
      "label": "信用状况",
      "type": "boolean",
      "question": "请问贵企业近三年是否无重大行政处罚，且未被列入严重失信主体名单？"
    },
    {
      "id": "industry",
      "field": "industry",
      "label": "所属行业",
      "type": "single",
      "options": [
        "制造业",
        "建筑业",
        "金融业",
        "软件和信息技术服务业",
        "文化、体育和娱乐业",
        "科学研究和技术服务业"
      ],
      "question": "请问贵企业所属行业是以下哪一类？"
    },
    {
      "id": "industryDirections",
      "field": "industryDirections",
      "label": "所属产业",
      "type": "multi",
      "selectionMode": "single",
      "options": [
        "新一代信息技术产业",
        "生物医药和大健康产业",
        "高端汽车和新能源智能汽车产业",
        "机器人和智能制造产业",
        "人工智能产业",
        "自动驾驶产业",
        "无以上产业"
      ],
      "question": "请问贵公司主要属于哪个产业？"
    },
    {
      "id": "qualifications",
      "field": "qualifications",
      "label": "资质称号",
      "type": "multi",
      "options": [
        "企业技术中心",
        "科技型中小企业",
        "隐形冠军企业",
        "国家级研发机构",
        "无以上资质"
      ],
      "question": "请问贵企业已取得以下哪些资质称号？（可多选）"
    },
    {
      "id": "taxPayment2024",
      "field": "taxPayment2024",
      "label": "上年度纳税总额",
      "type": "number",
      "unit": "万元",
      "question": "请问贵企业上年度在经开区的纳税总额是多少万元？"
    },
    {
      "id": "employeeCount",
      "field": "employeeCount",
      "label": "员工总数",
      "type": "number",
      "unit": "人",
      "question": "请问贵企业目前员工总数是多少人？"
    },
    {
      "id": "hasQualifiedTalent",
      "field": "hasQualifiedTalent",
      "label": "是否拥有符合条件的领军人才",
      "type": "boolean",
      "question": "请问贵企业是否拥有符合事项要求的亦城领军人才？"
    },
    {
      "id": "drugResearchProduction",
      "field": "drugResearchProduction",
      "label": "是否从事创新药品研发生产",
      "type": "boolean",
      "question": "请问贵企业是否从事创新药品研发或生产？"
    },
    {
      "id": "publicReadingSpace",
      "field": "publicReadingSpace",
      "label": "是否运营公共阅读空间",
      "type": "boolean",
      "question": "请问贵企业是否在经开区运营符合条件的公共阅读空间？"
    },
    {
      "id": "revenueLastYear",
      "field": "revenueLastYear",
      "label": "上年度营业收入总额",
      "type": "number",
      "unit": "万元",
      "question": "请问贵企业上年度营业收入总额是多少万元？"
    },
    {
      "id": "hasModelApplication",
      "field": "hasModelApplication",
      "label": "是否已开展大模型应用",
      "type": "boolean",
      "question": "请问贵企业是否已通过私有化部署、云化部署、API 调用或大模型一体机等方式开展模型应用？"
    },
    {
      "id": "modelServiceAmount",
      "field": "modelServiceAmount",
      "label": "模型服务结算费用",
      "type": "number",
      "unit": "万元",
      "question": "请问贵企业在 2025 年 8 月 9 日至 2026 年 6 月 30 日期间，实际发生并使用的模型服务结算费用是多少万元？"
    },
    {
      "id": "hasXrProject",
      "field": "hasXrProject",
      "label": "是否有 XR 应用示范项目",
      "type": "boolean",
      "question": "请问贵企业是否已有实际落地并稳定运行的 XR 应用示范项目？"
    },
    {
      "id": "xrInvestmentAmount",
      "field": "xrInvestmentAmount",
      "label": "XR 项目实际投资额",
      "type": "number",
      "unit": "万元",
      "question": "请问该 XR 应用示范项目的实际投资额是多少万元？"
    },
    {
      "id": "dataTechIpAchievement",
      "field": "dataTechIpAchievement",
      "label": "数据核心技术知识产权成果",
      "type": "boolean",
      "question": "请问贵企业是否已作为第一权利人取得数据领域核心技术相关专利、软著等知识产权成果？"
    },
    {
      "id": "hasDataInfra",
      "field": "hasDataInfra",
      "label": "是否运营数据流通基础设施",
      "type": "boolean",
      "question": "请问贵企业是否已在经开区建设并常态化运营数据流通基础设施？"
    },
    {
      "id": "dataInfraInvestmentAmount",
      "field": "dataInfraInvestmentAmount",
      "label": "数据基础设施固定资产投资",
      "type": "number",
      "unit": "万元",
      "question": "请问贵企业数据流通基础设施项目已完成的固定资产投资金额是多少万元？"
    },
    {
      "id": "rdExpenseGrowthRate",
      "field": "rdExpenseGrowthRate",
      "label": "上年度研发费用同比增速",
      "type": "number",
      "unit": "%",
      "question": "请问贵企业上年度研发费用同比增速是多少？"
    },
    {
      "id": "aboveScaleEnterprise",
      "field": "aboveScaleEnterprise",
      "label": "规上企业",
      "type": "boolean",
      "question": "请问贵企业是否为规上企业？"
    },
    {
      "id": "rdExpenseQ1LastYear",
      "field": "rdExpenseQ1LastYear",
      "label": "上年度第一季度研发费用",
      "type": "number",
      "unit": "万元",
      "question": "请问贵企业上年度第一季度研发费用是多少万元？"
    },
    {
      "id": "rdExpenseQ1GrowthRate",
      "field": "rdExpenseQ1GrowthRate",
      "label": "上年度第一季度研发费用增速",
      "type": "number",
      "unit": "%",
      "question": "请问贵企业上年度第一季度研发费用同比增速是多少？"
    }
  ],
  "policies": [
    {
      "id": "clause-work-residence-permit",
      "kind": "plannedClause",
      "name": "北京市工作居住证",
      "sourcePolicy": "北京经济技术开发区《北京市工作居住证（国内外埠人才）》新办指标需求申报实施细则（试行）",
      "deadline": "2030-12-31",
      "validPeriod": "2021-06-09 至 2030-12-31",
      "department": "组织人事部",
      "estimatedAmount": "0-0",
      "sourceUrl": "#",
      "requiredTags": [
        "注册在经开区",
        "纳税在经开区",
        "工作居住证"
      ],
      "conditions": [
        {
          "field": "legalEntity",
          "label": "企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "注册在经开区",
          "type": "boolean",
          "operator": "equals",
          "value": true
        },
        {
          "field": "taxPayment2024",
          "label": "上年度纳税总额",
          "type": "number",
          "operator": "gte",
          "value": 20
        },
        {
          "field": "industryDirections",
          "label": "新一代信息技术产业",
          "type": "multi",
          "operator": "includesAny",
          "value": [
            "新一代信息技术产业",
            "生物医药和大健康产业",
            "高端汽车和新能源智能汽车产业",
            "机器人和智能制造产业"
          ],
          "displayLabels": [
            "新一代信息技术产业",
            "生物医药和大健康产业",
            "高端汽车和新能源智能汽车产业",
            "机器人和智能制造产业"
          ]
        },
        {
          "field": "creditGood",
          "label": "近三年无重大处罚且信用记录良好",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        }
      ],
      "clauseContent": "第二条 申报条件。符合经开区城市功能定位和经济发展方向及产业规划要求，具有法人资格的企事业单位、民办非企业单位、社会团体、外国（地区）、外埠在京设立的非法人分支机构，原则上应在经开区登记注册并缴纳税费满1年。其中，具有法人资格的企业，在本区上一自然年度纳税额原则上不低于20万元。非企业单位，但具有营利性质的其他单位参照本条执行。重点支持电子信息、生物医药和大健康、新能源智能汽车、智能制造等四大主导产业内单位，教育、医疗、疾病及其他社会公共服务领域内单位，以及其他《通知》中明确的重点支持单位。",
      "historyItems": [
        {
          "name": "2025年《北京市工作居住证》新办指标需求申报",
          "sourcePolicy": "2025年《北京市工作居住证》新办指标需求申报",
          "deadline": "2025-03-18",
          "validPeriod": "2025-02-18 至 2025-03-18",
          "department": "组织人事部",
          "estimatedAmount": "0-0",
          "sourceUrl": "#",
          "conditions": [
            {
              "field": "taxPayment2024",
              "label": "上年度纳税总额",
              "type": "number",
              "operator": "gte",
              "value": 20
            }
          ],
          "requiredTags": []
        }
      ],
      "evidence": "本条款为计划兑现类内容，尚未进入本年度申报期；历史申报事项用于辅助判断企业潜在适配度。"
    },
    {
      "id": "1517219883381252096",
      "themeTypeId": "1517216988954976256",
      "name": "2026年上半年人工智能“模型券”",
      "sourcePolicy": "2026年上半年人工智能“模型券”专项奖励",
      "deadline": "2026-07-17",
      "estimatedAmount": "最高500万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1517216988954976256",
      "requiredTags": [
        "人工智能产业",
        "人工智能",
        "制造业",
        "购买算力服务金额"
      ],
      "conditions": [
        {
          "field": "legalEntity",
          "label": "企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "实际生产研发活动在区内",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "creditGood",
          "label": "近三年无重大处罚且非严重失信主体",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "industryDirections",
          "label": "人工智能产业",
          "type": "multi",
          "operator": "includesAny",
          "value": [
            "人工智能产业",
            "新一代信息技术产业"
          ],
          "displayLabels": [
            "人工智能产业",
            "新一代信息技术产业"
          ]
        },
        {
          "field": "hasModelApplication",
          "label": "已开展模型应用",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "questionId": "hasModelApplication",
          "display": false
        },
        {
          "field": "modelServiceAmount",
          "label": "购买算力服务金额",
          "type": "number",
          "operator": "gte",
          "value": 1,
          "questionId": "modelServiceAmount"
        }
      ],
      "evidence": "申报主体围绕“人工智能+”政务、医疗、教育、文旅、制造、金融、交通等领域开展模型应用；按模型服务结算费用最高50%补贴，单一主体每年累计不超过500万元。"
    },
    {
      "id": "1509149667189555200",
      "themeTypeId": "1509144369028628480",
      "name": "2026年“XR应用示范项目”专项奖励",
      "sourcePolicy": "2026年“XR应用示范项目”专项奖励",
      "deadline": "2026-07-10",
      "estimatedAmount": "最高500万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1509144369028628480",
      "requiredTags": [
        "制造业",
        "工业企业",
        "新一代信息技术产业"
      ],
      "conditions": [
        {
          "field": "legalEntity",
          "label": "企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "实际生产研发活动在区内",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "creditGood",
          "label": "近三年无重大处罚且非严重失信主体",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "industry",
          "label": "制造业",
          "type": "single",
          "operator": "oneOf",
          "value": [
            "制造业",
            "交通运输、仓储和邮政业",
            "文化、体育和娱乐业"
          ]
        },
        {
          "field": "hasXrProject",
          "label": "已有落地稳定运行的XR应用项目",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "questionId": "hasXrProject",
          "display": false
        },
        {
          "field": "xrInvestmentAmount",
          "label": "当年度固定资产投资总额",
          "type": "number",
          "operator": "gte",
          "value": 1,
          "questionId": "xrInvestmentAmount"
        }
      ],
      "evidence": "申报主体应在工业制造、仓储物流等重点领域有实际落地并稳定运行的 XR 解决方案，项目按实际投资额50%、最高500万元奖励。"
    },
    {
      "id": "1522283323559825408",
      "themeTypeId": "1522282365362688000",
      "name": "2026年数据领域核心技术攻关补贴",
      "sourcePolicy": "2026年数据领域核心技术攻关补贴",
      "deadline": "2026-08-14",
      "estimatedAmount": "最高500万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1522282365362688000",
      "requiredTags": [
        "新一代信息技术产业",
        "数字经济产业",
        "软件和信息技术服务业"
      ],
      "conditions": [
        {
          "field": "legalEntity",
          "label": "企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "实际生产研发活动在区内",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "creditGood",
          "label": "近三年无重大处罚且非严重失信主体",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "industryDirections",
          "label": "新一代信息技术产业",
          "type": "multi",
          "operator": "includesAny",
          "value": [
            "新一代信息技术产业",
            "数字经济产业",
            "人工智能产业"
          ],
          "displayLabels": [
            "新一代信息技术产业",
            "数字经济产业",
            "人工智能产业"
          ]
        },
        {
          "field": "dataTechIpAchievement",
          "label": "取得数据核心技术相关知识产权成果",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "questionId": "dataTechIpAchievement",
          "display": false
        }
      ],
      "evidence": "面向数据传输计算、汇聚融合、流通交换、开发利用和安全保障等技术领域，要求取得专利、软著等知识产权成果，单个创新主体年度奖补不超过500万元。"
    },
    {
      "id": "1523722998155063296",
      "themeTypeId": "1523721980054876160",
      "name": "2026年亦城人才·人工智能超级个体（OPC）认定",
      "sourcePolicy": "“人才十条”2.0+政策兑现工作通知",
      "deadline": "2026-08-10",
      "estimatedAmount": "最高50万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1523721980054876160",
      "requiredTags": [
        "人工智能产业",
        "人工智能",
        "亦城领军人才",
        "优秀人才",
        "小微企业"
      ],
      "conditions": [
        {
          "field": "registeredOrOperatesInZone",
          "label": "注册在经开区",
          "type": "boolean",
          "operator": "equals",
          "value": true
        },
        {
          "field": "creditGood",
          "label": "信用记录良好",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "employeeCount",
          "label": "小微企业",
          "type": "number",
          "operator": "lte",
          "value": 10
        },
        {
          "field": "industryDirections",
          "label": "人工智能产业",
          "type": "multi",
          "operator": "includesAny",
          "value": [
            "人工智能产业"
          ]
        }
      ],
      "evidence": "超级个体团队员工总数不超过10人，申报人及团队应在人工智能及相关领域具备专业能力、技术水平和商业化潜力。"
    },
    {
      "id": "1510970415258013696",
      "themeTypeId": "1510964201446969344",
      "name": "2026年数据流通基础设施运营补贴",
      "sourcePolicy": "2026年数据流通基础设施运营补贴",
      "deadline": "2026-07-29",
      "estimatedAmount": "最高2000万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1510964201446969344",
      "requiredTags": [
        "数字经济产业",
        "固定投资奖励",
        "当年度固定资产投资总额",
        "生产性服务业"
      ],
      "conditions": [
        {
          "field": "legalEntity",
          "label": "企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "实际生产研发活动在区内",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "creditGood",
          "label": "近三年无重大处罚且非严重失信主体",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "hasDataInfra",
          "label": "已建设并常态化运营数据流通基础设施",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "questionId": "hasDataInfra",
          "display": false
        },
        {
          "field": "dataInfraInvestmentAmount",
          "label": "当年度固定资产投资总额",
          "type": "number",
          "operator": "gte",
          "value": 1,
          "questionId": "dataInfraInvestmentAmount"
        }
      ],
      "evidence": "要求建设并常态化运营数据流通基础设施，对固定资产投资按20%补贴，单一年度最高不超过2000万元。"
    },
    {
      "id": "1518562813555597312",
      "themeTypeId": "1518557642431750144",
      "name": "2025年度创新药品研发奖励",
      "sourcePolicy": "2025年度创新药品研发奖励",
      "deadline": "2026-07-17",
      "estimatedAmount": "最高1亿元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1518557642431750144",
      "requiredTags": [
        "生物医药和大健康产业",
        "研发投入奖励",
        "国家级研发机构",
        "高新技术企业"
      ],
      "conditions": [
        {
          "field": "legalEntity",
          "label": "企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "实际生产研发活动在区内",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "creditGood",
          "label": "近三年无重大处罚且非严重失信主体",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        },
        {
          "field": "industryDirections",
          "label": "生物医药和大健康产业",
          "type": "multi",
          "operator": "includesAny",
          "value": [
            "生物医药和大健康产业"
          ]
        },
        {
          "field": "drugResearchProduction",
          "label": "从事创新药品研发生产",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "display": false
        }
      ],
      "evidence": "申报企业应从事药品研发生产，一类/二类创新药按临床阶段、上市申请或注册证书给予奖励，每家企业每年合计不超过1亿元。"
    },
    {
      "id": "1516851188230393856",
      "themeTypeId": "1516491831705735168",
      "name": "2026年公共阅读空间运营奖励",
      "sourcePolicy": "2026年公共阅读空间发展奖励",
      "deadline": "2026-08-04",
      "estimatedAmount": "2-5万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1516491831705735168",
      "requiredTags": [
        "公共阅读空间",
        "文化、体育和娱乐业",
        "公共阅读空间运营"
      ],
      "conditions": [
        {
          "field": "publicReadingSpace",
          "label": "公共阅读空间运营",
          "type": "boolean",
          "operator": "equals",
          "value": true
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "公共阅读空间",
          "type": "boolean",
          "operator": "equals",
          "value": true
        }
      ],
      "evidence": "面向运营满1年以上、通过公共阅读空间考评且满足面积、开放时间、出版物数量、活动次数等要求的公共阅读空间。"
    },
    {
      "id": "1516867241629798400",
      "themeTypeId": "1516491831705735168",
      "name": "2026年公共阅读空间延时奖励",
      "sourcePolicy": "2026年公共阅读空间发展奖励",
      "deadline": "2026-08-04",
      "estimatedAmount": "5万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1516491831705735168&id=1516867241629798400",
      "requiredTags": [
        "公共阅读空间",
        "文化、体育和娱乐业",
        "公共阅读空间运营"
      ],
      "conditions": [
        {
          "field": "publicReadingSpace",
          "label": "公共阅读空间运营",
          "type": "boolean",
          "operator": "equals",
          "value": true
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "公共阅读空间",
          "type": "boolean",
          "operator": "equals",
          "value": true
        }
      ],
      "evidence": "对申报年度内工作日每天连续开放9小时以上、每周经营80小时以上的公共阅读空间给予5万元延时奖励。"
    },
    {
      "id": "1517121129307267072",
      "themeTypeId": "1516491831705735168",
      "name": "2026年公共阅读空间特色服务奖励",
      "sourcePolicy": "2026年公共阅读空间发展奖励",
      "deadline": "2026-08-04",
      "estimatedAmount": "5万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1516491831705735168&id=1517121129307267072",
      "requiredTags": [
        "公共阅读空间",
        "文化、体育和娱乐业",
        "公共阅读空间运营"
      ],
      "conditions": [
        {
          "field": "publicReadingSpace",
          "label": "公共阅读空间运营",
          "type": "boolean",
          "operator": "equals",
          "value": true
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "公共阅读空间",
          "type": "boolean",
          "operator": "equals",
          "value": true
        }
      ],
      "evidence": "对开办在企业、园区、社区、商超周边等地，并具有垂直细分或融合服务特色的公共阅读空间给予5万元特色服务奖励。"
    },
    {
      "id": "1517112922182606848",
      "themeTypeId": "1516491831705735168",
      "name": "2026年公共阅读空间活动组织奖励",
      "sourcePolicy": "2026年公共阅读空间发展奖励",
      "deadline": "2026-08-04",
      "estimatedAmount": "5万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1516491831705735168&id=1517112922182606848",
      "requiredTags": [
        "公共阅读空间",
        "文化、体育和娱乐业",
        "公共阅读空间运营"
      ],
      "conditions": [
        {
          "field": "publicReadingSpace",
          "label": "公共阅读空间运营",
          "type": "boolean",
          "operator": "equals",
          "value": true
        },
        {
          "field": "registeredOrOperatesInZone",
          "label": "公共阅读空间",
          "type": "boolean",
          "operator": "equals",
          "value": true
        }
      ],
      "evidence": "对作为主办方在经开区范围内每年度组织开展全民阅读活动24场以上的公共阅读空间给予5万元活动奖励。"
    },
    {
      "id": "1361663723105447936",
      "themeTypeId": "1361663723105447936",
      "name": "2026年一季度研发费用增长奖励",
      "sourcePolicy": "2026年一季度研发费用增长奖励",
      "deadline": "2026-04-27",
      "estimatedAmount": "最高200万元",
      "sourceUrl": "https://zcdx.kfqgw.beijing.gov.cn/#/themeTypeDetail?themeTypeId=1361663723105447936",
      "requiredTags": [
        "规上企业",
        "上年度第一季度研发费用大于等于3000万",
        "上年度第一季度研发费用增速大于等于8%"
      ],
      "conditions": [
        {
          "field": "aboveScaleEnterprise",
          "label": "规上企业",
          "type": "boolean",
          "operator": "equals",
          "value": true,
          "questionId": "aboveScaleEnterprise"
        },
        {
          "field": "rdExpenseQ1LastYear",
          "label": "上年度第一季度研发费用大于等于3000万",
          "type": "number",
          "operator": "gte",
          "value": 3000,
          "questionId": "rdExpenseQ1LastYear"
        },
        {
          "field": "rdExpenseQ1GrowthRate",
          "label": "上年度第一季度研发费用增速大于等于8%",
          "type": "number",
          "operator": "gte",
          "value": 8,
          "questionId": "rdExpenseQ1GrowthRate"
        }
      ],
      "evidence": "对规上企业上年度第一季度研发费用达到3000万元、同比增速达到8%的，按研发费用增量的1%给予支持，最高不超过200万元。"
    }
  ]
};
