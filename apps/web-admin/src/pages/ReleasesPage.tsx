import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { ReleaseView } from "../lib/api";

export default function ReleasesPage() {
  const [list, setList] = useState<ReleaseView[]>([]);

  async function load(): Promise<void> {
    if (!can("release:view")) {
      setList([]);
      return;
    }
    setList(await api.listReleases());
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

  return (
    <div className="card">
      <h3>发布记录</h3>
      {list.length === 0 ? (
        <div className="empty">无权限或无发布记录</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
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
                <td>{item.version}</td>
                <td>{item.environment}</td>
                <td><span className={`badge ${item.status}`}>{item.status}</span></td>
                <td>{item.operatorId}</td>
                <td>{item.createdAt}</td>
                <td>
                  {can("release:deploy") && (
                    <>
                      <button className="primary" onClick={() => deploy(item.id)}>发布</button>{" "}
                      <button className="danger" onClick={() => rollback(item.id)}>回滚</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
