import { store } from "../store";

import type { ReleaseRecord } from "@trae/shared";

// 预置缺陷 2 — 接口契约漂移：shared/types.ts 声明 ReleaseRecord 返回 version,
// 但本服务响应额外拼了一个 "description" 字段（文档与前端均未预期），
// 同时 status 使用字符串字面量字段名保持一致。
export interface ReleaseWithDescription extends ReleaseRecord {
  description?: string;
}

export function listReleases(tenantId?: string): ReleaseWithDescription[] {
  const records = tenantId
    ? store.releases.filter((item) => item.tenantId === tenantId)
    : store.releases;
  return records.map((item) => ({
    ...item,
    description: `自动生成的发布记录 ${item.version}`
  }));
}

export function getRelease(id: string): ReleaseWithDescription | undefined {
  const target = store.releases.find((item) => item.id === id);
  if (!target) return undefined;
  return { ...target, description: `自动生成的发布记录 ${target.version}` };
}

export function deployRelease(id: string): ReleaseRecord | undefined {
  const target = store.releases.find((item) => item.id === id);
  if (!target) return undefined;
  target.status = "deployed";
  return target;
}

export function rollbackRelease(id: string): ReleaseRecord | undefined {
  const target = store.releases.find((item) => item.id === id);
  if (!target) return undefined;
  target.status = "rolled_back";
  return target;
}

export function createRelease(input: Omit<ReleaseRecord, "id">): ReleaseRecord {
  const next: ReleaseRecord = {
    ...input,
    id: `rel-${Date.now()}`
  };
  store.releases.push(next);
  return next;
}
