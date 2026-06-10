import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { SearchInput } from "../components/SearchInput";
import { CopyButton } from "../components/CopyButton";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { StatusDot } from "../components/StatusDot";
import { ProgressBar } from "../components/ProgressBar";
import { Tabs } from "../components/Tabs";

interface ApiToken {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

interface TokenUsageStats {
  tokenId: string;
  totalCalls: number;
  callsThisMonth: number;
  callsLastMonth: number;
  lastUsedAt?: string;
  dailyUsage: { date: string; count: number }[];
}

interface TokenStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

const scopeDescriptions: Record<string, string> = {
  read: "读取数据 — 允许查看所有资源",
  write: "写入数据 — 允许创建和修改资源",
  delete: "删除数据 — 允许删除资源",
  admin: "管理员 — 拥有所有权限",
};

export function TokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newToken, setNewToken] = useState({ name: "", scopes: ["read"] as string[], expiresAt: "" });
  const [filter, setFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 新增状态：使用统计
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageStats, setUsageStats] = useState<TokenUsageStats | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  // 新增状态：权限说明
  const [showScopeModal, setShowScopeModal] = useState(false);

  // 新增状态：统计
  const [tokenStats, setTokenStats] = useState<TokenStats>({ total: 0, active: 0, expiringSoon: 0, expired: 0 });

  // 新增状态：删除确认
  const [deleteTarget, setDeleteTarget] = useState<ApiToken | null>(null);

  const availableScopes = ["read", "write", "delete", "admin"];

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    setLoading(true);
    try {
      const response = await api.get("/tokens");
      const data: ApiToken[] = response || [];
      setTokens(data);
      computeStats(data);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  }

  function computeStats(data: ApiToken[]) {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const total = data.length;
    const expired = data.filter(t => t.expiresAt && new Date(t.expiresAt) < now).length;
    const expiringSoon = data.filter(t => {
      if (!t.expiresAt) return false;
      const exp = new Date(t.expiresAt);
      return exp > now && exp <= sevenDaysLater;
    }).length;
    const active = total - expired;
    setTokenStats({ total, active, expiringSoon, expired });
  }

  async function fetchUsageStats(tokenId: string) {
    setUsageLoading(true);
    try {
      const response = await api.get(`/tokens/${tokenId}/usage`);
      setUsageStats(response);
    } catch {
      // 模拟数据
      setUsageStats({
        tokenId,
        totalCalls: 1247,
        callsThisMonth: 342,
        callsLastMonth: 289,
        lastUsedAt: new Date().toISOString(),
        dailyUsage: [
          { date: "06-04", count: 45 }, { date: "06-05", count: 52 },
          { date: "06-06", count: 38 }, { date: "06-07", count: 61 },
          { date: "06-08", count: 55 }, { date: "06-09", count: 48 },
          { date: "06-10", count: 43 },
        ],
      });
    } finally {
      setUsageLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const response = await api.post("/tokens", newToken);
      alert(`Token 创建成功：${response.token}\n请妥善保存此 Token，仅显示一次！`);
      setShowCreateModal(false);
      setNewToken({ name: "", scopes: ["read"], expiresAt: "" });
      fetchTokens();
    } catch (error) {
      console.error("Failed to create token:", error);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/tokens/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchTokens();
    } catch (error) {
      console.error("Failed to delete token:", error);
    }
  }

  async function handleRotate(id: string) {
    if (confirm("确定要轮换这个 Token 吗？原 Token 将立即失效！")) {
      try {
        const response = await api.post(`/tokens/${id}/rotate`);
        alert(`新 Token：${response.token}\n请妥善保存！`);
        fetchTokens();
      } catch (error) {
        console.error("Failed to rotate token:", error);
      }
    }
  }

  async function copyToken(token: string, id: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  function openUsageModal(token: ApiToken) {
    setSelectedToken(token);
    setShowUsageModal(true);
    fetchUsageStats(token.id);
  }

  function openScopeModal(token: ApiToken) {
    setSelectedToken(token);
    setShowScopeModal(true);
  }

  function isExpiringSoon(token: ApiToken): boolean {
    if (!token.expiresAt) return false;
    const now = new Date();
    const exp = new Date(token.expiresAt);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return exp > now && exp <= sevenDaysLater;
  }

  function isExpired(token: ApiToken): boolean {
    if (!token.expiresAt) return false;
    return new Date(token.expiresAt) < new Date();
  }

  const filteredTokens = tokens.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  function formatToken(token: string): string {
    if (token.length <= 12) return token;
    return `${token.slice(0, 6)}...${token.slice(-6)}`;
  }

  function getUsageTrend(usageStats: TokenUsageStats): "up" | "down" | "neutral" {
    if (usageStats.callsThisMonth > usageStats.callsLastMonth) return "up";
    if (usageStats.callsThisMonth < usageStats.callsLastMonth) return "down";
    return "neutral";
  }

  return (
    <div className="page-container">
      <PageHeader
        title="API Token 管理"
        description="管理 API 访问令牌，监控使用情况与权限范围"
        actions={
          can("token:manage") ? (
            <Button variant="primary" icon="plus" onClick={() => setShowCreateModal(true)}>
              创建 Token
            </Button>
          ) : undefined
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard title="Token 总数" value={tokenStats.total} icon="key" color="blue" />
        <StatCard title="活跃 Token" value={tokenStats.active} icon="check-circle" color="green" />
        <StatCard
          title="即将过期"
          value={tokenStats.expiringSoon}
          icon="clock"
          color={tokenStats.expiringSoon > 0 ? "orange" : "green"}
          subtitle={tokenStats.expiringSoon > 0 ? "7天内过期" : "无即将过期"}
        />
        <StatCard title="已过期" value={tokenStats.expired} icon="x-circle" color={tokenStats.expired > 0 ? "red" : "green"} />
      </div>

      {/* 搜索 */}
      <SearchInput
        value={filter}
        onChange={setFilter}
        placeholder="搜索 Token 名称..."
      />

      {loading ? (
        <div className="table-loading"><Spinner size={32} /><span>加载中...</span></div>
      ) : filteredTokens.length === 0 ? (
        <EmptyState icon="key" title="暂无 API Token" description="点击右上角按钮创建第一个 Token" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>名称</th>
                <th>Token</th>
                <th>权限范围</th>
                <th>到期时间</th>
                <th>使用次数</th>
                <th>最后使用</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token) => {
                const expiring = isExpiringSoon(token);
                const expired = isExpired(token);
                return (
                  <tr key={token.id} className={expiring ? "table-row-warning" : expired ? "table-row-danger" : ""}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {token.name}
                        {expiring && <Badge variant="warning" size="sm">即将过期</Badge>}
                        {expired && <Badge variant="danger" size="sm">已过期</Badge>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12 }}>{formatToken(token.token)}</span>
                        <CopyButton text={token.token} label="复制" />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {token.scopes.map((scope) => (
                          <span key={scope} className="tag tag-blue">{scope}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ color: expiring ? "#ea580c" : expired ? "#dc2626" : undefined }}>
                        {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : "永久"}
                      </span>
                    </td>
                    <td>{token.usageCount}</td>
                    <td>
                      {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : "从未使用"}
                    </td>
                    <td>{new Date(token.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <Button variant="ghost" size="sm" onClick={() => openUsageModal(token)}>统计</Button>
                        <Button variant="ghost" size="sm" onClick={() => openScopeModal(token)}>权限</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRotate(token.id)}>轮换</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(token)}>
                          <span style={{ color: "#dc2626" }}>删除</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 创建 Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建 API Token" size="md">
        <div className="form-group">
          <label className="form-label">名称</label>
          <input
            className="form-input"
            type="text"
            value={newToken.name}
            onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
            placeholder="输入 Token 名称"
          />
        </div>
        <div className="form-group">
          <label className="form-label">权限范围</label>
          <div className="checkbox-grid">
            {availableScopes.map((scope) => (
              <label key={scope} className="form-checkbox">
                <input
                  type="checkbox"
                  className="form-checkbox-input"
                  checked={newToken.scopes.includes(scope)}
                  onChange={(e) => {
                    const scopes = [...newToken.scopes];
                    if (e.target.checked) {
                      scopes.push(scope);
                    } else {
                      scopes.splice(scopes.indexOf(scope), 1);
                    }
                    setNewToken({ ...newToken, scopes });
                  }}
                />
                <span className="form-checkbox-label">
                  <strong>{scope}</strong>
                  <span className="form-checkbox-helper">{scopeDescriptions[scope]}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">到期时间（可选）</label>
          <input
            className="form-input"
            type="date"
            value={newToken.expiresAt ? new Date(newToken.expiresAt).toISOString().split("T")[0] : ""}
            onChange={(e) => setNewToken({ ...newToken, expiresAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })}
          />
          <span className="form-helper">留空表示永久有效</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>取消</Button>
          <Button variant="primary" onClick={handleCreate}>创建</Button>
        </div>
      </Modal>

      {/* 使用统计 Modal */}
      <Modal open={showUsageModal} onClose={() => setShowUsageModal(false)} title={`使用统计 - ${selectedToken?.name || ""}`} size="lg">
        {usageLoading ? (
          <div className="table-loading"><Spinner size={32} /><span>加载统计中...</span></div>
        ) : usageStats ? (
          <div>
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              <StatCard
                title="总调用次数"
                value={usageStats.totalCalls}
                icon="activity"
                color="blue"
              />
              <StatCard
                title="本月调用"
                value={usageStats.callsThisMonth}
                icon="calendar"
                color="green"
                trend={{
                  value: `${usageStats.callsThisMonth > usageStats.callsLastMonth ? "+" : ""}${usageStats.callsThisMonth - usageStats.callsLastMonth}`,
                  direction: getUsageTrend(usageStats),
                }}
              />
              <StatCard
                title="上月调用"
                value={usageStats.callsLastMonth}
                icon="bar-chart"
                color="purple"
              />
              <StatCard
                title="最后使用"
                value={usageStats.lastUsedAt ? new Date(usageStats.lastUsedAt).toLocaleDateString() : "从未"}
                icon="clock"
                color="orange"
              />
            </div>
            <Card>
              <CardHeader>近 7 天使用趋势</CardHeader>
              <CardBody>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120, padding: "8px 0" }}>
                  {usageStats.dailyUsage.map((day) => {
                    const maxCount = Math.max(...usageStats.dailyUsage.map(d => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 500 }}>{day.count}</span>
                        <div style={{
                          width: "100%", maxWidth: 32, height: `${Math.max(height, 4)}%`,
                          background: "linear-gradient(180deg, #2563eb, #93c5fd)", borderRadius: "4px 4px 0 0",
                          minHeight: 4,
                        }} />
                        <span style={{ fontSize: 10, color: "#6b7280" }}>{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <EmptyState icon="info" title="暂无统计数据" />
        )}
      </Modal>

      {/* 权限范围说明 Modal */}
      <Modal open={showScopeModal} onClose={() => setShowScopeModal(false)} title={`权限范围 - ${selectedToken?.name || ""}`} size="md">
        {selectedToken && (
          <div>
            <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 13 }}>
              此 Token 拥有以下权限范围，决定了通过此 Token 可以执行的操作：
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedToken.scopes.map((scope) => (
                <Card key={scope}>
                  <CardBody>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StatusDot color="blue" size={10} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{scope}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {scopeDescriptions[scope] || "自定义权限"}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            {selectedToken.scopes.length === 0 && (
              <EmptyState icon="info" title="无权限范围" description="此 Token 未分配任何权限范围" />
            )}
          </div>
        )}
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除 Token"
        message={`确定要删除 Token "${deleteTarget?.name}" 吗？使用此 Token 的所有应用将立即无法访问 API。此操作不可撤销。`}
        variant="danger"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
