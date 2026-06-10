import { store, supportRisks } from "../store";

import type { SupportRisk } from "@trae/shared";

export function listSupportRisks(tenantId?: string, includeAllTenants = false): SupportRisk[] {
  const records = includeAllTenants || !tenantId
    ? store.supportRisks
    : store.supportRisks.filter((item) => item.tenantId === tenantId);
  return [...records].sort((a, b) => a.slaDueAt.localeCompare(b.slaDueAt));
}

/**
 * 计算风险评分。
 * 评分基于严重程度、状态、SLA 是否逾期、分类等多个维度加权计算。
 */
export function calculateRiskScore(riskId: string): {
  score: number;
  level: "critical" | "high" | "medium" | "low";
  factors: string[];
} {
  const risk = supportRisks.get(riskId);
  if (!risk) {
    return { score: 0, level: "low", factors: ["未找到风险记录"] };
  }

  const factors: string[] = [];
  let score = 0;

  // 严重程度权重 (0-40)
  const severityWeights: Record<string, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10
  };
  const severityWeight = severityWeights[risk.severity] ?? 10;
  score += severityWeight;
  factors.push(`严重程度(${risk.severity}): +${severityWeight}`);

  // 状态权重 (0-25)
  const statusWeights: Record<string, number> = {
    open: 25,
    in_progress: 15,
    waiting_customer: 10,
    resolved: 0
  };
  const statusWeight = statusWeights[risk.status] ?? 10;
  score += statusWeight;
  factors.push(`状态(${risk.status}): +${statusWeight}`);

  // SLA 逾期检查 (0-20)
  const now = new Date();
  const slaDue = new Date(risk.slaDueAt);
  if (risk.status !== "resolved" && now > slaDue) {
    score += 20;
    const overdueDays = Math.ceil((now.getTime() - slaDue.getTime()) / (1000 * 60 * 60 * 24));
    factors.push(`SLA 逾期 ${overdueDays} 天: +20`);
  } else if (risk.status !== "resolved") {
    const remainingHours = Math.ceil((slaDue.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (remainingHours <= 24) {
      score += 10;
      factors.push(`SLA 即将到期(剩余 ${remainingHours}h): +10`);
    }
  }

  // 分类权重 (0-10)
  const categoryWeights: Record<string, number> = {
    security: 10,
    billing: 8,
    release: 6,
    support: 4,
    adoption: 2
  };
  const categoryWeight = categoryWeights[risk.category] ?? 3;
  score += categoryWeight;
  factors.push(`分类(${risk.category}): +${categoryWeight}`);

  // 影响范围评估 (0-5)
  if (risk.impact) {
    const impactLower = risk.impact.toLowerCase();
    if (impactLower.includes("全平台") || impactLower.includes("all") || impactLower.includes("全部")) {
      score += 5;
      factors.push("影响范围(全平台): +5");
    } else if (impactLower.includes("多个") || impactLower.includes("multiple")) {
      score += 3;
      factors.push("影响范围(多个): +3");
    }
  }

  // 确定风险等级
  let level: "critical" | "high" | "medium" | "low";
  if (score >= 80) {
    level = "critical";
  } else if (score >= 60) {
    level = "high";
  } else if (score >= 35) {
    level = "medium";
  } else {
    level = "low";
  }

  return { score, level, factors };
}

/**
 * 获取风险缓解建议。
 */
export function getMitigationSuggestions(riskId: string): {
  action: string;
  priority: string;
  estimatedEffort: string;
}[] {
  const risk = supportRisks.get(riskId);
  if (!risk) {
    return [];
  }

  const suggestions: { action: string; priority: string; estimatedEffort: string }[] = [];

  // 基于严重程度的基础建议
  if (risk.severity === "critical") {
    suggestions.push({
      action: "立即组建应急响应小组，启动最高优先级处理流程",
      priority: "最高",
      estimatedEffort: "立即执行"
    });
    suggestions.push({
      action: "通知所有相关方并上报管理层",
      priority: "最高",
      estimatedEffort: "1小时内"
    });
  }

  if (risk.severity === "high" || risk.severity === "critical") {
    suggestions.push({
      action: "制定详细的修复方案和时间表",
      priority: "高",
      estimatedEffort: "4小时"
    });
    suggestions.push({
      action: "安排专人跟进直至风险关闭",
      priority: "高",
      estimatedEffort: "持续"
    });
  }

  // 基于分类的建议
  if (risk.category === "security") {
    suggestions.push({
      action: "进行安全影响评估并记录在案",
      priority: "高",
      estimatedEffort: "2小时"
    });
    suggestions.push({
      action: "检查相关系统是否存在同类安全漏洞",
      priority: "中",
      estimatedEffort: "8小时"
    });
  }

  if (risk.category === "billing") {
    suggestions.push({
      action: "核对受影响账单并准备补偿方案",
      priority: "高",
      estimatedEffort: "4小时"
    });
  }

  if (risk.category === "release") {
    suggestions.push({
      action: "评估是否需要回滚相关发布",
      priority: "高",
      estimatedEffort: "2小时"
    });
    suggestions.push({
      action: "更新发布检查清单，防止同类问题",
      priority: "中",
      estimatedEffort: "4小时"
    });
  }

  // 基于状态的建议
  if (risk.status === "waiting_customer") {
    suggestions.push({
      action: "主动联系客户获取所需信息",
      priority: "中",
      estimatedEffort: "1小时"
    });
  }

  if (risk.status === "in_progress") {
    suggestions.push({
      action: "定期更新风险处理进展",
      priority: "中",
      estimatedEffort: "每日"
    });
  }

  // 通用建议
  suggestions.push({
    action: "记录风险处理全过程到审计日志",
    priority: "低",
    estimatedEffort: "持续"
  });

  return suggestions;
}

/**
 * 获取风险趋势分析（按月统计）。
 */
export function getRiskTrends(): {
  month: string;
  newRisks: number;
  resolvedRisks: number;
  openRisks: number;
}[] {
  const allRisks = supportRisks.getAll();
  const monthlyMap = new Map<string, { newRisks: number; resolvedRisks: number }>();

  // 统计每月新增和解决的风险
  for (const risk of allRisks) {
    const createdMonth = risk.createdAt.substring(0, 7); // YYYY-MM
    if (!monthlyMap.has(createdMonth)) {
      monthlyMap.set(createdMonth, { newRisks: 0, resolvedRisks: 0 });
    }
    monthlyMap.get(createdMonth)!.newRisks++;

    if (risk.resolvedAt) {
      const resolvedMonth = risk.resolvedAt.substring(0, 7);
      if (!monthlyMap.has(resolvedMonth)) {
        monthlyMap.set(resolvedMonth, { newRisks: 0, resolvedRisks: 0 });
      }
      monthlyMap.get(resolvedMonth)!.resolvedRisks++;
    }
  }

  // 按月份排序并计算每月未关闭风险数
  const sortedMonths = [...monthlyMap.keys()].sort();
  let cumulativeOpen = 0;

  return sortedMonths.map((month) => {
    const data = monthlyMap.get(month)!;
    cumulativeOpen += data.newRisks - data.resolvedRisks;
    return {
      month,
      newRisks: data.newRisks,
      resolvedRisks: data.resolvedRisks,
      openRisks: Math.max(0, cumulativeOpen)
    };
  });
}

/**
 * 获取风险统计数据。
 */
export function getRiskStats(): {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  overdueCount: number;
} {
  const allRisks = supportRisks.getAll();
  const now = new Date();

  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let overdueCount = 0;

  for (const risk of allRisks) {
    bySeverity[risk.severity] = (bySeverity[risk.severity] || 0) + 1;
    byStatus[risk.status] = (byStatus[risk.status] || 0) + 1;

    // 检查是否逾期（未解决且超过 SLA 时间）
    if (risk.status !== "resolved" && new Date(risk.slaDueAt) < now) {
      overdueCount++;
    }
  }

  return {
    total: allRisks.length,
    bySeverity,
    byStatus,
    overdueCount
  };
}
