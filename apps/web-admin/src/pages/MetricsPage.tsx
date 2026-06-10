import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { StatCard } from "../components/StatCard";
import { Card, CardHeader, CardBody } from "../components/Card";
import { BarChart } from "../components/BarChart";
import { LineChart } from "../components/LineChart";
import { DonutChart } from "../components/DonutChart";
import { ChartContainer } from "../components/ChartContainer";
import { Badge } from "../components/Badge";
import { ProgressBar } from "../components/ProgressBar";
import { Spinner } from "../components/Spinner";
import { Alert } from "../components/Alert";
import { PageHeader } from "../components/PageHeader";

interface MetricsOverview {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalApprovals: number;
  approvalRate: number;
  totalReleases: number;
  releaseSuccessRate: number;
  totalTickets: number;
  openTickets: number;
  totalRisks: number;
  criticalRisks: number;
  mrr: number;
  mrrGrowth: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
}

interface TrendDataPoint {
  date: string;
  value: number;
}

interface HealthDistribution {
  good: number;
  watch: number;
  risk: number;
}

interface ReleaseStats {
  total: number;
  deployed: number;
  rolledBack: number;
  pending: number;
  byEnvironment: Record<string, number>;
}

interface ApprovalStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  avgResponseHours: number;
}

export function MetricsPage() {
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [health, setHealth] = useState<HealthDistribution | null>(null);
  const [releaseStats, setReleaseStats] = useState<ReleaseStats | null>(null);
  const [approvalStats, setApprovalStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [ov, tr, hl, rs, as] = await Promise.all([
          api.get<MetricsOverview>("/api/metrics/overview"),
          api.get<TrendDataPoint[]>("/api/metrics/trends?range=30d"),
          api.get<HealthDistribution>("/api/metrics/health"),
          api.get<ReleaseStats>("/api/metrics/releases"),
          api.get<ApprovalStats>("/api/metrics/approvals"),
        ]);
        setOverview(ov);
        setTrends(tr);
        setHealth(hl);
        setReleaseStats(rs);
        setApprovalStats(as);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title="加载失败">{error}</Alert>;
  }

  if (!overview) return null;

  const trendCategories = trends.map((t) => t.date.slice(5));
  const trendData = trends.map((t) => t.value);

  const healthSegments = health
    ? [
        { label: "健康", value: health.good, color: "#16a34a" },
        { label: "观察", value: health.watch, color: "#ca8a04" },
        { label: "风险", value: health.risk, color: "#dc2626" },
      ]
    : [];

  const envBars = releaseStats
    ? Object.entries(releaseStats.byEnvironment).map(([name, count]) => ({
        name,
        data: [count],
        color: name === "production" ? "#2563eb" : name === "staging" ? "#7c3aed" : "#9ca3af",
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="数据分析"
        description="平台运营总览与趋势分析"
      />

      {/* 核心指标卡 */}
      <div className="metrics-grid" style={{ marginBottom: 16 }}>
        <StatCard
          title="活跃租户"
          value={`${overview.activeTenants}/${overview.totalTenants}`}
          icon="user"
          color="blue"
          trend={{ value: "+12%", direction: "up" }}
          subtitle={`共 ${overview.totalUsers} 名用户`}
        />
        <StatCard
          title="MRR 月经常性收入"
          value={`¥${overview.mrr.toLocaleString()}`}
          icon="chart"
          color="green"
          trend={{ value: `+${overview.mrrGrowth}%`, direction: "up" }}
          subtitle={`${overview.activeSubscriptions} 活跃 + ${overview.trialSubscriptions} 试用`}
        />
        <StatCard
          title="审批通过率"
          value={`${overview.approvalRate}%`}
          icon="check"
          color="purple"
          subtitle={`${overview.totalApprovals} 个审批`}
        />
        <StatCard
          title="发布成功率"
          value={`${overview.releaseSuccessRate}%`}
          icon="star"
          color="orange"
          subtitle={`${overview.totalReleases} 次发布`}
        />
      </div>

      <div className="metrics-grid" style={{ marginBottom: 16 }}>
        <StatCard
          title="待处理工单"
          value={overview.openTickets}
          icon="bell"
          color="red"
          subtitle={`共 ${overview.totalTickets} 个工单`}
        />
        <StatCard
          title="严重风险"
          value={overview.criticalRisks}
          icon="warning"
          color="red"
          subtitle={`共 ${overview.totalRisks} 个风险`}
        />
        <StatCard
          title="审批平均响应"
          value={`${approvalStats?.avgResponseHours ?? "-"}h`}
          icon="clock"
          color="blue"
          subtitle={`${approvalStats?.pending ?? 0} 个待审批`}
        />
        <StatCard
          title="健康租户占比"
          value={health ? `${Math.round((health.good / (health.good + health.watch + health.risk)) * 100)}%` : "-"}
          icon="heart"
          color="green"
          subtitle={`${health?.watch ?? 0} 观察 · ${health?.risk ?? 0} 风险`}
        />
      </div>

      {/* 图表区 */}
      <div className="metrics-charts" style={{ marginBottom: 16 }}>
        <ChartContainer
          title="平台活跃趋势（近 30 天）"
          subtitle="每日活跃事件数"
        >
          <LineChart
            categories={trendCategories}
            series={[{ name: "活跃事件", data: trendData, color: "#2563eb", fillOpacity: 0.1 }]}
            showArea
            showDots={false}
            width={500}
            height={260}
          />
        </ChartContainer>

        <ChartContainer
          title="租户健康分布"
          subtitle="基于健康评分"
          legend={healthSegments}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <DonutChart
              segments={healthSegments}
              size={180}
              thickness={36}
              centerLabel="租户"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {healthSegments.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color, display: "inline-block" }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{s.label}</span>
                  <Badge variant="default" size="sm">{s.value}</Badge>
                </div>
              ))}
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* 发布与审批统计 */}
      <div className="metrics-charts" style={{ marginBottom: 16 }}>
        {releaseStats && (
          <ChartContainer
            title="发布统计"
            subtitle={`${releaseStats.deployed} 成功 · ${releaseStats.rolledBack} 回滚 · ${releaseStats.pending} 待发布`}
            legend={envBars.map((e) => ({ label: e.name, color: e.color }))}
          >
            <BarChart
              categories={Object.keys(releaseStats.byEnvironment)}
              series={envBars}
              width={500}
              height={260}
              showValues
            />
          </ChartContainer>
        )}

        {approvalStats && (
          <Card>
            <CardHeader>审批统计详情</CardHeader>
            <CardBody>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">审批总数</span>
                  <span className="detail-value">{approvalStats.total}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">已通过</span>
                  <span className="detail-value" style={{ color: "#16a34a" }}>{approvalStats.approved}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">已拒绝</span>
                  <span className="detail-value" style={{ color: "#dc2626" }}>{approvalStats.rejected}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">待审批</span>
                  <span className="detail-value" style={{ color: "#ca8a04" }}>{approvalStats.pending}</span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">审批通过率</span>
                  <div style={{ marginTop: 4 }}>
                    <ProgressBar
                      value={approvalStats.approved}
                      max={approvalStats.total}
                      color="green"
                      showLabel
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
