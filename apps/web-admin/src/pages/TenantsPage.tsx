import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { TenantView } from "../lib/api";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0
  }).format(value);
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantView[]>([]);

  async function load(): Promise<void> {
    if (!can("tenant:view")) {
      setTenants([]);
      return;
    }
    setTenants(await api.listTenants());
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  const enterpriseTenants = tenants.filter((t) => t.plan === "enterprise");
  const standardTenants = tenants.filter((t) => t.plan === "standard");
  const totalArr = tenants.reduce((sum, t) => sum + t.arr, 0);
  const avgHealth = tenants.length
    ? Math.round(tenants.reduce((sum, t) => sum + t.healthScore, 0) / tenants.length)
    : 0;
  const seatsUtilization = tenants.reduce((sum, t) => sum + (t.seatsUsed / t.seatsLimit), 0) / (tenants.length || 1);

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">客户总数</div>
          <div className="value">{tenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">企业版客户</div>
          <div className="value">{enterpriseTenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">标准版客户</div>
          <div className="value">{standardTenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">总 ARR</div>
          <div className="value">{formatCurrency(totalArr)}</div>
        </div>
        <div className="stat-card">
          <div className="label">平均健康分</div>
          <div className="value">{avgHealth}</div>
        </div>
        <div className="stat-card">
          <div className="label">平均席位使用率</div>
          <div className="value">{Math.round(seatsUtilization * 100)}%</div>
        </div>
      </div>
      <div className="card">
        <h3>客户 / 租户画像</h3>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 12px" }}>
          以下为平台内全部客户的基础画像，包含行业分类、套餐版本、健康分与合同信息。客户健康分用于驱动客户成功团队的预警与续签策略。
        </p>
        {tenants.length === 0 ? (
          <div className="empty">无权限或无客户数据</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>客户名称</th>
                <th>行业</th>
                <th>套餐</th>
                <th>健康分</th>
                <th>合同到期</th>
                <th>客户成功经理</th>
                <th>席位 (使用/上限)</th>
                <th>月活跃用户</th>
                <th>ARR</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong>{tenant.name}</strong>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{tenant.id}</div>
                  </td>
                  <td>{tenant.industry}</td>
                  <td><span className="badge">{tenant.plan}</span></td>
                  <td>
                    <span className={`health health-${tenant.healthScore >= 80 ? "good" : tenant.healthScore >= 70 ? "watch" : "risk"}`}>
                      {tenant.healthScore}
                    </span>
                  </td>
                  <td>{tenant.contractEndsAt}</td>
                  <td>{tenant.customerSuccessManager}</td>
                  <td>{tenant.seatsUsed} / {tenant.seatsLimit}</td>
                  <td>{tenant.monthlyActiveUsers}</td>
                  <td>{formatCurrency(tenant.arr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
