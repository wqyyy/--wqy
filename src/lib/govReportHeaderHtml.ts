/** 机关公文预览：红头 + 双红线 + 标题（与页面内 GovRedHeaderBlock 视觉一致） */

export const GOV_ISSUING_AUTHORITY_DEFAULT = "北京经济技术开发区营商环境建设局";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildGovReportPreviewHtml(options: {
  documentTitle: string;
  bodyText: string;
  windowTitle?: string;
  issuingAuthority?: string;
}): string {
  const org = escapeHtml(options.issuingAuthority ?? GOV_ISSUING_AUTHORITY_DEFAULT);
  const title = escapeHtml(options.documentTitle);
  const body = escapeHtml(options.bodyText);
  const wtitle = escapeHtml(options.windowTitle ?? "报告预览");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${wtitle}</title>
<style>
  *{box-sizing:border-box;}
  body{margin:0;padding:32px 28px 48px;line-height:1.85;color:#111827;background:#fff;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",SimSun,serif;}
  .page{max-width:960px;margin:0 auto;}
  .red-head{text-align:center;padding:8px 12px 20px;}
  .org{color:#c40018;font-size:clamp(24px,4.8vw,32px);font-weight:700;letter-spacing:0.08em;font-family:SimSun,"Noto Serif SC","Songti SC",serif;}
  .lines{max-width:min(720px,100%);margin:12px auto 0;display:flex;flex-direction:column;gap:3px;}
  .lines .thick{height:4px;background:#c40018;}
  .lines .thin{height:1px;background:#c40018;}
  .doc-title{margin:18px auto 0;max-width:min(920px,100%);font-size:clamp(16px,2.4vw,18px);font-weight:700;line-height:1.55;color:#111827;}
  .body{margin-top:28px;white-space:pre-wrap;font-size:15px;color:#374151;text-align:left;}
</style></head><body>
  <div class="page">
    <div class="red-head">
      <div class="org">${org}</div>
      <div class="lines"><div class="thick"></div><div class="thin"></div></div>
      <div class="doc-title">${title}</div>
    </div>
    <div class="body">${body}</div>
  </div>
</body></html>`;
}
