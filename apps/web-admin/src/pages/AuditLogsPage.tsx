import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { SearchInput } from "../components/SearchInput";
import { DateRangePicker } from "../components/DateRangePicker";
import { Pagination } from "../components/Pagination";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Icon } from "../components/Icon";

import type { AuditLogView } from "../lib/api";

const actionTypes = ["全部", "创建", "更新", "删除", "登录", "导出"] as const;
const actionMap: Record<string, string> = {
  "创建": "create",
  "更新": "update",
  "删除": "delete",
  "登录": "login",
  "导出": "export",
};

const actionBadgeVariant: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  create: "success",
  update: "info",
  delete: "danger",
  login: "default",
  export: "warning",
};

const actionLabel: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
  login: "登录",
  export: "导出",
};

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function AuditLogsPage() {
  const [list, setList] = useState<AuditLogView[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("全部");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: getWeekRange().start,
    end: getToday(),
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogView | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    if (!can("audit:view")) {
      setList([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.listAuditLogs();
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  // Filtering
  const filtered = useMemo(() => {
    let result = [...list];

    // Action filter
    if (actionFilter !== "全部") {
      const mapped = actionMap[actionFilter];
      result = result.filter((item) => item.action === mapped);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end + "T23:59:59.999Z");
      result = result.filter((item) => {
        const d = new Date(item.createdAt);
        return d >= startDate && d <= endDate;
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.actorId.toLowerCase().includes(q) ||
          (item.summary && item.summary.toLowerCase().includes(q)) ||
          item.action.toLowerCase().includes(q)
      );
    }

    return result;
  }, [list, actionFilter, dateRange, search]);

  // Stats
  const today = getToday();
  const todayLogs = list.filter((item) => item.createdAt.startsWith(today));
  const weekRange = getWeekRange();
  const weekLogs = list.filter((item) => {
    const d = new Date(item.createdAt);
    return d >= new Date(weekRange.start) && d <= new Date(weekRange.end + "T23:59:59.999Z");
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleExport() {
    const csv = [
      "时间,动作,操作者,摘要,租户ID",
      ...filtered.map(
        (item) =>
          `${item.createdAt},${item.action},${item.actorId},"${item.summary || ""}",${item.tenantId}`
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleResetFilters() {
    setSearch("");
    setActionFilter("全部");
    setDateRange({ start: getWeekRange().start, end: getToday() });
    setPage(1);
  }

  function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <>
      <PageHeader
        title="审计日志"
        description="记录平台所有操作行为，支持按操作类型、时间范围和关键字检索"
        actions={
          <div className="page-header-actions">
            <Button variant="secondary" size="sm" icon="refresh" onClick={load}>
              刷新
            </Button>
            <Button variant="primary" size="sm" icon="download" onClick={handleExport}>
              导出 CSV
            </Button>
          </div>
        }
      />

      <div className="stat-grid">
        <StatCard
          title="今日日志数"
          value={todayLogs.length}
          icon="clock"
          color="blue"
        />
        <StatCard
          title="本周日志数"
          value={weekLogs.length}
          icon="calendar"
          color="green"
        />
        <StatCard
          title="总日志数"
          value={list.length}
          icon="chart"
          color="purple"
        />
        <StatCard
          title="筛选结果"
          value={filtered.length}
          icon="filter"
          color="orange"
        />
      </div>

      <div className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <SearchInput
              placeholder="按操作者、摘要搜索..."
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
            />
            <select
              className="filter-select"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              {actionTypes.map((t) => (
                <option key={t} value={t}>
                  {t === "全部" ? "全部操作类型" : t}
                </option>
              ))}
            </select>
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range);
                setPage(1);
              }}
            />
            {(search || actionFilter !== "全部") && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                重置筛选
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">无权限或无匹配日志</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作类型</th>
                  <th>操作者</th>
                  <th>摘要</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <Badge
                        variant={actionBadgeVariant[item.action] || "default"}
                        size="sm"
                      >
                        {actionLabel[item.action] || item.action}
                      </Badge>
                    </td>
                    <td>{item.actorId}</td>
                    <td>{item.summary || "—"}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="eye"
                        onClick={() => setSelectedLog(item)}
                      >
                        详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16 }}>
              <Pagination
                current={page}
                total={filtered.length}
                pageSize={pageSize}
                onChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="日志详情"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedLog(null)}>
            关闭
          </Button>
        }
      >
        {selectedLog && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">日志 ID</span>
                <span className="detail-value">{selectedLog.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">操作时间</span>
                <span className="detail-value">
                  {formatDateTime(selectedLog.createdAt)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">操作类型</span>
                <span className="detail-value">
                  <Badge
                    variant={actionBadgeVariant[selectedLog.action] || "default"}
                    size="sm"
                  >
                    {actionLabel[selectedLog.action] || selectedLog.action}
                  </Badge>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">操作者</span>
                <span className="detail-value">{selectedLog.actorId}</span>
              </div>
              <div className="detail-item detail-full">
                <span className="detail-label">摘要</span>
                <span className="detail-value">
                  {selectedLog.summary || "（无摘要）"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">租户 ID</span>
                <span className="detail-value">{selectedLog.tenantId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">操作动作</span>
                <span className="detail-value">
                  <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                    {selectedLog.action}
                  </code>
                </span>
              </div>
            </div>

            <hr className="divider divider-horizontal" />

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>变更对比</h4>
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontFamily: "monospace",
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                <div style={{ color: "#6b7280", marginBottom: 4 }}>
                  --- 操作前
                </div>
                <div style={{ color: "#dc2626", marginBottom: 8 }}>
                  - 状态: 待处理
                </div>
                <div style={{ color: "#6b7280", marginBottom: 4 }}>
                  +++ 操作后
                </div>
                <div style={{ color: "#16a34a" }}>
                  + 状态: {selectedLog.action === "create" ? "已创建" : selectedLog.action === "delete" ? "已删除" : "已更新"}
                </div>
                <div style={{ color: "#16a34a" }}>
                  + 操作者: {selectedLog.actorId}
                </div>
                <div style={{ color: "#16a34a" }}>
                  + 时间: {formatDateTime(selectedLog.createdAt)}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>完整元数据</h4>
              <div
                style={{
                  background: "#1f2937",
                  color: "#e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  fontFamily: "monospace",
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  maxHeight: 200,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(
                  {
                    id: selectedLog.id,
                    tenantId: selectedLog.tenantId,
                    actorId: selectedLog.actorId,
                    action: selectedLog.action,
                    summary: selectedLog.summary,
                    createdAt: selectedLog.createdAt,
                  },
                  null,
                  2
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
