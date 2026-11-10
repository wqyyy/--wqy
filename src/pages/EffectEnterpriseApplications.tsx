import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { EffectDetailDrawer } from "@/components/EffectDetailDrawer";
import type { DrillDetail } from "@/lib/effectDrilldown";
import { EnterpriseApplicationRecords } from "@/components/EnterpriseApplicationRecords";

export default function EffectEnterpriseApplications() {
  const { creditCode } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<DrillDetail | null>(null);
  const back = () => {
    if (window.history.length > 1) { navigate(-1); return; }
    window.close();
    if (!window.closed) navigate("/effect-dashboard?focus=publish", { replace: true });
  };
  return <><EnterpriseApplicationRecords creditCode={creditCode} onBack={back} onOpenItem={name => setDetail({ title: "政策事项明细", dimension: "范围", rows: [], kind: "item", nameFilter: name })} onOpenPolicy={name => setDetail({ title: "政策文件明细", dimension: "范围", rows: [], kind: "policy", nameFilter: name })} /><EffectDetailDrawer key={detail ? `${detail.kind}-${detail.nameFilter}` : "closed"} detail={detail} onClose={() => setDetail(null)} /></>;
}
