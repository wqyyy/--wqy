const entryScreen = document.querySelector("#entryScreen");
const resultsScreen = document.querySelector("#resultsScreen");
const policyCalculatorActions = document.querySelectorAll(".policy-calculator-action");
const backButton = document.querySelector("#backButton");
const chatArea = document.querySelector(".chat-area");
const policyList = document.querySelector(".policy-list");
const questionPanel = document.querySelector("#questionPanel");
const answerSummary = document.querySelector("#answerSummary");
const highMatchCount = document.querySelector("#highMatchCount");
const highMatchAmount = document.querySelector("#highMatchAmount");
const composerInput = document.querySelector("#resultsScreen .input-row input");
const sendButton = document.querySelector("#resultsScreen .send-button");
const rdFundingModal = document.querySelector("#rdFundingModal");
const rdFundingCurrentInput = document.querySelector("#rdExpenseCurrent");
const rdFundingPreviousInput = document.querySelector("#rdExpensePrevious");
const rdFundingResult = document.querySelector("#rdFundingResult");
const rdFundingSubmit = document.querySelector("#rdFundingSubmit");
const rdFundingClose = document.querySelector(".funding-modal-close");

const baseCompany = window.POLICY_DATA.companies.find((item) => item.id === "beijing-benz");
const appState = {
  company: structuredClone(baseCompany),
  evaluatedPolicies: [],
  answerHistory: [],
  skippedQuestionIds: new Set(),
  autoQuestionIds: new Set(),
  calculatedFundingAmounts: new Map(),
  activeQuestionId: null,
  currentQuestionId: null
};

const supplementalFields = {
  industry: "所属行业",
  industryDirections: "所属产业",
  qualifications: "资质称号",
  aboveScaleEnterprise: "规上企业",
  enterpriseScale: "企业规模",
  employeeCount: "员工总数",
  taxPayment2024: "上年度纳税总额",
  registeredOrOperatesInZone: "是否注册或实际经营在经开区",
  creditGood: "信用状况",
  hasModelApplication: "是否已开展大模型应用",
  modelServiceAmount: "模型服务结算费用",
  hasXrProject: "是否有 XR 应用示范项目",
  xrInvestmentAmount: "XR 项目实际投资额",
  dataTechIpAchievement: "数据核心技术知识产权成果",
  hasDataInfra: "是否运营数据流通基础设施",
  dataInfraInvestmentAmount: "数据基础设施固定资产投资",
  hasQualifiedTalent: "是否拥有符合条件的领军人才",
  drugResearchProduction: "是否从事创新药品研发生产",
  publicReadingSpace: "是否运营公共阅读空间",
  rdExpenseGrowthRate: "上年度研发费用同比增速",
  rdExpenseQ1LastYear: "上年度第一季度研发费用",
  rdExpenseQ1GrowthRate: "上年度第一季度研发费用增速",
  revenueLastYear: "上年度营业收入总额"
};

const batchNumberRules = [
  {
    field: "revenueLastYear",
    aliases: ["上年度营业收入", "去年营业收入", "营业收入", "营收", "年度收入"],
    unit: "万元"
  },
  {
    field: "taxPayment2024",
    aliases: ["上年度纳税总额", "纳税总额", "纳税额", "纳税"],
    unit: "万元"
  },
  {
    field: "employeeCount",
    aliases: ["员工总数", "员工人数", "员工", "职工人数", "职工", "从业人员"],
    unit: "人"
  },
  {
    field: "rdExpenseGrowthRate",
    aliases: ["上年度研发费用同比增速", "研发费用同比增速", "研发投入同比增速", "研发费用增速", "研发投入增速"],
    unit: "%",
    skipWhen: /(?:第一季度|一季度)/
  },
  {
    field: "rdExpenseQ1LastYear",
    aliases: ["上年度第一季度研发费用", "上年一季度研发费用", "第一季度研发费用"],
    unit: "万元",
    disallowContext: /(?:同比)?(?:增速|增长)/
  },
  {
    field: "rdExpenseQ1GrowthRate",
    aliases: ["上年度第一季度研发费用增速", "上年一季度研发费用增速", "第一季度研发费用增速", "第一季度研发费用同比增速"],
    unit: "%"
  },
  {
    field: "modelServiceAmount",
    aliases: ["模型服务结算费用", "模型服务费", "模型服务费用"],
    unit: "万元"
  },
  {
    field: "xrInvestmentAmount",
    aliases: ["XR项目实际投资额", "XR项目投资额", "XR应用示范项目投资", "XR投资额"],
    unit: "万元"
  },
  {
    field: "dataInfraInvestmentAmount",
    aliases: ["数据基础设施固定资产投资", "数据流通基础设施投资", "数据基础设施投资", "固定资产投资"],
    unit: "万元"
  }
];

