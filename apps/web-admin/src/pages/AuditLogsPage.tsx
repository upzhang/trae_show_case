import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { AuditLogView } from "../lib/api";

export default function AuditLogsPage() {
  const [list, setList] = useState<AuditLogView[]>([]);

  async function load(): Promise<void> {
    if (!can("audit:view")) {
      setList([]);
      return;
    }
    setList(await api.listAuditLogs());
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  return (
    <div className="card">
      <h3>审计日志</h3>
      {list.length === 0 ? (
        <div className="empty">无权限或无日志</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>动作</th>
              <th>操作者</th>
              <th>摘要</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td>{item.createdAt}</td>
                <td>{item.action}</td>
                <td>{item.actorId}</td>
                <td>{item.summary || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
