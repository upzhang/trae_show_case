import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { SupportRiskView, TenantView } from "../lib/api";

const severityLabel: Record<SupportRiskView["severity"], string> = {
  critical: "P0 严重",
  high: "P1 高",
  medium: "P2 中",
  low: "P3 低"
};

const statusLabel: Record<SupportRiskView["status"], string> = {
  open: "待处理",
  in_progress: "处理中",
  waiting_customer: "待客户",
  resolved: "已解决"
};

const categoryLabel: Record<string, string> = {
  support: "技术支持",
  security: "安全",
  adoption: "客户采用",
  billing: "账单",
  release: "发布相关"
};

export default function SupportRisksPage() {
  const [risks, setRisks] = useState<SupportRiskView[]>([]);
  const [tenants, setTenants] = useState<TenantView[]>([]);

  async function load(): Promise<void> {
    if (!can("tenant:view")) {
      setRisks([]);
      setTenants([]);
      return;
    }
    const [riskRows, tenantRows] = await Promise.all([
      api.listSupportRisks(),
      api.listTenants()
    ]);
    setRisks(riskRows);
    setTenants(tenantRows);
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  const tenantNameById = new Map(tenants.map((tenant) => [tenant.id, tenant.name]));

  const openRisks = risks.filter((item) => item.status !== "resolved");
  const criticalRisks = risks.filter((item) => item.severity === "critical");

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">风险工单数</div>
          <div className="value">{risks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">未解决</div>
          <div className="value">{openRisks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">P0 严重</div>
          <div className="value">{criticalRisks.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">SLA 达标率</div>
          <div className="value">{risks.length ? `${Math.round(((risks.length - criticalRisks.length) / risks.length) * 100)}%` : "—"}</div>
        </div>
      </div>
      <div className="card">
        <h3>风险与工单队列</h3>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 12px" }}>
          运营平台记录的客户报告与内部风险事件，工单状态、严重级别与 SLA 驱动响应策略。
        </p>
        {risks.length === 0 ? (
          <div className="empty">无权限或暂无风险工单</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>工单编号</th>
                <th>标题</th>
                <th>客户</th>
                <th>类别</th>
                <th>严重级别</th>
                <th>状态</th>
                <th>SLA 到期时间</th>
                <th>负责人</th>
                <th>影响面</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr key={risk.id}>
                  <td>{risk.id}</td>
                  <td>{risk.title}</td>
                  <td>{tenantNameById.get(risk.tenantId) ?? risk.tenantId}</td>
                  <td>{categoryLabel[risk.category] ?? risk.category}</td>
                  <td><span className={`badge severity-${risk.severity}`}>{severityLabel[risk.severity]}</span></td>
                  <td>{statusLabel[risk.status]}</td>
                  <td>{risk.slaDueAt}</td>
                  <td>{risk.ownerId}</td>
                  <td>{risk.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
