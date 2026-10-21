import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { PRE_ASSESSMENT_FLOW_STEPS, PRE_ASSESSMENT_STAGE_COUNT } from "./preAssessmentFlowSteps";

type PreAssessmentFlowStepperProps = {
  currentStep: number;
  progressStep?: number;
  archived?: boolean;
  onSelect?: (step: number) => void;
};

export function PreAssessmentFlowStepper({ currentStep, progressStep = currentStep, archived = false, onSelect }: PreAssessmentFlowStepperProps) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 md:px-7 md:py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">前评估流程</h3>
        <span className="text-xs font-medium text-muted-foreground">
          {`第 ${Math.min(currentStep, PRE_ASSESSMENT_STAGE_COUNT)} / ${PRE_ASSESSMENT_STAGE_COUNT} 步`}
        </span>
      </div>
      <div className="flex items-center justify-center gap-0 overflow-x-auto pb-1">
        {PRE_ASSESSMENT_FLOW_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCurrent = !archived && currentStep === step.id;
          const isCompleted = !isCurrent && (archived || progressStep > step.id);

          return (
            <div key={step.id} className="flex items-center shrink-0">
              <button type="button" disabled={!archived && ((progressStep === 1 && step.id !== 1) || (step.id === 8 && progressStep < 8))} onClick={() => onSelect?.(step.id)} aria-current={isCurrent ? "step" : undefined} className="flex flex-col items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
                    isCurrent && "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(230,0,50,0.24)]",
                    !isCurrent && !isCompleted && "border-[#e7ced8] bg-white text-[#d8b9c6]",
                    isCompleted && "border-emerald-200 bg-emerald-50 text-emerald-600",
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-medium",
                    isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < PRE_ASSESSMENT_FLOW_STEPS.length - 1 && (
                <div className="-mt-5 select-none px-3 text-base leading-none text-[#d8b9c6] md:px-5">
                  {">>"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
