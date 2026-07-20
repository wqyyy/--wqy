import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  defaultScoringCriteria,
  defaultScoringResults,
  evaluationCompanies,
  type EvaluationCompany,
  type Level1Indicator,
  type ScoringCriteria,
  type ScoringResult,
} from "@/data/enterpriseEvaluationData";
import { evaluationItems } from "@/data/mockData";
import {
  SCORE_BANDS,
  SCORE_BAND_COLORS,
  buildScoreBasis,
  buildScoreDistributionGradient,
  countIndicators,
  createEmptyLevel1,
  createEmptyLevel2,
  deepCloneCriteria,
  deepCloneResults,
  ensureScoreRecordsForCriteria,
  exportResultsCsv,
  formatScoreValue,
  getRemainingCriteriaScore,
  getRemainingLevel1Score,
  getRemainingLevel2Score,
  getScoreBand,
  getScoreEditUpperLimit,
  normalizeScoreValue,
  refreshResultTotals,
  renumberCriteria,
  syncCriteriaScores,
  validateScoringCriteria,
  type ScoreBand,
} from "@/lib/enterpriseEvaluationScoring";
import "@/styles/enterprise-eval-base.scoped.css";
import "@/styles/enterprise-eval-theme.scoped.css";
import "@/styles/enterprise-eval-overrides.css";

type WorkflowView = "upload" | "criteria" | "preview";

const COMPANIES_PER_PAGE = 10;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useFontAwesome() {
  useEffect(() => {
    const id = "ee-fontawesome";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
    document.head.appendChild(link);
  }, []);
}

