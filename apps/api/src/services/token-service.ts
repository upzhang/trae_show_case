import { tokens } from "../store";
import type { ApiToken } from "@trae/shared";

export const tokenService = {
  createToken(tenantId: string, userId: string, name: string, scopes: string[], expiresAt?: string): { token: string; tokenRecord: ApiToken } {
    const tokenValue = tokens.generateToken();
    const tokenRecord = tokens.create({
      tenantId,
      userId,
      name,
      token: tokenValue,
      scopes,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    return { token: tokenValue, tokenRecord };
  },

  getToken(id: string): ApiToken | undefined {
    return tokens.get(id);
  },

  getTokensByTenant(tenantId: string): ApiToken[] {
    return tokens.findByTenantId(tenantId);
  },

  getTokensByUser(userId: string): ApiToken[] {
    return tokens.findByUserId(userId);
  },

  updateToken(id: string, updates: Partial<ApiToken>): ApiToken | undefined {
    return tokens.update(id, { ...updates, updatedAt: new Date().toISOString() });
  },

  deleteToken(id: string): boolean {
    return tokens.delete(id);
  },

  rotateToken(id: string): { token: string; tokenRecord: ApiToken | undefined } {
    const tokenValue = tokens.generateToken();
    const tokenRecord = tokens.update(id, { token: tokenValue, updatedAt: new Date().toISOString() });
    return { token: tokenValue, tokenRecord };
  },

  validateToken(token: string): ApiToken | undefined {
    const tokenRecord = tokens.getAll().find(t => t.token === token);
    if (!tokenRecord) return undefined;
    
    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      return undefined;
    }
    
    tokens.incrementUsage(tokenRecord.id);
    return tokenRecord;
  },

  checkScope(tokenId: string, requiredScope: string): boolean {
    const token = tokens.get(tokenId);
    return token?.scopes.includes(requiredScope) ?? false;
  }
};