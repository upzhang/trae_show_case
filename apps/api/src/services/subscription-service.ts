import { subscriptions } from "../store";
import type { Subscription } from "@trae/shared";

export const subscriptionService = {
  createSubscription(tenantId: string, plan: Subscription["plan"], period: Subscription["period"], seats: number, monthlyRate: number, annualRate: number): Subscription {
    return subscriptions.create({
      tenantId,
      plan,
      period,
      status: "active",
      seats,
      seatsUsed: 0,
      monthlyRate,
      annualRate,
      nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  getSubscription(id: string): Subscription | undefined {
    return subscriptions.get(id);
  },

  getSubscriptionByTenant(tenantId: string): Subscription | undefined {
    return subscriptions.findByTenantId(tenantId);
  },

  getAllSubscriptions(): Subscription[] {
    return subscriptions.getAll();
  },

  updateSubscription(id: string, updates: Partial<Subscription>): Subscription | undefined {
    return subscriptions.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteSubscription(id: string): boolean {
    return subscriptions.delete(id);
  },

  cancelSubscription(id: string): Subscription | undefined {
    return subscriptions.update(id, {
      status: "canceled",
      cancelAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  renewSubscription(id: string, period: Subscription["period"]): Subscription | undefined {
    const billingInterval = period === "yearly" ? 365 : 30;
    return subscriptions.update(id, {
      period,
      status: "active",
      nextBillingAt: new Date(Date.now() + billingInterval * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  updateSeats(id: string, newSeats: number): Subscription | undefined {
    return subscriptions.update(id, { seats: newSeats, updatedAt: new Date().toISOString() });
  },

  incrementSeatsUsed(id: string, count: number = 1): Subscription | undefined {
    const subscription = subscriptions.get(id);
    if (!subscription) return undefined;
    
    const newSeatsUsed = Math.min(subscription.seatsUsed + count, subscription.seats);
    return subscriptions.update(id, { seatsUsed: newSeatsUsed, updatedAt: new Date().toISOString() });
  },

  decrementSeatsUsed(id: string, count: number = 1): Subscription | undefined {
    const subscription = subscriptions.get(id);
    if (!subscription) return undefined;
    
    const newSeatsUsed = Math.max(subscription.seatsUsed - count, 0);
    return subscriptions.update(id, { seatsUsed: newSeatsUsed, updatedAt: new Date().toISOString() });
  },

  getActiveSubscriptions(): Subscription[] {
    return subscriptions.findActive();
  },

  getPastDueSubscriptions(): Subscription[] {
    return subscriptions.findPastDue();
  },

  calculateMonthlyRate(plan: Subscription["plan"], seats: number): number {
    const baseRates: Record<Subscription["plan"], number> = {
      free: 0,
      pro: 800,
      standard: 500,
      enterprise: 1000
    };
    
    return baseRates[plan] * seats;
  },

  calculateAnnualRate(plan: Subscription["plan"], seats: number): number {
    return this.calculateMonthlyRate(plan, seats) * 12 * 0.9;
  },

  /**
   * 续费提醒：检查即将到期的订阅，返回需要提醒的订阅列表
   */
  checkRenewalReminders(): { id: string; tenantName: string; plan: string; expiresInDays: number }[] {
    const allSubs = subscriptions.getAll();
    const now = new Date();
    const reminders: { id: string; tenantName: string; plan: string; expiresInDays: number }[] = [];

    for (const sub of allSubs) {
      // 只检查 active 和 past_due 状态的订阅
      if (sub.status !== "active" && sub.status !== "past_due") continue;

      let expiryDate: Date | null = null;

      if (sub.cancelAt) {
        expiryDate = new Date(sub.cancelAt);
      } else if (sub.nextBillingAt) {
        expiryDate = new Date(sub.nextBillingAt);
      }

      if (!expiryDate) continue;

      const diffMs = expiryDate.getTime() - now.getTime();
      const expiresInDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // 只提醒 30 天内到期的订阅
      if (expiresInDays >= 0 && expiresInDays <= 30) {
        reminders.push({
          id: sub.id,
          tenantName: sub.tenantId,
          plan: sub.plan,
          expiresInDays
        });
      }
    }

    // 按到期天数升序排列（最紧急的在前）
    reminders.sort((a, b) => a.expiresInDays - b.expiresInDays);
    return reminders;
  },

  /**
   * 用量统计：返回订阅的席位使用情况和 API 调用量
   */
  getUsageStats(subscriptionId: string): { seatsUsed: number; seatsLimit: number; utilizationPercent: number; apiCalls: number } {
    const sub = subscriptions.get(subscriptionId);
    if (!sub) {
      return { seatsUsed: 0, seatsLimit: 0, utilizationPercent: 0, apiCalls: 0 };
    }

    const seatsUsed = sub.seatsUsed;
    const seatsLimit = sub.seats;
    const utilizationPercent = seatsLimit > 0 ? Math.round((seatsUsed / seatsLimit) * 100) : 0;

    // 基于席位使用量估算 API 调用量（每席位约 120 次/天）
    const apiCalls = seatsUsed * 120;

    return { seatsUsed, seatsLimit, utilizationPercent, apiCalls };
  },

  /**
   * 升降级校验：验证订阅计划变更是否合法
   */
  validatePlanChange(subscriptionId: string, targetPlan: string): { valid: boolean; reason?: string; priceDifference?: number } {
    const sub = subscriptions.get(subscriptionId);
    if (!sub) {
      return { valid: false, reason: "订阅不存在" };
    }

    // 检查目标计划是否有效
    const validPlans: Subscription["plan"][] = ["free", "pro", "standard", "enterprise"];
    if (!validPlans.includes(targetPlan as Subscription["plan"])) {
      return { valid: false, reason: `无效的计划类型: ${targetPlan}` };
    }

    // 不能切换到相同计划
    if (sub.plan === targetPlan) {
      return { valid: false, reason: "当前已是该计划" };
    }

    // 已取消的订阅不能变更计划
    if (sub.status === "canceled" || sub.status === "cancelled" || sub.status === "expired") {
      return { valid: false, reason: `订阅状态为 ${sub.status}，无法变更计划` };
    }

    // 计算价格差异
    const currentMonthlyRate = sub.monthlyRate;
    const targetMonthlyRate = this.calculateMonthlyRate(targetPlan as Subscription["plan"], sub.seats);
    const priceDifference = targetMonthlyRate - currentMonthlyRate;

    // free 计划只能从 pro/standard 降级
    if (targetPlan === "free" && sub.plan === "enterprise") {
      return { valid: false, reason: "企业版不能直接降级到免费版，请先降级到标准版" };
    }

    return { valid: true, priceDifference };
  },

  /**
   * 订阅统计：汇总所有订阅的关键指标
   */
  getSubscriptionStats(): { total: number; active: number; byPlan: Record<string, number>; mrr: number; expiringThisMonth: number } {
    const allSubs = subscriptions.getAll();
    const total = allSubs.length;
    const active = allSubs.filter((s) => s.status === "active").length;

    // 按计划分组统计
    const byPlan: Record<string, number> = {};
    for (const sub of allSubs) {
      byPlan[sub.plan] = (byPlan[sub.plan] || 0) + 1;
    }

    // 计算 MRR（月度经常性收入）：仅统计 active 和 past_due 状态
    const mrr = allSubs
      .filter((s) => s.status === "active" || s.status === "past_due")
      .reduce((sum, s) => sum + s.monthlyRate, 0);

    // 本月到期订阅数
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const expiringThisMonth = allSubs.filter((s) => {
      if (!s.nextBillingAt) return false;
      const billingDate = new Date(s.nextBillingAt);
      return billingDate.getMonth() === currentMonth && billingDate.getFullYear() === currentYear;
    }).length;

    return { total, active, byPlan, mrr, expiringThisMonth };
  }
};