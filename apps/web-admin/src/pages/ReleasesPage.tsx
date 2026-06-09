import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { ReleaseView, TenantView } from "../lib/api";

const statusLabel: Record<ReleaseView["status"], string> = {
  pending: "待发布",
  deployed: "已部署",
  rolled_back: "已回滚"
};

const envLabel: Record<ReleaseView["environment"], string> = {
  staging: "预发布",
  production: "生产"
};

export default function ReleasesPage() {
  const [list, setList] = useState<ReleaseView[]>([]);
  const [tenants, setTenants] = useState<TenantView[]>([]);

  async function load(): Promise<void> {
    const [rels, tenantRows] = await Promise.all([
      can("release:view") ? api.listReleases() : [],
      can("tenant:view") ? api.listTenants() : []
    ]);
    setList(rels);
    setTenants(tenantRows);
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  async function deploy(id: string): Promise<void> {
    await api.deployRelease(id);
    load().catch((err) => console.error(err));
  }

  async function rollback(id: string): Promise<void> {
    await api.rollbackRelease(id);
    load().catch((err) => console.error(err));
  }

  const tenantNameById = new Map(tenants.map((item) => [item.id, item.name]));
  const deployed = list.filter((item) => item.status === "deployed").length;
  const rolledBack = list.filter((item) => item.status === "rolled_back").length;
  const pending = list.filter((item) => item.status === "pending").length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">发布总数</div><div className="value">{list.length}</div></div>
        <div className="stat-card"><div className="label">已部署</div><div className="value">{deployed}</div></div>
        <div className="stat-card"><div className="label">已回滚</div><div className="value">{rolledBack}</div></div>
        <div className="stat-card"><div className="label">待发布</div><div className="value">{pending}</div></div>
      </div>
      <div className="card">
        <h3>发布记录</h3>
        {list.length === 0 ? (
          <div className="empty">无权限或无发布记录</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>客户</th>
                <th>版本</th>
                <th>环境</th>
                <th>状态</th>
                <th>操作员</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{tenantNameById.get(item.tenantId) ?? item.tenantId}</td>
                  <td>{item.version}</td>
                  <td>{envLabel[item.environment]}</td>
                  <td><span className={`badge ${item.status}`}>{statusLabel[item.status]}</span></td>
                  <td>{item.operatorId}</td>
                  <td>{item.createdAt}</td>
                  <td>
                    {can("release:deploy") && item.status === "pending" && (
                      <button className="primary" onClick={() => deploy(item.id)}>部署</button>
                    )}
                    {can("release:deploy") && item.status === "deployed" && (
                      <button className="danger" onClick={() => rollback(item.id)}>回滚</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
