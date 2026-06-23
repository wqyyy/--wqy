import { useNavigate } from "react-router-dom";
import { PolicyReportFlow } from "@/components/policy-report/PolicyReportFlow";

const PolicyReport = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-hidden p-5 md:p-6">
      <div className="mx-auto flex h-full max-w-[1400px] flex-col">
        <PolicyReportFlow onBack={() => navigate("/dashboard")} />
      </div>
    </div>
  );
};

export default PolicyReport;
