import { activityEvents } from "../store";

import type { ActivityEvent } from "@trae/shared";

export function listActivityEvents(tenantId?: string, includeAllTenants = false): ActivityEvent[] {
  const records = includeAllTenants || !tenantId
    ? activityEvents.getAll()
    : activityEvents.findByTenantId(tenantId);
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * 聚合统计：按天/周/月聚合活动事件
 */
export function aggregateActivity(params: {
  groupBy: "day" | "week" | "month";
  startDate?: string;
  endDate?: string;
}): { period: string; count: number; byType: Record<string, number> }[] {
  const allEvents = activityEvents.getAll();
  const { groupBy, startDate, endDate } = params;

  // 按时间范围过滤
  let filtered = allEvents;
  if (startDate) {
    const start = new Date(startDate);
    filtered = filtered.filter((e) => new Date(e.createdAt) >= start);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filtered = filtered.filter((e) => new Date(e.createdAt) <= end);
  }

  // 按周期分组
  const groups = new Map<string, { count: number; byType: Record<string, number> }>();

  for (const event of filtered) {
    const date = new Date(event.createdAt);
    let periodKey: string;

    switch (groupBy) {
      case "day":
        periodKey = date.toISOString().split("T")[0];
        break;
      case "week": {
        // 获取该日期所在周的周一
        const dayOfWeek = date.getDay();
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
        periodKey = monday.toISOString().split("T")[0];
        break;
      }
      case "month":
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    if (!groups.has(periodKey)) {
      groups.set(periodKey, { count: 0, byType: {} });
    }

    const group = groups.get(periodKey)!;
    group.count++;
    group.byType[event.type] = (group.byType[event.type] || 0) + 1;
  }

  // 转换为数组并按周期排序
  const result = Array.from(groups.entries()).map(([period, data]) => ({
    period,
    count: data.count,
    byType: data.byType
  }));

  result.sort((a, b) => a.period.localeCompare(b.period));
  return result;
}

/**
 * 趋势分析：按日期返回活动趋势数据
 */
export function getActivityTrends(): { date: string; total: number; byType: Record<string, number> }[] {
  const allEvents = activityEvents.getAll();

  // 按日期分组
  const dateGroups = new Map<string, { total: number; byType: Record<string, number> }>();

  for (const event of allEvents) {
    const dateKey = event.createdAt.split("T")[0];

    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, { total: 0, byType: {} });
    }

    const group = dateGroups.get(dateKey)!;
    group.total++;
    group.byType[event.type] = (group.byType[event.type] || 0) + 1;
  }

  const result = Array.from(dateGroups.entries()).map(([date, data]) => ({
    date,
    total: data.total,
    byType: data.byType
  }));

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

/**
 * 实时过滤：根据多条件过滤活动事件
 */
export function filterActivityRealtime(filters: {
  types?: string[];
  tenantId?: string;
  userId?: string;
  limit?: number;
}): ActivityEvent[] {
  let result = activityEvents.getAll();

  if (filters.types && filters.types.length > 0) {
    result = result.filter((e) => filters.types!.includes(e.type));
  }

  if (filters.tenantId) {
    result = result.filter((e) => e.tenantId === filters.tenantId);
  }

  if (filters.userId) {
    result = result.filter((e) => e.actorId === filters.userId);
  }

  // 按时间倒序
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (filters.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * 活动统计：返回活动事件的汇总指标
 */
export function getActivityStats(): {
  total: number;
  today: number;
  thisWeek: number;
  topActors: { actorId: string; count: number }[];
} {
  const allEvents = activityEvents.getAll();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // 本周一
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const total = allEvents.length;
  const today = allEvents.filter((e) => e.createdAt.startsWith(todayStr)).length;
  const thisWeek = allEvents.filter((e) => new Date(e.createdAt) >= monday).length;

  // 最活跃的操作者 Top 10
  const actorCounts = new Map<string, number>();
  for (const event of allEvents) {
    actorCounts.set(event.actorId, (actorCounts.get(event.actorId) || 0) + 1);
  }

  const topActors = Array.from(actorCounts.entries())
    .map(([actorId, count]) => ({ actorId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { total, today, thisWeek, topActors };
}