const supplementalBooleanRules = [
  {
    field: "aboveScaleEnterprise",
    positive: /(?:是|为|属于).{0,6}(?:规上企业|规模以上企业)|(?:规上企业|规模以上企业)/,
    negative: /(?:非|不是|不属于|未达到).{0,6}(?:规上企业|规模以上企业)/
  },
  {
    field: "registeredOrOperatesInZone",
    positive: /(?:注册|经营|生产|研发)(?:地|活动)?(?:位于|在)经开区/,
    negative: /(?:未|不在|没有).{0,8}(?:注册|经营|生产|研发).{0,8}经开区/
  },
  {
    field: "creditGood",
    positive: /(?:无重大处罚|未被列入严重失信|信用记录良好)/,
    negative: /(?:有重大处罚|列入严重失信|信用记录不良)/
  },
  {
    field: "hasModelApplication",
    positive: /(?:已|正在|有).{0,8}(?:大模型|模型应用)/,
    negative: /(?:未|没有|无).{0,8}(?:大模型|模型应用)/
  },
  {
    field: "hasXrProject",
    positive: /(?:已|正在|有).{0,8}(?:XR|xr).{0,8}(?:项目|应用)/,
    negative: /(?:未|没有|无).{0,8}(?:XR|xr).{0,8}(?:项目|应用)/
  },
  {
    field: "dataTechIpAchievement",
    positive: /(?:已|有|取得).{0,10}(?:数据领域|数据核心技术).{0,10}(?:知识产权|专利|软著)/,
    negative: /(?:未|没有|无).{0,10}(?:数据领域|数据核心技术).{0,10}(?:知识产权|专利|软著)/
  },
  {
    field: "hasDataInfra",
    positive: /(?:已|正在|有).{0,10}(?:建设|运营).{0,10}数据流通基础设施/,
    negative: /(?:未|没有|无).{0,10}(?:建设|运营).{0,10}数据流通基础设施/
  },
  {
    field: "hasQualifiedTalent",
    positive: /(?:已|有|拥有).{0,8}(?:亦城领军人才|领军人才)/,
    negative: /(?:未|没有|无).{0,8}(?:亦城领军人才|领军人才)/
  },
  {
    field: "drugResearchProduction",
    positive: /(?:从事|开展).{0,8}创新药品.{0,8}(?:研发|生产)/,
    negative: /(?:未|不|没有).{0,8}(?:从事|开展).{0,8}创新药品/
  },
  {
    field: "publicReadingSpace",
    positive: /(?:已|正在|有).{0,8}(?:运营|建设).{0,8}公共阅读空间/,
    negative: /(?:未|没有|无).{0,8}(?:运营|建设).{0,8}公共阅读空间/
  }
];

function showScreen(screenName) {
  const isResults = screenName === "results";
  entryScreen.classList.toggle("is-active", !isResults);
  resultsScreen.classList.toggle("is-active", isResults);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseAmount(value) {
  const text = String(value ?? "");
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const maxNumber = Math.max(0, ...numbers);
  if (text.includes("亿元")) return maxNumber * 10000;
  return maxNumber;
}

function formatSubsidyAmount(amountInWan) {
  if (amountInWan >= 10000) {
    const amountInYi = amountInWan / 10000;
    return `${Number.isInteger(amountInYi) ? amountInYi : amountInYi.toFixed(2)}亿元`;
  }

  return `${Number.isInteger(amountInWan) ? amountInWan : amountInWan.toFixed(2)}万元`;
}

function parseSupportAmountRange(value) {
  const text = String(value ?? "");
  const max = parseAmount(text);
  const isRange = /(?:最高|[-至])/u.test(text);
  return isRange ? { min: 0, max } : { min: max, max };
}

function getPolicySupportAmountRange(policy) {
  if (appState.calculatedFundingAmounts.has(policy.id)) {
    const amount = appState.calculatedFundingAmounts.get(policy.id);
    return { min: amount, max: amount };
  }
  return parseSupportAmountRange(policy.estimatedAmount);
}

function formatSupportAmountRange({ min, max }) {
  if (min === max) return formatSubsidyAmount(max);
  if (max < 10000) {
    const formatNumber = (amount) => Number.isInteger(amount) ? amount : amount.toFixed(1);
    return `${formatNumber(min)}-${formatNumber(max)}万元`;
  }
  if (min === 0) return `0-${formatSubsidyAmount(max)}`;
  return `${formatSubsidyAmount(min)}-${formatSubsidyAmount(max)}`;
}

function getPolicySupportAmountText(policy) {
  return formatSupportAmountRange(getPolicySupportAmountRange(policy));
}

function getTotalSupportAmountRange(policies) {
  return policies.reduce((total, policy) => {
    const amount = getPolicySupportAmountRange(policy);
    return { min: total.min + amount.min, max: total.max + amount.max };
  }, { min: 0, max: 0 });
}

function getMatchLevel(score) {
  if (score >= 0.5) return "高契合";
  if (score >= 0.3) return "中高契合";
  return "待补充";
}

function isUnknown(value) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function evaluateCondition(facts, condition) {
  const actual = facts[condition.field];
  if (isUnknown(actual)) {
    return { ...condition, status: "unknown" };
  }

  let satisfied = false;
  if (condition.operator === "equals") satisfied = actual === condition.value;
  if (condition.operator === "notEquals") satisfied = actual !== condition.value;
  if (condition.operator === "gte") satisfied = Number(actual) >= Number(condition.value);
  if (condition.operator === "lte") satisfied = Number(actual) <= Number(condition.value);
  if (condition.operator === "gt") satisfied = Number(actual) > Number(condition.value);
  if (condition.operator === "lt") satisfied = Number(actual) < Number(condition.value);
  if (condition.operator === "between") {
    const [min, max] = condition.value;
    satisfied = Number(actual) >= Number(min) && Number(actual) <= Number(max);
  }
  if (condition.operator === "oneOf") satisfied = condition.value.includes(actual);
  if (condition.operator === "includesAny") {
    const actualValues = Array.isArray(actual) ? actual : [actual];
    satisfied = condition.value.some((item) => actualValues.includes(item));
  }
  if (condition.operator === "includesAll") {
    const actualValues = Array.isArray(actual) ? actual : [actual];
    satisfied = condition.value.every((item) => actualValues.includes(item));
  }

  return { ...condition, status: satisfied ? "matched" : "conflict", actual };
}

function isScoringCondition(condition) {
  if (condition.score === false) return false;

  // 企业主体、信用和“实际生产研发在区内”是通用准入条件：用于排除冲突，不用于拉高契合分。
  if (["legalEntity", "creditGood"].includes(condition.field)) return false;
  return !(condition.field === "registeredOrOperatesInZone" && condition.display === false);
}

function evaluatePolicy(policy, company) {
  const conditions = policy.conditions ?? [];
  const evaluatedConditions = conditions.map((condition) => evaluateCondition(company.facts, condition));
  const matchedConditions = evaluatedConditions.filter((item) => item.status === "matched");
  const unknownConditions = evaluatedConditions.filter((item) => item.status === "unknown");
  const conflictConditions = evaluatedConditions.filter((item) => item.status === "conflict");
  const scoringConditions = evaluatedConditions.filter(isScoringCondition);
  const matchedScoringConditions = scoringConditions.filter((item) => item.status === "matched");
  const score = scoringConditions.length ? matchedScoringConditions.length / scoringConditions.length : 0;

  return {
    ...policy,
    evaluatedConditions,
    matchedConditions,
    unknownConditions,
    conflictConditions,
    matchedTags: matchedConditions.map((item) => item.label),
    scoringConditions,
    matchedScoringConditions,
    score,
    level: getMatchLevel(score),
    hasConflict: conflictConditions.length > 0
  };
}

function matchPolicies(company) {
  return window.POLICY_DATA.policies
    .map((policy) => evaluatePolicy(policy, company))
    .filter((policy) => !policy.hasConflict)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return parseAmount(b.estimatedAmount) - parseAmount(a.estimatedAmount);
    });
}

