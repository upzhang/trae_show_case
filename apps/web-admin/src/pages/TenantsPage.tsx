import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { SearchInput } from "../components/SearchInput";
import { FilterBar } from "../components/FilterBar";
import { ProgressBar } from "../components/ProgressBar";
import { StatusDot } from "../components/StatusDot";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";

import type { TenantView } from "../lib/api";

type PlanFilter = "all" | "enterprise" | "standard" | "startup";
type SortField = "name" | "healthScore" | "arr";
type SortOrder = "asc" | "desc";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0
  }).format(value);
}

function getHealthColor(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 70) return "yellow";
  return "red";
}

function getProgressColor(score: number): "green" | "orange" | "red" {
  if (score >= 80) return "green";
  if (score >= 70) return "orange";
  return "red";
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "good";
  if (score >= 70) return "watch";
  return "risk";
}

function getSubscriptionVariant(status?: string): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "active": return "success";
    case "trial": return "info";
    case "past_due": return "warning";
    case "canceled":
    case "cancelled":
    case "expired": return "danger";
    default: return "default";
  }
}

function getSubscriptionLabel(status?: string): string {
  switch (status) {
    case "active": return "活跃";
    case "trial": return "试用中";
    case "past_due": return "逾期";
    case "canceled":
    case "cancelled": return "已取消";
    case "expired": return "已过期";
    default: return status ?? "未知";
  }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedTenant, setSelectedTenant] = useState<TenantView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    if (!can("tenant:view")) {
      setTenants([]);
      setLoading(false);
      return;
    }
    try {
      setTenants(await api.listTenants());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // 筛选 + 搜索 + 排序
  const filteredTenants = useMemo(() => {
    let result = [...tenants];

    // 搜索
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.industry.toLowerCase().includes(q) ||
          t.customerSuccessManager.toLowerCase().includes(q)
      );
    }

    // 套餐筛选
    if (planFilter !== "all") {
      result = result.filter((t) => t.plan === planFilter);
    }

    // 排序
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "healthScore") {
        cmp = a.healthScore - b.healthScore;
      } else if (sortField === "arr") {
        cmp = a.arr - b.arr;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tenants, search, planFilter, sortField, sortOrder]);

  const enterpriseTenants = tenants.filter((t) => t.plan === "enterprise");
  const standardTenants = tenants.filter((t) => t.plan === "standard");
  const totalArr = tenants.reduce((sum, t) => sum + t.arr, 0);
  const avgHealth = tenants.length
    ? Math.round(tenants.reduce((sum, t) => sum + t.healthScore, 0) / tenants.length)
    : 0;
  const seatsUtilization =
    tenants.reduce((sum, t) => sum + t.seatsUsed / t.seatsLimit, 0) /
    (tenants.length || 1);

  function handleSort(field: SortField): void {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  function openDetail(tenant: TenantView): void {
    setSelectedTenant(tenant);
    setDetailOpen(true);
  }

  function closeDetail(): void {
    setDetailOpen(false);
    setSelectedTenant(null);
  }

  const sortIcon = (field: SortField): string => {
    if (sortField !== field) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  return (
    <>
      <PageHeader
        title="客户 / 租户管理"
        description="管理平台内所有客户租户，查看健康分、订阅状态、席位使用与合同信息"
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon="refresh"
            onClick={() => { load(); }}
            disabled={loading}
          >
            刷新
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard
          title="客户总数"
          value={tenants.length}
          icon="user"
          color="blue"
        />
        <StatCard
          title="企业版客户"
          value={enterpriseTenants.length}
          icon="star"
          color="purple"
        />
        <StatCard
          title="标准版客户"
          value={standardTenants.length}
          icon="chart"
          color="green"
        />
        <StatCard
          title="总 ARR"
          value={formatCurrency(totalArr)}
          icon="download"
          color="orange"
        />
        <StatCard
          title="平均健康分"
          value={avgHealth}
          icon="heart"
          color={avgHealth >= 80 ? "green" : avgHealth >= 70 ? "orange" : "red"}
        />
        <StatCard
          title="平均席位使用率"
          value={`${Math.round(seatsUtilization * 100)}%`}
          icon="chart"
          color="blue"
        />
      </div>

      {/* 搜索与筛选 */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索客户名称、行业、CSM..."
          />
          <FilterBar
            filters={[
              {
                key: "plan",
                label: "全部套餐",
                options: [
                  { label: "全部", value: "all" },
                  { label: "企业版", value: "enterprise" },
                  { label: "标准版", value: "standard" },
                  { label: "初创版", value: "startup" }
                ],
                value: planFilter,
                onChange: (v) => setPlanFilter(v as PlanFilter)
              }
            ]}
            onReset={() => {
              setSearch("");
              setPlanFilter("all");
            }}
          />
        </div>
      </div>

      {/* 客户列表 */}
      <div className="card">
        <h3>客户 / 租户画像</h3>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 12px" }}>
          以下为平台内全部客户的基础画像，包含行业分类、套餐版本、健康分与合同信息。客户健康分用于驱动客户成功团队的预警与续签策略。
        </p>
        {loading ? (
          <div className="table-loading">
            <Spinner size={32} />
            <span>加载中...</span>
          </div>
        ) : filteredTenants.length === 0 ? (
          <EmptyState
            icon="search"
            title={tenants.length === 0 ? "无权限或无客户数据" : "未找到匹配的客户"}
            description={tenants.length === 0 ? undefined : "尝试调整搜索条件或筛选器"}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th
                  className="table-th-sortable"
                  onClick={() => handleSort("name")}
                >
                  <span className="table-th-content">
                    客户名称{sortIcon("name")}
                  </span>
                </th>
                <th>行业</th>
                <th>套餐</th>
                <th
                  className="table-th-sortable"
                  onClick={() => handleSort("healthScore")}
                >
                  <span className="table-th-content">
                    健康分{sortIcon("healthScore")}
                  </span>
                </th>
                <th>合同到期</th>
                <th>客户成功经理</th>
                <th>席位 (使用/上限)</th>
                <th>月活跃用户</th>
                <th
                  className="table-th-sortable"
                  onClick={() => handleSort("arr")}
                >
                  <span className="table-th-content">
                    ARR{sortIcon("arr")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="table-row-clickable"
                  onClick={() => openDetail(tenant)}
                >
                  <td>
                    <strong>{tenant.name}</strong>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{tenant.id}</div>
                  </td>
                  <td>{tenant.industry}</td>
                  <td>
                    <Badge
                      variant={tenant.plan === "enterprise" ? "info" : "default"}
                      size="sm"
                    >
                      {tenant.plan === "enterprise" ? "企业版" : "标准版"}
                    </Badge>
                  </td>
                  <td>
                    <span
                      className={`health health-${getHealthLabel(tenant.healthScore)}`}
                    >
                      {tenant.healthScore}
                    </span>
                  </td>
                  <td>{tenant.contractEndsAt}</td>
                  <td>{tenant.customerSuccessManager}</td>
                  <td>
                    {tenant.seatsUsed} / {tenant.seatsLimit}
                    <ProgressBar
                      value={tenant.seatsUsed}
                      max={tenant.seatsLimit}
                      color={
                        tenant.seatsUsed / tenant.seatsLimit > 0.9
                          ? "red"
                          : tenant.seatsUsed / tenant.seatsLimit > 0.7
                            ? "orange"
                            : "green"
                      }
                      size="sm"
                    />
                  </td>
                  <td>{tenant.monthlyActiveUsers}</td>
                  <td>{formatCurrency(tenant.arr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 租户详情 Modal */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={selectedTenant ? `客户详情 — ${selectedTenant.name}` : ""}
        size="lg"
      >
        {selectedTenant && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 基本信息 */}
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">客户 ID</span>
                <span className="detail-value">{selectedTenant.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">行业</span>
                <span className="detail-value">{selectedTenant.industry}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">套餐</span>
                <span className="detail-value">
                  <Badge variant={selectedTenant.plan === "enterprise" ? "info" : "default"}>
                    {selectedTenant.plan === "enterprise" ? "企业版" : "标准版"}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">订阅状态</span>
                <span className="detail-value">
                  <Badge variant={getSubscriptionVariant(selectedTenant.subscriptionStatus)}>
                    {getSubscriptionLabel(selectedTenant.subscriptionStatus)}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">客户成功经理</span>
                <span className="detail-value">{selectedTenant.customerSuccessManager}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">合同到期</span>
                <span className="detail-value">{selectedTenant.contractEndsAt}</span>
              </div>
            </div>

            {/* 健康分详情 */}
            <div className="card">
              <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>健康分详情</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <ProgressBar
                    value={selectedTenant.healthScore}
                    max={100}
                    color={getProgressColor(selectedTenant.healthScore)}
                    size="lg"
                    showLabel
                  />
                </div>
                <span
                  className={`health health-${getHealthLabel(selectedTenant.healthScore)}`}
                  style={{ fontSize: 18, padding: "4px 16px" }}
                >
                  {selectedTenant.healthScore}/100
                </span>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 13, color: "#6b7280" }}>
                <span>
                  <StatusDot color={getHealthColor(selectedTenant.healthScore)} />{" "}
                  {selectedTenant.healthScore >= 80
                    ? "健康"
                    : selectedTenant.healthScore >= 70
                      ? "需关注"
                      : "风险"}
                </span>
              </div>
            </div>

            {/* 席位与活跃 */}
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">席位使用</span>
                <span className="detail-value">
                  {selectedTenant.seatsUsed} / {selectedTenant.seatsLimit}
                </span>
                <ProgressBar
                  value={selectedTenant.seatsUsed}
                  max={selectedTenant.seatsLimit}
                  color={
                    selectedTenant.seatsUsed / selectedTenant.seatsLimit > 0.9
                      ? "red"
                      : selectedTenant.seatsUsed / selectedTenant.seatsLimit > 0.7
                        ? "orange"
                        : "green"
                  }
                  size="sm"
                />
              </div>
              <div className="detail-item">
                <span className="detail-label">月活跃用户</span>
                <span className="detail-value">{selectedTenant.monthlyActiveUsers}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ARR</span>
                <span className="detail-value" style={{ fontWeight: 600, fontSize: 16 }}>
                  {formatCurrency(selectedTenant.arr)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">成员数</span>
                <span className="detail-value">{selectedTenant.seatsUsed}</span>
              </div>
            </div>

            {/* 风险信息 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>风险提示</h4>
              {selectedTenant.healthScore < 70 && (
                <div className="alert alert-warning" style={{ marginBottom: 8 }}>
                  <span className="alert-content">
                    <span className="alert-title">健康分偏低</span>
                    <span className="alert-message">该客户健康分低于 70，建议客户成功团队主动跟进</span>
                  </span>
                </div>
              )}
              {selectedTenant.seatsUsed / selectedTenant.seatsLimit > 0.9 && (
                <div className="alert alert-warning" style={{ marginBottom: 8 }}>
                  <span className="alert-content">
                    <span className="alert-title">席位即将用尽</span>
                    <span className="alert-message">
                      已使用 {selectedTenant.seatsUsed}/{selectedTenant.seatsLimit} 席位，使用率{" "}
                      {Math.round((selectedTenant.seatsUsed / selectedTenant.seatsLimit) * 100)}%
                    </span>
                  </span>
                </div>
              )}
              {selectedTenant.subscriptionStatus === "past_due" && (
                <div className="alert alert-error">
                  <span className="alert-content">
                    <span className="alert-title">订阅逾期</span>
                    <span className="alert-message">该客户订阅已逾期，可能影响服务使用</span>
                  </span>
                </div>
              )}
              {selectedTenant.healthScore >= 70 &&
                selectedTenant.seatsUsed / selectedTenant.seatsLimit <= 0.9 &&
                selectedTenant.subscriptionStatus !== "past_due" && (
                  <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                    当前未检测到明显风险
                  </p>
                )}
            </div>

            {/* 最近活动占位 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>最近活动</h4>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                客户创建于平台，持续活跃中。更多活动详情请查看活动流页面。
              </p>
            </div>
          </div>
        )}
        <div className="modal-footer" style={{ padding: "12px 0 0", borderTop: "1px solid #e5e7eb", marginTop: 16 }}>
          <Button variant="ghost" onClick={closeDetail}>
            关闭
          </Button>
        </div>
      </Modal>
    </>
  );
}