export default function EnterpriseEvaluationDetail() {
  useFontAwesome();
  const { id } = useParams();
  const navigate = useNavigate();
  const item = evaluationItems.find((entry) => entry.id === id);
  const title = item?.name ?? "经开区高质量数据集典型案例认定";

  const [currentView, setCurrentView] = useState<WorkflowView>("upload");
  const [criteriaUploaded, setCriteriaUploaded] = useState(false);
  const [criteriaParsed, setCriteriaParsed] = useState(false);
  const [criteriaConfirmed, setCriteriaConfirmed] = useState(false);
  const [scoringInProgress, setScoringInProgress] = useState(false);
  const [scoringCompleted, setScoringCompleted] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [editedCriteria, setEditedCriteria] = useState<ScoringCriteria>(() => deepCloneCriteria(defaultScoringCriteria));
  const [results, setResults] = useState<ScoringResult[]>(() => deepCloneResults(defaultScoringResults));
  const [collapsedLevel1, setCollapsedLevel1] = useState<Record<number, boolean>>({});
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [companyPage, setCompanyPage] = useState(1);
  const [scoringProgress, setScoringProgress] = useState({ index: 0, total: 0, name: "" });
  const [materialCompany, setMaterialCompany] = useState<EvaluationCompany | null>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<number | null>(null);
  const [scoringCompanyId, setScoringCompanyId] = useState<number | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scoringTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(""), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (scoringTimerRef.current) window.clearTimeout(scoringTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const indicatorCounts = countIndicators(editedCriteria);

  const filteredCompanies = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let list = evaluationCompanies;
    if (keyword) {
      list = list.filter(
        (company) =>
          company.name.toLowerCase().includes(keyword) || company.creditCode.toLowerCase().includes(keyword),
      );
    }
    if (scoringCompleted) {
      list = [...list].sort((a, b) => {
        const scoreA = results.find((item) => item.companyId === a.id)?.totalFinalScore ?? 0;
        const scoreB = results.find((item) => item.companyId === b.id)?.totalFinalScore ?? 0;
        return scoreB - scoreA;
      });
    }
    return list;
  }, [results, scoringCompleted, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE));
  const pagedCompanies = filteredCompanies.slice((companyPage - 1) * COMPANIES_PER_PAGE, companyPage * COMPANIES_PER_PAGE);

  useEffect(() => {
    setCompanyPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (companyPage > totalPages) setCompanyPage(totalPages);
  }, [companyPage, totalPages]);

  const processFlow = useMemo(() => {
    const doneSteps = new Set<number>();
    let activeStep = 1;
    if (criteriaUploaded) {
      doneSteps.add(1);
      activeStep = 2;
    }
    if (criteriaConfirmed || scoringInProgress) {
      doneSteps.add(2);
      activeStep = 3;
    }
    if (scoringCompleted) {
      doneSteps.add(3);
      activeStep = 4;
    }
    return { doneSteps, activeStep };
  }, [criteriaConfirmed, criteriaUploaded, scoringCompleted, scoringInProgress]);

  const statistics = useMemo(() => {
    if (!scoringCompleted || !results.length) return null;
    const scores = results.map((item) => item.totalFinalScore);
    const counts = Object.fromEntries(SCORE_BANDS.map((band) => [band, 0])) as Record<ScoreBand, number>;
    scores.forEach((score) => {
      counts[getScoreBand(score)] += 1;
    });
    return {
      avg: (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1),
      max: Math.max(...scores).toFixed(1),
      min: Math.min(...scores).toFixed(1),
      count: scores.length,
      counts,
      gradient: buildScoreDistributionGradient(counts, scores.length),
    };
  }, [results, scoringCompleted]);

  const scoringCompany = evaluationCompanies.find((company) => company.id === scoringCompanyId) ?? null;
  const scoringResult = results.find((item) => item.companyId === scoringCompanyId) ?? null;
  const showCompanyPanel = currentView === "upload" || currentView === "preview";

  const resetWorkflow = useCallback(() => {
    if (scoringTimerRef.current) window.clearTimeout(scoringTimerRef.current);
    setCurrentView("upload");
    setCriteriaUploaded(false);
    setCriteriaParsed(false);
    setCriteriaConfirmed(false);
    setScoringInProgress(false);
    setScoringCompleted(false);
    setParsing(false);
    setUploadedFile(null);
    setEditedCriteria(deepCloneCriteria(defaultScoringCriteria));
    setResults(deepCloneResults(defaultScoringResults));
    setCollapsedLevel1({});
    setScoringProgress({ index: 0, total: 0, name: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const startParse = useCallback(() => {
    if (parsing) return;
    setParsing(true);
    setCurrentView("upload");
    window.setTimeout(() => {
      const cloned = syncCriteriaScores(deepCloneCriteria(defaultScoringCriteria));
      setEditedCriteria(cloned);
      setResults(deepCloneResults(defaultScoringResults).map((result) => ensureScoreRecordsForCriteria(result, cloned)));
      setCriteriaParsed(true);
      setParsing(false);
      setCurrentView("criteria");
      showToast("评分标准解析完成");
    }, 2000);
  }, [parsing, showToast]);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (![".pdf", ".doc", ".docx"].some((ext) => lower.endsWith(ext))) {
      showToast("仅支持 pdf、word 格式");
      return;
    }
    setUploadedFile({ name: file.name, size: formatFileSize(file.size) });
    setCriteriaUploaded(true);
    setCriteriaParsed(false);
    setCriteriaConfirmed(false);
    setScoringCompleted(false);
    setScoringInProgress(false);
    showToast("文件上传成功，开始自动解析");
    window.setTimeout(() => startParse(), 300);
  };

  const updateCriteria = (updater: (prev: ScoringCriteria) => ScoringCriteria) => {
    setEditedCriteria((prev) => syncCriteriaScores(updater(prev)));
  };

  const handleAddLevel1 = () => {
    if (scoringInProgress) return;
    const remaining = getRemainingLevel1Score(editedCriteria);
    if (remaining <= 0) {
      showToast("剩余可分配分值为0，无法添加指标");
      return;
    }
    updateCriteria((prev) =>
      renumberCriteria({
        ...prev,
        indicators: [...prev.indicators, createEmptyLevel1(getRemainingLevel1Score(prev))],
      }),
    );
    showToast(`已添加一级指标，默认分配${formatScoreValue(remaining)}分`);
  };

  const handleAddLevel2 = (level1Index: number) => {
    if (scoringInProgress) return;
    const parent = editedCriteria.indicators[level1Index];
    if (!parent) return;

    // 一级满分由二级汇总：优先用该一级剩余；否则用全局剩余（新增二级会抬升该一级满分）
    const parentRemaining = getRemainingLevel2Score(parent);
    const globalRemaining = getRemainingCriteriaScore(editedCriteria);
    const remaining = parentRemaining > 0 ? parentRemaining : globalRemaining;

    if (remaining <= 0) {
      showToast("剩余可分配分值为0，无法添加指标");
      return;
    }

    updateCriteria((prev) => {
      const current = prev.indicators[level1Index];
      if (!current) return prev;
      const nextParentRemaining = getRemainingLevel2Score(current);
      const nextGlobalRemaining = getRemainingCriteriaScore(prev);
      const nextRemaining = nextParentRemaining > 0 ? nextParentRemaining : nextGlobalRemaining;
      if (nextRemaining <= 0) return prev;
      const nextChildren = [
        ...current.children,
        createEmptyLevel2(nextRemaining, level1Index, current.children.length),
      ];
      return renumberCriteria({
        ...prev,
        indicators: prev.indicators.map((entry, index) =>
          index === level1Index ? { ...entry, children: nextChildren } : entry,
        ),
      });
    });
    showToast(`已添加二级指标，默认分配${formatScoreValue(remaining)}分`);
  };

  const beginScoring = () => {
    const validation = validateScoringCriteria(editedCriteria);
    if (!validation.ok) {
      showToast(validation.message || "评分标准校验未通过");
      return;
    }
    setCriteriaConfirmed(true);
    setScoringInProgress(true);
    setScoringCompleted(false);
    const syncedResults = deepCloneResults(defaultScoringResults).map((result) =>
      ensureScoreRecordsForCriteria(result, editedCriteria),
    );
    setResults(syncedResults);
    const total = evaluationCompanies.length;
    setScoringProgress({ index: 0, total, name: evaluationCompanies[0]?.name ?? "" });
    setCurrentView("criteria");

    const scoreNext = (index: number) => {
      if (index >= total) {
        setScoringInProgress(false);
        setScoringCompleted(true);
        setCurrentView("preview");
        showToast("批量智能评分已完成");
        return;
      }
      setScoringProgress({
        index: index + 1,
        total,
        name: evaluationCompanies[index]?.name ?? "",
      });
      scoringTimerRef.current = window.setTimeout(() => scoreNext(index + 1), 350);
    };
    scoreNext(0);
  };

  const backToCriteriaEdit = () => {
    setCriteriaConfirmed(false);
    setScoringCompleted(false);
    setScoringInProgress(false);
    setCurrentView("criteria");
  };

  const openScoringDetail = (companyId: number) => {
    if (!scoringCompleted) return;
    const result = results.find((item) => item.companyId === companyId);
    if (!result) return;
    setScoringCompanyId(companyId);
    setDraftScores(Object.fromEntries(result.scores.map((score) => [score.indicatorCode, score.finalScore])));
  };

  const saveScoringDetail = () => {
    if (!scoringCompanyId) return;
    setResults((prev) =>
      prev.map((result) => {
        if (result.companyId !== scoringCompanyId) return result;
        const nextScores = result.scores.map((score) => {
          const nextValue = Math.min(
            score.maxScore,
            Math.max(0, normalizeScoreValue(draftScores[score.indicatorCode] ?? score.finalScore)),
          );
          return {
            ...score,
            finalScore: nextValue,
            manualAdjusted: nextValue !== score.aiScore,
          };
        });
        return refreshResultTotals({ ...result, scores: nextScores });
      }),
    );
    setScoringCompanyId(null);
    showToast("评分修改已保存");
  };

  const handleExport = () => {
    if (!scoringCompleted) {
      showToast("请先完成评分后再导出");
      return;
    }
    const csv = `\uFEFF${exportResultsCsv(evaluationCompanies, results, editedCriteria)}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}-评分结果.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("已导出评分结果");
  };

  const runSearch = () => {
    setSearchQuery(searchInput);
    const keyword = searchInput.trim().toLowerCase();
    const count = !keyword
      ? evaluationCompanies.length
      : evaluationCompanies.filter(
          (company) =>
            company.name.toLowerCase().includes(keyword) || company.creditCode.toLowerCase().includes(keyword),
        ).length;
    if (!count) showToast("未找到匹配的企业");
    else showToast(`找到 ${count} 家企业`);
  };

  const processSteps = [
    { key: 1, label: "上传标准", icon: "fa-solid fa-cloud-arrow-up" },
    { key: 2, label: "解析标准", icon: "fa-solid fa-wand-magic-sparkles" },
    { key: 3, label: "智能评分", icon: "fa-solid fa-chart-line" },
    { key: 4, label: "结果预览", icon: "fa-solid fa-clipboard-check" },
  ];

  return (
    <div className="ee-proto">
      <header className="site-header">
        <div className="site-header-left">
          <a
            href="#/enterprise-evaluation"
            className="back-link"
            onClick={(event) => {
              event.preventDefault();
              navigate("/enterprise-evaluation");
            }}
          >
            ← {title}
          </a>
        </div>
        <div className="site-header-right" />
      </header>

      <main className="page-container">
        <div className="process-flow-card" aria-label="评审流程">
          <div className="process-flow-header">
            <h3>评审流程</h3>
            <span>第 {processFlow.activeStep} / 4 步</span>
          </div>
          <div className="process-flow-steps">
            {processSteps.flatMap((step, index) => {
              const nodes = [
                <div
                  key={`step-${step.key}`}
                  className={[
                    "process-step",
                    processFlow.activeStep === step.key ? "active" : "",
                    processFlow.doneSteps.has(step.key) ? "done" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="process-step-icon" aria-hidden="true">
                    <i className={step.icon} />
                  </span>
                  <span className="process-step-label">{step.label}</span>
                </div>,
              ];
              if (index < processSteps.length - 1) {
                nodes.push(
                  <div
                    key={`line-${step.key}`}
                    className={`process-line${processFlow.doneSteps.has(step.key) ? " done" : ""}`}
                    aria-hidden="true"
                  >
                    &gt;&gt;
                  </div>,
                );
              }
              return nodes;
            })}
          </div>
        </div>

        <div className="workflow-pages">
          {currentView === "upload" && (
            <section className="workflow-page active" aria-label="上传标准">
              <div className="upload-stage-grid">
                <div className="card upload-standard-card">
                  <div className="card-header-red">
                    <h2>上传评分表</h2>
                  </div>
                  <div className="card-body card-body-compact criteria-card-body">
                    {!parsing ? (
                      <div className="criteria-state-panel">
                        {!uploadedFile ? (
                          <div
                            className={`upload-box-compact upload-box-spacious${dragOver ? " drag-over" : ""}`}
                            role="button"
                            tabIndex={0}
                            aria-label="上传评分标准文件"
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(event) => {
                              event.preventDefault();
                              setDragOver(false);
                              handleFile(event.dataTransfer.files?.[0]);
                            }}
                          >
                            <div className="upload-content">
                              <div className="upload-zone-icon" aria-hidden="true">
                                📤
                              </div>
                              <div>
                                <div className="upload-text-sm">上传评分表</div>
                                <div className="upload-hint-sm">支持pdf、word格式，上传后自动解析</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="uploaded-file-box-compact">
                            <div className="uploaded-file-info">
                              <span className="file-icon" aria-hidden="true" />
                              <div>
                                <div className="file-name">{uploadedFile.name}</div>
                                <div className="file-size">{uploadedFile.size}</div>
                              </div>
                            </div>
                            <button type="button" className="btn-link" onClick={resetWorkflow}>
                              重新上传
                            </button>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          style={{ display: "none" }}
                          onChange={(event) => handleFile(event.target.files?.[0])}
                        />
                      </div>
                    ) : (
                      <div className="criteria-state-panel parsing-stage-panel upload-parsing-panel">
                        <div className="parsing-box-compact">
                          <div className="spinner-sm" />
                          <div className="parsing-text-sm">正在智能解析评分标准...</div>
                          <div className="parsing-hint-sm">AI正在识别一级指标、二级指标、分值及评分规则</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {currentView === "criteria" && (
            <section className="workflow-page active" aria-label="解析标准">
              <div className="card criteria-workspace-card">
                <div className="card-header-flex-compact">
                  <h2>解析出的评分标准</h2>
                </div>
                <div className="card-body card-body-compact criteria-card-body">
                  <div className="criteria-state-panel criteria-edit-panel">
                    <div
                      className="criteria-summary-box-compact"
                      style={
                        criteriaConfirmed
                          ? { background: "var(--color-primary-light)", borderColor: "#f0b8c2" }
                          : undefined
                      }
                    >
                      <span className="summary-icon-sm">{criteriaConfirmed ? "已确认" : "已解析"}</span>
                      <div className="summary-text-sm">
                        {criteriaConfirmed ? "评分标准已确认：" : "已解析出"}{" "}
                        <strong>{indicatorCounts.level1}</strong> 个一级指标，
                        <strong>{indicatorCounts.level2}</strong> 个二级指标
                      </div>
                    </div>

                    <div className={`criteria-list${criteriaConfirmed ? " criteria-list-confirmed" : ""}`}>
                      {editedCriteria.indicators.map((indicator, level1Index) => {
                        const collapsed = !!collapsedLevel1[level1Index];
                        if (criteriaConfirmed) {
                          return (
                            <div key={`${indicator.code}-${level1Index}`} className="criteria-level1-item criteria-level1-readonly">
                              <div
                                className="criteria-level1-header"
                                onClick={() => setCollapsedLevel1((prev) => ({ ...prev, [level1Index]: !prev[level1Index] }))}
                              >
                                <span className={`criteria-expand-icon${collapsed ? "" : " expanded"}`}>▶</span>
                                <div className="criteria-level1-title">
                                  <span className="criteria-level1-name">{indicator.name}</span>
                                  <span className="criteria-score-tag">
                                    {formatScoreValue(indicator.maxScore)}
                                    <span>分</span>
                                  </span>
                                </div>
                              </div>
                              {!collapsed && (
                                <div className="criteria-level2-list expanded">
                                  {indicator.children.map((child) => (
                                    <div key={child.code} className="criteria-level2-item criteria-level2-readonly">
                                      <div className="criteria-level2-code">{child.code}</div>
                                      <div className="criteria-level2-content">
                                        <div className="criteria-level2-name">{child.name}</div>
                                        <div className="criteria-level2-rules">{child.rules}</div>
                                      </div>
                                      <div className="criteria-level2-score">
                                        {formatScoreValue(child.maxScore)}
                                        <span>分</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={`${indicator.code}-${level1Index}`} className="criteria-level1-item">
                            <div
                              className="criteria-level1-header"
                              onClick={() => setCollapsedLevel1((prev) => ({ ...prev, [level1Index]: !prev[level1Index] }))}
                            >
                              <span className={`criteria-expand-icon${collapsed ? "" : " expanded"}`}>▶</span>
                              <div className="criteria-level1-title">
                                <span
                                  className="criteria-level1-name"
                                  contentEditable={!scoringInProgress}
                                  suppressContentEditableWarning
                                  onClick={(event) => event.stopPropagation()}
                                  onBlur={(event) =>
                                    updateCriteria((prev) => ({
                                      ...prev,
                                      indicators: prev.indicators.map((entry, index) =>
                                        index === level1Index ? { ...entry, name: event.currentTarget.textContent || "" } : entry,
                                      ),
                                    }))
                                  }
                                >
                                  {indicator.name}
                                </span>
                                <span className="criteria-score-tag" title="由二级指标分值汇总">
                                  {formatScoreValue(indicator.maxScore)}
                                  <span>分</span>
                                </span>
                              </div>
                              <div className="criteria-actions" onClick={(event) => event.stopPropagation()}>
                                <button
                                  type="button"
                                  className="criteria-btn"
                                  disabled={scoringInProgress}
                                  onClick={() => handleAddLevel2(level1Index)}
                                >
                                  添加二级
                                </button>
                                <button
                                  type="button"
                                  className="criteria-btn criteria-btn-danger"
                                  disabled={scoringInProgress || editedCriteria.indicators.length <= 1}
                                  onClick={() => {
                                    if (!window.confirm("确认删除该一级指标？")) return;
                                    updateCriteria((prev) =>
                                      renumberCriteria({
                                        ...prev,
                                        indicators: prev.indicators.filter((_, index) => index !== level1Index),
                                      }),
                                    );
                                  }}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                            {!collapsed && (
                              <div className="criteria-level2-list expanded">
                                {indicator.children.map((child, level2Index) => (
                                  <div key={`${child.code}-${level2Index}`} className="criteria-level2-item">
                                    <div className="criteria-level2-code">{child.code}</div>
                                    <div className="criteria-level2-content">
                                      <div
                                        className="criteria-level2-name"
                                        contentEditable={!scoringInProgress}
                                        suppressContentEditableWarning
                                        onBlur={(event) =>
                                          updateCriteria((prev) => ({
                                            ...prev,
                                            indicators: prev.indicators.map((entry, index) =>
                                              index === level1Index
                                                ? {
                                                    ...entry,
                                                    children: entry.children.map((sub, subIndex) =>
                                                      subIndex === level2Index
                                                        ? { ...sub, name: event.currentTarget.textContent || "" }
                                                        : sub,
                                                    ),
                                                  }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      >
                                        {child.name}
                                      </div>
                                      <textarea
                                        className="criteria-level2-rules"
                                        rows={4}
                                        disabled={scoringInProgress}
                                        value={child.rules}
                                        onChange={(event) =>
                                          updateCriteria((prev) => ({
                                            ...prev,
                                            indicators: prev.indicators.map((entry, index) =>
                                              index === level1Index
                                                ? {
                                                    ...entry,
                                                    children: entry.children.map((sub, subIndex) =>
                                                      subIndex === level2Index ? { ...sub, rules: event.target.value } : sub,
                                                    ),
                                                  }
                                                : entry,
                                            ),
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="criteria-level2-score">
                                      <input
                                        type="number"
                                        className="score-input-inline"
                                        value={child.maxScore}
                                        min={1}
                                        max={getScoreEditUpperLimit(editedCriteria, child.maxScore)}
                                        step={1}
                                        disabled={scoringInProgress}
                                        onChange={(event) => {
                                          const raw = normalizeScoreValue(event.target.value);
                                          updateCriteria((prev) => {
                                            const upper = getScoreEditUpperLimit(prev, child.maxScore);
                                            const nextScore = Math.min(upper, Math.max(1, raw));
                                            return {
                                              ...prev,
                                              indicators: prev.indicators.map((entry, index) =>
                                                index === level1Index
                                                  ? {
                                                      ...entry,
                                                      children: entry.children.map((sub, subIndex) =>
                                                        subIndex === level2Index ? { ...sub, maxScore: nextScore } : sub,
                                                      ),
                                                    }
                                                  : entry,
                                              ),
                                            };
                                          });
                                        }}
                                      />
                                      <span>分</span>
                                    </div>
                                    <div className="criteria-actions">
                                      <button
                                        type="button"
                                        className="criteria-btn criteria-btn-danger"
                                        disabled={scoringInProgress || indicator.children.length <= 1}
                                        onClick={() => {
                                          if (!window.confirm("确认删除该二级指标？")) return;
                                          updateCriteria((prev) =>
                                            renumberCriteria({
                                              ...prev,
                                              indicators: prev.indicators.map((entry, index) =>
                                                index === level1Index
                                                  ? {
                                                      ...entry,
                                                      children: entry.children.filter((_, subIndex) => subIndex !== level2Index),
                                                    }
                                                  : entry,
                                              ),
                                            }),
                                          );
                                        }}
                                      >
                                        删除
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!criteriaConfirmed && (
                        <div className="criteria-add-level1-row">
                          <button
                            type="button"
                            className="criteria-btn"
                            disabled={scoringInProgress}
                            onClick={handleAddLevel1}
                          >
                            添加一级指标
                          </button>
                        </div>
                      )}
                    </div>

                    {scoringInProgress && (
                      <div className="batch-scoring-progress">
                        <div className="batch-scoring-progress-header">
                          <div className="spinner-sm batch-scoring-spinner" />
                          <div className="batch-scoring-copy">
                            <div className="batch-scoring-title">
                              正在评分：<span>{scoringProgress.name}</span>
                            </div>
                            <div className="batch-scoring-meta">
                              进度：
                              <span>
                                {scoringProgress.index}/{scoringProgress.total}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="batch-scoring-track">
                          <div
                            className="batch-scoring-bar"
                            style={{
                              width: `${scoringProgress.total ? (scoringProgress.index / scoringProgress.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className={`action-bar-compact action-bar-top${scoringInProgress || criteriaConfirmed ? " action-bar-split" : ""}`}>
                      {scoringInProgress ? (
                        <>
                          <button type="button" className="btn btn-secondary btn-sm" disabled>
                            重新上传
                          </button>
                          <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled>
                            评分中...
                          </button>
                        </>
                      ) : criteriaConfirmed ? (
                        <>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={backToCriteriaEdit}>
                            返回编辑
                          </button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={resetWorkflow}>
                            重新上传
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={resetWorkflow}>
                            重新上传
                          </button>
                          <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={beginScoring}>
                            开始评分
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {currentView === "preview" && (
            <section className="workflow-page active" aria-label="结果预览">
              <div className="preview-stage-grid">
                <div className="card right-card-statistics">
                  <div className="card-header-flex-compact">
                    <h2>评分统计概览</h2>
                    <div className="header-actions">
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleExport}>
                        导出Excel
                      </button>
                    </div>
                  </div>
                  <div className="card-body card-body-compact statistics-card-body">
                    <div id="statistics-content">
                      {statistics ? (
                        <div className="statistics-overview-row">
                          <div className="stats-grid stats-grid-compact">
                            <div className="stat-card">
                              <div className="stat-label">平均分</div>
                              <div className="stat-value">
                                {statistics.avg} <span className="stat-unit">分</span>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">最高分</div>
                              <div className="stat-value gov-positive">
                                {statistics.max} <span className="stat-unit">分</span>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">最低分</div>
                              <div className="stat-value gov-warning">
                                {statistics.min} <span className="stat-unit">分</span>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-label">申报企业</div>
                              <div className="stat-value">
                                {statistics.count} <span className="stat-unit">家</span>
                              </div>
                            </div>
                          </div>
                          <div className="chart-panel">
                            <div className="chart-title-row">
                              <div className="chart-title">评分分数分布</div>
                            </div>
                            <div className="distribution-donut-layout">
                              <div className="distribution-donut" style={{ background: statistics.gradient }}>
                                <div className="distribution-donut-center">
                                  <strong>{statistics.count}</strong>
                                  <span>家企业</span>
                                </div>
                              </div>
                              <div className="distribution-legend">
                                {SCORE_BANDS.map((band, index) => (
                                  <div key={band} className="distribution-legend-item">
                                    <span
                                      className="distribution-legend-dot"
                                      style={{ background: SCORE_BAND_COLORS[index] }}
                                    />
                                    <span className="distribution-legend-label">{band}</span>
                                    <span className="distribution-legend-value">{statistics.counts[band]}家</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="action-bar-compact action-bar-preview" aria-label="结果预览操作">
                <button type="button" className="btn btn-primary" onClick={backToCriteriaEdit}>
                  返回标准
                </button>
              </div>
            </section>
          )}
        </div>

        {showCompanyPanel && (
          <div className="card card-flex right-card-companies shared-company-card">
            <div className="card-header-flex-compact">
              <h2>{scoringCompleted ? "评分结果预览" : "申报企业列表"}</h2>
              <div className="header-actions">
                <span className="company-count-sm">
                  共 <strong>{filteredCompanies.length}</strong> 家
                </span>
              </div>
            </div>
            <div className="card-body-no-padding company-list-body">
              <div className="table-toolbar-compact">
                <input
                  type="text"
                  className="search-input-sm"
                  placeholder="搜索企业名称或统一社会信用代码"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") runSearch();
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                >
                  重置
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={runSearch}>
                  查询
                </button>
              </div>

              <div className="table-container company-table-frame">
                <table className="table table-compact company-table">
                  <colgroup>
                    <col className="company-col-rank" />
                    <col className="company-col-name" />
                    <col className="company-col-credit" />
                    <col className="company-col-material" />
                    <col className="company-col-result" />
                    <col className="company-col-action" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>序号/排名</th>
                      <th>企业名称</th>
                      <th>统一社会信用代码</th>
                      <th>申报材料</th>
                      <th>评分结果</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedCompanies.map((company, index) => {
                      const rank = (companyPage - 1) * COMPANIES_PER_PAGE + index + 1;
                      const result = results.find((item) => item.companyId === company.id);
                      const scored = scoringCompleted && result;
                      return (
                        <tr key={company.id}>
                          <td className="company-cell-rank">{rank}</td>
                          <td className="company-cell-name" title={company.name}>
                            {company.name}
                          </td>
                          <td className="company-cell-credit" title={company.creditCode}>
                            {company.creditCode}
                          </td>
                          <td className="company-cell-material">
                            <div className="material-cell material-cell-view-only">
                              <button
                                type="button"
                                className="btn-action"
                                title="预览企业申报材料"
                                onClick={() => {
                                  setMaterialCompany(company);
                                  setActiveMaterialId(company.materials[0]?.id ?? null);
                                }}
                              >
                                查看材料
                              </button>
                            </div>
                          </td>
                          <td className="company-cell-result">
                            {scored ? (
                              <button
                                type="button"
                                className="score-result-button"
                                title="查看评分详情"
                                onClick={() => openScoringDetail(company.id)}
                              >
                                <span className="status-badge status-scored">{result.totalFinalScore.toFixed(1)}分</span>
                              </button>
                            ) : (
                              <span className="status-badge status-pending">待评分</span>
                            )}
                          </td>
                          <td className="company-cell-action">
                            <div className="action-buttons">
                              {scoringCompleted ? (
                                <button
                                  type="button"
                                  className="btn-action btn-primary-action"
                                  title="查看评分详情"
                                  onClick={() => openScoringDetail(company.id)}
                                >
                                  评分详情
                                </button>
                              ) : (
                                <button type="button" className="btn-action" disabled title="请先完成智能评分">
                                  评分详情
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {pagedCompanies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="company-empty-cell">
                          未找到匹配的企业
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="company-pagination" aria-label="企业列表分页">
                <button
                  className="btn btn-secondary btn-sm company-pagination-button"
                  type="button"
                  disabled={companyPage <= 1}
                  onClick={() => setCompanyPage((page) => page - 1)}
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  上一页
                </button>
                <div className="company-pagination-summary" aria-live="polite">
                  <span>
                    第 {companyPage} / {totalPages} 页
                  </span>
                  <span>共 {filteredCompanies.length} 家</span>
                </div>
                <button
                  className="btn btn-secondary btn-sm company-pagination-button"
                  type="button"
                  disabled={companyPage >= totalPages}
                  onClick={() => setCompanyPage((page) => page + 1)}
                >
                  下一页
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className={`modal-overlay${materialCompany ? " show" : ""}`} id="material-modal">
        <div className="modal modal-large">
          <div className="modal-header">
            <h2>
              <span>{materialCompany?.name}</span> - 申报材料
            </h2>
            <button type="button" className="modal-close" onClick={() => setMaterialCompany(null)}>
              &times;
            </button>
          </div>
          <div className="modal-body" style={{ padding: 0 }}>
            <div className="material-viewer">
              <div className="material-sidebar">
                <h3>材料列表</h3>
                <div>
                  {materialCompany?.materials.map((material) => (
                    <button
                      key={material.id}
                      type="button"
                      className={activeMaterialId === material.id ? "material-item active" : "material-item"}
                      onClick={() => setActiveMaterialId(material.id)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        background: activeMaterialId === material.id ? "var(--color-primary-light)" : "transparent",
                        padding: "10px 12px",
                        cursor: "pointer",
                        color: "inherit",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{material.name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                        {material.pages} 页 · {material.size}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="material-content">
                <div className="pdf-viewer-container">
                  <div id="pdf-viewer-content">
                    <div className="empty-viewer">
                      {materialCompany?.materials.find((material) => material.id === activeMaterialId)?.name ||
                        "选择左侧材料以预览"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-overlay${scoringCompanyId ? " show" : ""}`} id="scoring-modal">
        <div className="modal modal-xlarge">
          <div className="modal-header">
            <h2>
              <span>{scoringCompany?.name}</span> - 评分详情
            </h2>
            <button type="button" className="modal-close" onClick={() => setScoringCompanyId(null)}>
              &times;
            </button>
          </div>
          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {scoringResult && (
              <div>
                <div style={{ marginBottom: 16, fontSize: 14 }}>
                  AI 评分：<strong>{formatScoreValue(scoringResult.totalAiScore)}</strong>
                  <span style={{ marginLeft: 16 }}>
                    终评总分：
                    <strong style={{ color: "var(--color-primary)" }}>
                      {formatScoreValue(
                        Object.entries(draftScores).reduce((sum, [, value]) => sum + normalizeScoreValue(value), 0),
                      )}
                    </strong>
                  </span>
                </div>
                {editedCriteria.indicators.map((indicator: Level1Indicator) => (
                  <div key={indicator.code} style={{ marginBottom: 16, border: "1px solid var(--color-border)", borderRadius: 6 }}>
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "#fafafa",
                        borderBottom: "1px solid var(--color-border)",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {indicator.code} {indicator.name}
                      <span style={{ marginLeft: 8, color: "var(--color-primary)" }}>
                        {formatScoreValue(
                          indicator.children.reduce(
                            (sum, child) => sum + normalizeScoreValue(draftScores[child.code] ?? 0),
                            0,
                          ),
                        )}
                        /{formatScoreValue(indicator.maxScore)}
                      </span>
                    </div>
                    {indicator.children.map((child) => {
                      const score = scoringResult.scores.find((item) => item.indicatorCode === child.code);
                      if (!score) return null;
                      return (
                        <div
                          key={child.code}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 100px",
                            gap: 12,
                            padding: "12px 14px",
                            borderTop: "1px solid var(--color-border)",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                              {child.code} {child.name}
                              <span style={{ marginLeft: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
                                满分 {child.maxScore}
                              </span>
                            </div>
                            <div
                              style={{
                                whiteSpace: "pre-wrap",
                                fontSize: 12,
                                lineHeight: 1.6,
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {buildScoreBasis(score, child)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>终评得分</div>
                            <input
                              type="number"
                              className="score-input-inline"
                              min={0}
                              max={child.maxScore}
                              step={1}
                              value={draftScores[child.code] ?? score.finalScore}
                              onChange={(event) =>
                                setDraftScores((prev) => ({
                                  ...prev,
                                  [child.code]: Math.min(
                                    child.maxScore,
                                    Math.max(0, normalizeScoreValue(event.target.value)),
                                  ),
                                }))
                              }
                              style={{ width: "100%" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setScoringCompanyId(null)}>
              关闭
            </button>
            <button type="button" className="btn btn-primary" onClick={saveScoringDetail}>
              保存修改
            </button>
          </div>
        </div>
      </div>

      <div className={`toast${toastMessage ? " show" : ""}`}>{toastMessage}</div>
    </div>
  );
}