function getQuestionById(id) {
  return window.POLICY_DATA.questionBank.find((item) => item.id === id);
}

function getQuestionForCondition(condition) {
  return getQuestionById(condition.questionId ?? condition.field);
}

function getNextQuestion(policies) {
  if (appState.activeQuestionId) return getQuestionById(appState.activeQuestionId);

  // 第三题固定引导企业确认所属产业，便于通过多选补齐产业标签。
  if (appState.autoQuestionIds.size === 2) {
    return getQuestionById("industryDirections");
  }

  if (appState.autoQuestionIds.size >= 3) return null;

  const collectGroups = (scoringOnly) => {
    const groups = new Map();
    for (const policy of policies) {
      for (const condition of policy.unknownConditions) {
        // display:false 代表未纳入标签表的条件，只用于内部匹配，不对用户发起补充提问。
        if (condition.display === false) continue;
        if (scoringOnly && !isScoringCondition(condition)) continue;
        const question = getQuestionForCondition(condition);
        if (!question || appState.skippedQuestionIds.has(question.id)) continue;
        if (!groups.has(question.id)) {
          groups.set(question.id, { questionId: question.id, frequency: 0, maxAmount: 0 });
        }
        const group = groups.get(question.id);
        group.frequency += 1;
        group.maxAmount = Math.max(group.maxAmount, parseAmount(policy.estimatedAmount));
      }
    }
    return groups;
  };

  // 仅从标签表内的待补充条件选题；先问会改变契合度的关键条件。
  const groups = collectGroups(true);
  const candidates = groups.size ? groups : collectGroups(false);

  const [top] = [...candidates.values()].sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return b.maxAmount - a.maxAmount;
  });

  return top ? getQuestionById(top.questionId) : null;
}

function renderConditionTags(conditions) {
  return getDisplayTagEntries(conditions)
    .map((tag) => {
      const config = {
        matched: ["✅", "is-matched"],
        unknown: ["❌", "is-missing"],
        conflict: ["⚠️", "is-conflict"]
      }[tag.status];

      return `
        <span class="detail-tag ${config[1]}">
          <span class="tag-state">${config[0]}</span>
          ${escapeHtml(tag.label)}
        </span>
      `;
    })
    .join("");
}

function getDisplayTagEntries(conditions) {
  return conditions
    .filter((condition) => condition.display !== false)
    .flatMap((condition) => {
      const labels = condition.displayLabels ?? [condition.label];
      if (condition.status === "matched" && ["includesAny", "oneOf"].includes(condition.operator)) {
        const actualValues = Array.isArray(condition.actual) ? condition.actual : [condition.actual];
        const matchedLabels = labels.filter((label) => actualValues.includes(label));
        return (matchedLabels.length ? matchedLabels : labels).map((label) => ({ label, status: condition.status }));
      }

      return labels.map((label) => ({ label, status: condition.status }));
    });
}

function getDisplayTagStats(conditions) {
  const tags = getDisplayTagEntries(conditions);
  return {
    total: tags.length,
    matched: tags.filter((tag) => tag.status === "matched").length
  };
}

function getVisibleMatchText(conditions) {
  const stats = getDisplayTagStats(conditions);
  return `满足条件 ${stats.matched}/${stats.total}`;
}

function getItemDetailUrl(item) {
  return item.itemUrl ?? item.sourceUrl ?? "#";
}

function getPolicyDetailUrl(item) {
  return item.policyUrl ?? item.sourceUrl ?? "#";
}

