import {
  ClipboardList,
  Search,
  GitCompare,
  Cpu,
  Shield,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type PreAssessmentFlowStep = {
  id: number;
  label: string;
  icon: LucideIcon;
};

export const PRE_ASSESSMENT_FLOW_STEPS: PreAssessmentFlowStep[] = [
  { id: 1, label: "选择待评估政策", icon: ClipboardList },
  { id: 2, label: "条款拆解", icon: Search },
  { id: 3, label: "一致性评估", icon: GitCompare },
  { id: 4, label: "落地性评估", icon: Cpu },
  { id: 5, label: "合规性评估", icon: Shield },
  { id: 6, label: "其他意见", icon: FileText },
];

export const PRE_ASSESSMENT_STAGE_COUNT = PRE_ASSESSMENT_FLOW_STEPS.length;

/** 评估阶段 0–4 对应流程第 2–6 步 */
export function assessmentStageToFlowStep(stage: number, finished: boolean) {
  if (finished) return PRE_ASSESSMENT_STAGE_COUNT;
  return Math.min(2 + stage, PRE_ASSESSMENT_STAGE_COUNT);
}
