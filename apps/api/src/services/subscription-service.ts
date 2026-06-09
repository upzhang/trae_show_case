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
      standard: 500,
      enterprise: 1000
    };
    
    return baseRates[plan] * seats;
  },

  calculateAnnualRate(plan: Subscription["plan"], seats: number): number {
    return this.calculateMonthlyRate(plan, seats) * 12 * 0.9;
  }
};