function renderDetailLink(text, url, className) {
  return `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}

function evaluateHistoryItem(historyItem) {
  const evaluatedConditions = (historyItem.conditions ?? []).map((condition) =>
    evaluateCondition(appState.company.facts, condition)
  );
  const matchedConditions = evaluatedConditions.filter((item) => item.status === "matched");
  const scoringConditions = evaluatedConditions.filter(isScoringCondition);
  const matchedScoringConditions = scoringConditions.filter((item) => item.status === "matched");
  const score = scoringConditions.length ? matchedScoringConditions.length / scoringConditions.length : 0;

  return {
    ...historyItem,
    evaluatedConditions,
    matchedConditions,
    scoringConditions,
    matchedScoringConditions,
    score,
    level: getMatchLevel(score)
  };
}

function renderHistoryPolicyCard(item) {
  const isHigh = item.score >= 0.5;
  const tags = renderConditionTags(item.evaluatedConditions);
  const historyMatchText = getVisibleMatchText(item.evaluatedConditions);

  return `
    <article class="history-policy-card">
      <div class="policy-main">
        <div class="title-row">
          <span class="match-level${isHigh ? "" : " medium"}">${escapeHtml(item.level)}</span>
          <h2>${renderDetailLink(item.name, getItemDetailUrl(item), "policy-title-link")}</h2>
        </div>
        <p class="policy-source">${renderDetailLink(item.sourcePolicy ?? item.name, getPolicyDetailUrl(item), "policy-source-link")}</p>
      </div>
      <div class="amount-box">
        <span>预计扶持金额</span>
        <strong>${escapeHtml(getPolicySupportAmountText(item))}</strong>
      </div>
      <div class="policy-meta">
        <span>申报有效期：${escapeHtml(item.validPeriod ?? item.deadline)}</span>
        <span class="match-count">${escapeHtml(historyMatchText)}</span>
        <button class="detail-toggle" type="button" aria-expanded="false" data-open-label="查看详情" data-close-label="收起详情">查看详情</button>
      </div>
      <div class="policy-detail" hidden>
        <div class="detail-tags history-tags">${tags}</div>
      </div>
    </article>
  `;
}

function renderPolicyCard(policy) {
  if (policy.kind === "plannedClause") return renderClauseCard(policy);

  const isHigh = policy.score >= 0.5;
  const visibleMatchText = getVisibleMatchText(policy.evaluatedConditions);
  const conditionTags = renderConditionTags(policy.evaluatedConditions);
  const fundingButton = policy.id === "1361663723105447936"
    ? `<button class="funding-calc-button" type="button" data-policy-id="${escapeHtml(policy.id)}">资金测算</button>`
    : "";

  return `
    <article class="policy-card${fundingButton ? " has-funding-calc" : ""}" data-policy-id="${escapeHtml(policy.id)}">
      <div class="policy-main">
        <div class="title-row">
          <span class="match-level${isHigh ? "" : " medium"}">${escapeHtml(policy.level)}</span>
          <h2>${renderDetailLink(policy.name, getItemDetailUrl(policy), "policy-title-link")}</h2>
        </div>
        <p class="policy-source">${renderDetailLink(policy.sourcePolicy, getPolicyDetailUrl(policy), "policy-source-link")}</p>
      </div>
      <div class="amount-box">
        <span>预计扶持金额</span>
        ${fundingButton}
        <strong>${escapeHtml(getPolicySupportAmountText(policy))}</strong>
      </div>
      <div class="policy-meta">
        <span>申报有效期：${escapeHtml(policy.deadline)}</span>
        <span class="match-count">${escapeHtml(visibleMatchText)}</span>
        <button class="detail-toggle" type="button" aria-expanded="false" data-open-label="查看详情" data-close-label="收起详情">查看详情</button>
      </div>
      <div class="policy-detail" hidden>
        <div class="detail-tags">${conditionTags}</div>
      </div>
    </article>
  `;
}

function renderClauseCard(policy) {
  const isHigh = policy.score >= 0.5;
  const historyItems = (policy.historyItems ?? []).map(evaluateHistoryItem);
  const historyHtml = historyItems.map(renderHistoryPolicyCard).join("");

  return `
    <article class="policy-card clause-card">
      <div class="policy-main">
        <div class="title-row">
          <span class="match-level${isHigh ? "" : " medium"}">${escapeHtml(policy.level)}</span>
          <h2>${renderDetailLink(policy.name, getItemDetailUrl(policy), "policy-title-link")}</h2>
        </div>
        <p class="policy-source clause-source">${renderDetailLink(policy.sourcePolicy, getPolicyDetailUrl(policy), "policy-source-link")}</p>
      </div>
      <div class="clause-plan-box">
        <span>本年计划兑现</span>
        <strong>敬请期待</strong>
      </div>
      <div class="policy-meta clause-meta">
        <span>条款有效期：${escapeHtml(policy.validPeriod)}</span>
        <button class="detail-toggle" type="button" aria-expanded="false" data-open-label="查看条款" data-close-label="收起条款">查看条款</button>
      </div>
      <div class="policy-detail clause-detail" hidden>
        <section class="clause-section">
          <div class="clause-section-title">
            <span>条款内容</span>
            <em>${escapeHtml(policy.department)}</em>
          </div>
          <p class="clause-text" title="${escapeHtml(policy.clauseContent)}">${escapeHtml(policy.clauseContent)}</p>
        </section>
        <section class="clause-section">
          <div class="clause-section-title">
            <span>历史申报事项</span>
            <em>${historyItems.length}条</em>
          </div>
          <div class="history-list">${historyHtml}</div>
        </section>
      </div>
    </article>
  `;
}

function getMatchChange(previousPolicies, policies) {
  const previousIds = new Set(previousPolicies.map((item) => item.id));
  const currentIds = new Set(policies.map((item) => item.id));
  const previousHighIds = new Set(previousPolicies.filter((item) => item.score >= 0.5).map((item) => item.id));
  const currentHighIds = new Set(policies.filter((item) => item.score >= 0.5).map((item) => item.id));

  return {
    addedHigh: [...currentHighIds].filter((id) => !previousHighIds.has(id)).length,
    removedPolicies: [...previousIds].filter((id) => !currentIds.has(id)).length
  };
}

function getAnswerSummaryHtml(policies, matchChange) {
  const displayMatches = getDisplayMatches(policies);
  const relevantCount = displayMatches.length;
  const items = appState.answerHistory
    .map((answer) => {
      const editButton = getQuestionById(answer.questionId)
        ? `<button class="edit-answer" type="button" data-question-id="${escapeHtml(answer.questionId)}">修改</button>`
        : "";
      return `
      <li>
        <span>${escapeHtml(answer.label)}：${escapeHtml(answer.displayValue)}</span>
        ${editButton}
      </li>
    `;
    })
    .join("");

  const changeText = matchChange && (matchChange.addedHigh || matchChange.removedPolicies)
    ? `<p class="match-change">${[
      matchChange.addedHigh ? `新增 ${matchChange.addedHigh} 条高契合事项` : "",
      matchChange.removedPolicies ? `已过滤 ${matchChange.removedPolicies} 条不符合事项` : ""
    ].filter(Boolean).join("，")}</p>`
    : "";

  return `
    <p>已识别到您补充的关键信息：</p>
    <ul>${items}</ul>
    ${changeText}
    ${getMatchResultLineHtml(displayMatches, relevantCount)}
  `;
}

function getMatchResultLineHtml(displayMatches, relevantCount = displayMatches.length) {
  const subsidyAmount = formatSupportAmountRange(getTotalSupportAmountRange(displayMatches));
  return `<p class="match-result-line">为您匹配到以下 <span>${relevantCount}</span> 条相关事项：可获得 <span>${escapeHtml(subsidyAmount)}</span> 补贴金额</p>`;
}

function renderAnswerSummary(policies) {
  if (!appState.answerHistory.length) {
    answerSummary.hidden = true;
    answerSummary.innerHTML = "";
    return;
  }

  answerSummary.hidden = false;
  answerSummary.innerHTML = getAnswerSummaryHtml(policies);
}

function getQuestionHtml(question) {
  if (!question) {
    composerInput.placeholder = "可补充更多企业信息";
    return `
      <p class="question-kicker">继续补充</p>
      <p class="question-followup">您可以补充更多企业信息，我们将为您提供更精准的事项匹配。</p>
    `;
  }

  let actions = "";
  if (question.type === "boolean") {
    actions = `
      <div class="question-actions">
        <button type="button" class="answer-option" data-question-id="${escapeHtml(question.id)}" data-value="true">是</button>
        <button type="button" class="answer-option" data-question-id="${escapeHtml(question.id)}" data-value="false">否</button>
      </div>
    `;
  }

  if (["single", "multi"].includes(question.type)) {
    const currentValue = appState.company.facts[question.field];
    const selectedValues = question.selectionMode === "single"
      ? [Array.isArray(currentValue) ? currentValue[0] : currentValue]
      : Array.isArray(currentValue) ? currentValue : [currentValue];
    const optionButtons = (question.options ?? [])
      .map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        const selected = selectedValues.includes(value);
        const choiceContent = question.type === "multi"
          ? `<span class="choice-check" aria-hidden="true"></span><span>${escapeHtml(label)}</span>`
          : escapeHtml(label);
        return `<button type="button" class="answer-option choice-option${selected ? " is-selected" : ""}" data-question-id="${escapeHtml(question.id)}" data-value="${escapeHtml(value)}" aria-pressed="${selected}">${choiceContent}</button>`;
      })
      .join("");
    const confirmButton = question.type === "multi"
      ? `<button type="button" class="confirm-options" data-question-id="${escapeHtml(question.id)}">提交</button>`
      : "";

    actions = question.type === "multi"
      ? `<div class="question-actions choice-actions multi-choice-actions" data-question-type="${escapeHtml(question.type)}"><div class="multi-choice-grid">${optionButtons}</div>${confirmButton}</div>`
      : `<div class="question-actions choice-actions" data-question-type="${escapeHtml(question.type)}">${optionButtons}${confirmButton}</div>`;
  }

  composerInput.placeholder = question.type === "number"
    ? `请输入${question.unit ? `数值（${question.unit}）` : "数值"}`
    : ["single", "multi"].includes(question.type)
      ? "可点击选项，也可直接输入"
      : "请回答当前问题";

  return `
    <p class="question-kicker">建议补充</p>
    <h3>${escapeHtml(question.question)}</h3>
    <div class="question-action-row${question.type === "multi" ? " is-multi" : ""}">
      ${actions}
      <button type="button" class="skip-question" data-question-id="${escapeHtml(question.id)}">跳过</button>
    </div>
  `;
}

function renderQuestion(question, target = questionPanel) {
  if (question) appState.autoQuestionIds.add(question.id);
  appState.currentQuestionId = question?.id ?? null;
  target.hidden = false;
  target.innerHTML = getQuestionHtml(question);
}

function getDisplayMatches(policies) {
  const highMatches = policies.filter((item) => item.score >= 0.5);
  return highMatches.length ? highMatches : policies.slice(0, 3);
}

function evaluateCurrentMatches() {
  const policies = matchPolicies(appState.company);
  appState.evaluatedPolicies = policies;
  const highMatches = policies.filter((item) => item.score >= 0.5);
  highMatchCount.textContent = highMatches.length;
  highMatchAmount.textContent = formatSupportAmountRange(getTotalSupportAmountRange(highMatches));

  return policies;
}

function renderMatches() {
  chatArea.querySelectorAll(".dynamic-turn").forEach((item) => item.remove());
  const policies = evaluateCurrentMatches();
  const displayMatches = getDisplayMatches(policies);

  policyList.innerHTML = displayMatches.map(renderPolicyCard).join("");
  answerSummary.hidden = true;
  answerSummary.innerHTML = "";
  renderQuestion(getNextQuestion(policies));
}

function appendUserAnswer(text) {
  const bubble = document.createElement("div");
  bubble.className = "user-answer dynamic-turn";
  bubble.textContent = text;
  chatArea.appendChild(bubble);
  return bubble;
}

function deactivateOpenQuestions() {
  chatArea.querySelectorAll(".question-card:not(.is-answered)").forEach((card) => {
    card.classList.add("is-answered");
    card.querySelectorAll(".question-action-row").forEach((item) => item.remove());
  });
}

function appendSkipTurn(question) {
  deactivateOpenQuestions();
  appState.skippedQuestionIds.add(question.id);
  appState.activeQuestionId = null;
  appState.currentQuestionId = null;
  composerInput.value = "";

  const bubble = appendUserAnswer("跳过");
  const nextQuestion = getNextQuestion(appState.evaluatedPolicies);
  if (nextQuestion) appState.autoQuestionIds.add(nextQuestion.id);
  const nextQuestionCard = document.createElement("article");
  nextQuestionCard.className = "question-card dynamic-turn";
  nextQuestionCard.innerHTML = getQuestionHtml(nextQuestion);
  chatArea.appendChild(nextQuestionCard);
  appState.currentQuestionId = nextQuestion?.id ?? null;
  chatArea.scrollTop = bubble.offsetTop - chatArea.offsetTop - 12;
}

function appendMatchTurn(userAnswerText) {
  deactivateOpenQuestions();
  const bubble = appendUserAnswer(userAnswerText);

  const previousPolicies = appState.evaluatedPolicies;
  const policies = evaluateCurrentMatches();
  const displayMatches = getDisplayMatches(policies);
  const matchChange = getMatchChange(previousPolicies, policies);

  const summary = document.createElement("article");
  summary.className = "answer-summary dynamic-turn";
  summary.innerHTML = getAnswerSummaryHtml(policies, matchChange);
  chatArea.appendChild(summary);

  const list = document.createElement("section");
  list.className = "policy-list dynamic-turn";
  list.setAttribute("aria-label", "更新后的匹配事项列表");
  list.innerHTML = displayMatches.map(renderPolicyCard).join("");
  chatArea.appendChild(list);

  const nextQuestion = getNextQuestion(policies);
  if (nextQuestion) appState.autoQuestionIds.add(nextQuestion.id);
  const question = document.createElement("article");
  question.className = "question-card dynamic-turn";
  question.innerHTML = getQuestionHtml(nextQuestion);
  chatArea.appendChild(question);
  appState.currentQuestionId = nextQuestion?.id ?? null;
  chatArea.scrollTop = bubble.offsetTop - chatArea.offsetTop - 12;
}

function formatAnswerValue(question, value) {
  if (question.type === "boolean") return value ? "是" : "否";
  if (Array.isArray(value)) return value.join("、");
  return `${value}${question.unit ?? ""}`;
}

function upsertHistory(entry) {
  const existing = appState.answerHistory.find((item) => item.field === entry.field);

  if (existing) {
    Object.assign(existing, entry);
  } else {
    appState.answerHistory.push(entry);
  }
}

function upsertAnswer(question, value, shouldRender = true) {
  const previousValue = appState.company.facts[question.field];
  appState.company.facts[question.field] = value;
  appState.skippedQuestionIds.delete(question.id);
  if (question.field === "industry" && previousValue !== value) {
    appState.company.facts.industryDirections = value === "制造业" ? null : [value];
  }
  upsertHistory({
    questionId: question.id,
    field: question.field,
    label: question.label,
    value,
    displayValue: formatAnswerValue(question, value)
  });

  appState.activeQuestionId = null;
  composerInput.value = "";
  if (shouldRender) appendMatchTurn(formatAnswerValue(question, value));
}

function parseNumberAnswer(text, question) {
  const normalized = text.replace(/，/g, ".").replace(/,/g, "");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  let value = Number(match[0]);
  if (question?.unit === "万元" && /亿(?:元)?/.test(normalized)) value *= 10000;
  return value;
}

function parseBooleanAnswer(text) {
  if (/^(是(?:的)?|有|已|已经|符合|满足|true|yes|y)(?:[，,。.!！\s]|$)/i.test(text.trim())) return true;
  if (/^(否|无|没有|未|不符合|不满足|false|no|n)(?:[，,。.!！\s]|$)/i.test(text.trim())) return false;
  return null;
}

function parseSupplementalBoolean(text, field) {
  const rule = supplementalBooleanRules.find((item) => item.field === field);
  if (!rule) return null;
  if (rule.negative.test(text)) return false;
  if (rule.positive.test(text)) return true;
  return null;
}

function getQuestionOptions(question) {
  return (question.options ?? []).map((option) => ({
    value: typeof option === "string" ? option : option.value,
    label: typeof option === "string" ? option : option.label
  }));
}

function parseChoiceAnswer(text, question) {
  const matches = getQuestionOptions(question).filter((option) =>
    text.includes(option.label) || text.includes(String(option.value))
  );

  if (question.type === "multi") return matches.length ? matches.map((item) => item.value) : null;
  return matches[0]?.value ?? null;
}

function parseQuestionAnswer(text, question) {
  if (question.type === "number") return parseNumberAnswer(text, question);
  if (question.type === "boolean") return parseBooleanAnswer(text) ?? parseSupplementalBoolean(text, question.field);
  if (["single", "multi"].includes(question.type)) return parseChoiceAnswer(text, question);
  return text.trim() || null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseLabeledNumber(text, rule) {
  if (rule.skipWhen?.test(text)) return null;
  const aliases = rule.aliases.map(escapeRegExp).join("|");
  const match = text.match(new RegExp(`(?:${aliases})[^0-9-]{0,18}(-?\\d+(?:\\.\\d+)?)\\s*(亿元|亿|万元|万|人|%)?`, "i"));
  if (!match) return null;
  if (rule.disallowContext?.test(match[0])) return null;

  const amount = Number(match[1]);
  const suppliedUnit = match[2] ?? rule.unit;
  const value = /亿/.test(suppliedUnit) && rule.unit === "万元" ? amount * 10000 : amount;
  const displayUnit = /亿/.test(suppliedUnit) ? "亿元" : suppliedUnit === "万" ? "万元" : rule.unit;

  return {
    value,
    displayValue: `${match[1]}${displayUnit}`,
    questionId: rule.field
  };
}

function mergeSupplementalUpdates(updates) {
  const merged = new Map();
  for (const update of updates) {
    const previous = merged.get(update.field);
    if (previous && Array.isArray(previous.value) && Array.isArray(update.value)) {
      const value = [...new Set([...previous.value, ...update.value])];
      merged.set(update.field, { ...update, value, displayValue: value.join("、") });
    } else {
      merged.set(update.field, update);
    }
  }
  return [...merged.values()];
}

function parseSupplementalFacts(text) {
  const updates = [];
  const industryOptions = ["制造业", "建筑业", "金融业", "软件和信息技术服务业", "文化、体育和娱乐业", "科学研究和技术服务业"];
  const industry = industryOptions.find((item) => text.includes(item));
  if (industry) {
    const industryChanged = appState.company.facts.industry !== industry;
    updates.push({ field: "industry", value: industry, displayValue: industry, questionId: "industry" });
    if (industryChanged) {
      updates.push({
        field: "industryDirections",
        value: industry === "制造业" ? null : [industry],
        displayValue: industry,
        silent: true
      });
    }
  }

  const directionOptions = ["新一代信息技术产业", "生物医药和大健康产业", "高端汽车和新能源智能汽车产业", "机器人和智能制造产业", "人工智能产业", "自动驾驶产业"];
  const directions = directionOptions.filter((item) => text.includes(item));
  if (directions.length) {
    updates.push({ field: "industryDirections", value: directions, displayValue: directions.join("、"), questionId: "industryDirections" });
  }

  const qualificationOptions = ["企业技术中心", "科技型中小企业", "隐形冠军企业", "国家级研发机构"];
  const qualifications = qualificationOptions.filter((item) => text.includes(item));
  if (qualifications.length) {
    updates.push({ field: "qualifications", value: qualifications, displayValue: qualifications.join("、"), questionId: "qualifications" });
  }

  const enterpriseScale = ["大型企业", "中型企业", "小型企业", "微型企业"].find((item) => text.includes(item));
  if (enterpriseScale) {
    updates.push({ field: "enterpriseScale", value: enterpriseScale, displayValue: enterpriseScale });
  }

  for (const rule of batchNumberRules) {
    const parsed = parseLabeledNumber(text, rule);
    if (parsed) updates.push({ field: rule.field, ...parsed });
  }

  for (const rule of supplementalBooleanRules) {
    const value = parseSupplementalBoolean(text, rule.field);
    if (value === null) continue;
    updates.push({
      field: rule.field,
      value,
      displayValue: value ? "是" : "否",
      questionId: rule.field
    });
  }

  return mergeSupplementalUpdates(updates);
}

function applySupplementalFacts(updates) {
  for (const update of updates) {
    appState.company.facts[update.field] = update.value;
    const questionId = update.questionId ?? (getQuestionById(update.field) ? update.field : null);
    if (questionId) appState.skippedQuestionIds.delete(questionId);
    if (update.silent) continue;
    upsertHistory({
      questionId: update.questionId ?? (getQuestionById(update.field) ? update.field : `supplement-${update.field}`),
      field: update.field,
      label: supplementalFields[update.field] ?? update.field,
      value: update.value,
      displayValue: update.displayValue
    });
  }
}

function submitTextAnswer() {
  const question = getQuestionById(appState.currentQuestionId);
  const text = composerInput.value.trim();
  if (!text) return;

  if (!question) {
    const supplementalUpdates = parseSupplementalFacts(text);
    if (!supplementalUpdates.length) return;
    applySupplementalFacts(supplementalUpdates);
    composerInput.value = "";
    appendMatchTurn(text);
    return;
  }

  const supplementalUpdates = parseSupplementalFacts(text);
  const currentQuestionUpdate = supplementalUpdates.find((update) => update.field === question.field);
  const isBatchSubmission = supplementalUpdates.length > 1 || (supplementalUpdates.length === 1 && !currentQuestionUpdate);

  // 多字段文本优先按字段语义入库，避免把其中第一串数字误写为当前问题的答案。
  if (isBatchSubmission) {
    if (!currentQuestionUpdate) appState.skippedQuestionIds.add(question.id);
    appState.activeQuestionId = null;
    applySupplementalFacts(supplementalUpdates);
    composerInput.value = "";
    appendMatchTurn(text);
    return;
  }

  const value = currentQuestionUpdate?.value ?? parseQuestionAnswer(text, question);

  if (value === null || Number.isNaN(value)) {
    if (supplementalUpdates.length) {
      appState.skippedQuestionIds.add(question.id);
      applySupplementalFacts(supplementalUpdates);
      composerInput.value = "";
      appendMatchTurn(text);
      return;
    }
    composerInput.value = "";
    composerInput.placeholder = question.type === "number"
      ? "未识别到数值，请重新输入"
      : ["single", "multi"].includes(question.type)
        ? "未识别到有效选项，请重新输入"
        : "请回答“是”或“否”";
    return;
  }

  upsertAnswer(question, value, false);
  applySupplementalFacts(supplementalUpdates);
  appendMatchTurn(text);
}

policyCalculatorActions.forEach((button) => {
  button.addEventListener("click", () => {
    renderMatches();
    showScreen("results");
  });
});

function enterPolicyCalculator() {
  renderMatches();
  showScreen("results");
}

backButton.addEventListener("click", () => {
  showScreen("entry");
});

function showRdFundingModal() {
  rdFundingResult.hidden = true;
  rdFundingResult.textContent = "";
  rdFundingModal.hidden = false;
  rdFundingModal.setAttribute("aria-hidden", "false");
  rdFundingCurrentInput.focus();
}

function closeRdFundingModal() {
  rdFundingModal.hidden = true;
  rdFundingModal.setAttribute("aria-hidden", "true");
}

function formatFundingAmount(amount) {
  return `${Number.isInteger(amount) ? amount : amount.toFixed(1)}万元`;
}

function refreshCalculatedFundingDisplay(policyId) {
  const policies = evaluateCurrentMatches();
  const policy = policies.find((item) => item.id === policyId);
  const amountText = policy ? getPolicySupportAmountText(policy) : "";

  document.querySelectorAll(`.policy-card[data-policy-id="${policyId}"] .amount-box strong`).forEach((element) => {
    element.textContent = amountText;
  });

  const displayMatches = getDisplayMatches(policies);
  document.querySelectorAll(".match-result-line").forEach((element) => {
    element.outerHTML = getMatchResultLineHtml(displayMatches);
  });
}

function calculateRdFunding() {
  const policyId = "1361663723105447936";
  const current = Number(rdFundingCurrentInput.value);
  const previousText = rdFundingPreviousInput.value.trim();
  const previous = previousText === "" ? null : Number(previousText);
  let message = "";
  let isEligible = false;
  appState.calculatedFundingAmounts.delete(policyId);

  if (!Number.isFinite(current) || current < 0 || (previous !== null && (!Number.isFinite(previous) || previous < 0))) {
    message = "请输入有效的研发费用金额。";
  } else if (current < 3000) {
    message = "暂不满足研发费用达到3000万元的申报条件。";
  } else {
    const growthRate = previous && previous > 0 ? (current - previous) / previous : 1;
    if (growthRate < 0.08) {
      message = `暂不满足研发费用增速达到8%的申报条件，当前增速为${(growthRate * 100).toFixed(1)}%。`;
    } else {
      const increment = previous && previous > 0 ? current - previous : current;
      const calculated = Math.floor(increment * 0.1) / 10;
      const subsidy = Math.min(200, calculated);
      if (subsidy < 1) {
        message = "测算补贴金额低于1万元，暂不予兑现。";
      } else {
        isEligible = true;
        appState.calculatedFundingAmounts.set(policyId, subsidy);
        refreshCalculatedFundingDisplay(policyId);
        message = `预计可获得补贴 ${formatFundingAmount(subsidy)}。研发费用增速 ${(growthRate * 100).toFixed(1)}%，按增量部分1%测算${subsidy >= 200 ? "，已按200万元封顶" : ""}。`;
      }
    }
  }

  if (!isEligible) refreshCalculatedFundingDisplay(policyId);

  rdFundingResult.hidden = false;
  rdFundingResult.classList.toggle("is-eligible", isEligible);
  rdFundingResult.classList.toggle("is-ineligible", !isEligible);
  rdFundingResult.textContent = message;
}

rdFundingSubmit.addEventListener("click", calculateRdFunding);
rdFundingClose.addEventListener("click", closeRdFundingModal);
rdFundingModal.addEventListener("click", (event) => {
  if (event.target === rdFundingModal) closeRdFundingModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !rdFundingModal.hidden) closeRdFundingModal();
});

chatArea.addEventListener("click", (event) => {
  if (event.target.closest(".funding-calc-button")) showRdFundingModal();
});

chatArea.addEventListener("click", (event) => {
  const toggle = event.target.closest(".detail-toggle");
  if (!toggle) return;

  const card = toggle.closest(".policy-card, .history-policy-card");
  const detail = card.querySelector(".policy-detail");
  const isOpen = !detail.hidden;

  detail.hidden = isOpen;
  toggle.textContent = isOpen ? toggle.dataset.openLabel : toggle.dataset.closeLabel;
  toggle.setAttribute("aria-expanded", String(!isOpen));
});

chatArea.addEventListener("click", (event) => {
  const option = event.target.closest(".answer-option");
  if (!option) return;
  const question = getQuestionById(option.dataset.questionId);
  if (!question) return;

  if (question.type === "multi") {
    const isExclusive = question.selectionMode === "single" || option.dataset.value.startsWith("无以上");
    const options = [...option.closest(".question-actions").querySelectorAll(".choice-option")];
    if (isExclusive) {
      options.filter((item) => item !== option).forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-pressed", "false");
      });
      option.classList.add("is-selected");
      option.setAttribute("aria-pressed", "true");
      return;
    } else {
      options.filter((item) => item.dataset.value.startsWith("无以上")).forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-pressed", "false");
      });
    }
    option.classList.toggle("is-selected");
    option.setAttribute("aria-pressed", String(option.classList.contains("is-selected")));
    return;
  }

  const value = question.type === "boolean" ? option.dataset.value === "true" : option.dataset.value;
  upsertAnswer(question, value);
});

chatArea.addEventListener("click", (event) => {
  const confirmButton = event.target.closest(".confirm-options");
  if (!confirmButton) return;
  const question = getQuestionById(confirmButton.dataset.questionId);
  if (!question) return;
  const container = confirmButton.closest(".question-actions");
  const values = [...container.querySelectorAll(".choice-option.is-selected")].map((item) => item.dataset.value);
  if (!values.length) return;
  upsertAnswer(question, values);
});

chatArea.addEventListener("click", (event) => {
  const skipButton = event.target.closest(".skip-question");
  if (!skipButton) return;
  const question = getQuestionById(skipButton.dataset.questionId);
  if (question) appendSkipTurn(question);
});

chatArea.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-answer");
  if (!editButton) return;
  deactivateOpenQuestions();
  appState.activeQuestionId = editButton.dataset.questionId;
  const question = document.createElement("article");
  question.className = "question-card dynamic-turn";
  question.innerHTML = getQuestionHtml(getQuestionById(appState.activeQuestionId));
  chatArea.appendChild(question);
  appState.currentQuestionId = appState.activeQuestionId;
  question.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

sendButton.addEventListener("click", submitTextAnswer);
composerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitTextAnswer();
});
