import { useEffect, useState } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";

import type { UserView } from "../lib/api";

// 预置缺陷 1 — 权限缺口（前端部分）：
// 下方角色编辑按钮在 role:edit 权限缺失时依然显示，
// 造成"前端按钮可见 + 后端实际放行"的不一致现象。
// 正确修复：按钮显示条件改为 can("role:edit")。
export default function UsersPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState("member");

  async function load(): Promise<void> {
    if (!can("user:view")) {
      setUsers([]);
      return;
    }
    setUsers(await api.listUsers());
  }

  useEffect(() => {
    load().catch((err) => console.error(err));
  }, []);

  async function createUser(): Promise<void> {
    if (!name.trim() || !email.trim()) {
      window.alert("请填写姓名与邮箱");
      return;
    }
    await api.createUser({ name: name.trim(), email: email.trim(), roles: [newRole] });
    setName("");
    setEmail("");
    load().catch((err) => console.error(err));
  }

  async function promote(id: string, target: string): Promise<void> {
    await api.updateUserRoles(id, [target]);
    load().catch((err) => console.error(err));
  }

  return (
    <>
      <div className="card">
        <h3>创建用户</h3>
        <div className="form-row">
          <input placeholder="姓名" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="member">member</option>
            <option value="tenant_admin">tenant_admin</option>
            <option value="auditor">auditor</option>
            <option value="release_manager">release_manager</option>
            <option value="platform_admin">platform_admin</option>
          </select>
          <button className="primary" onClick={createUser}>创建</button>
        </div>
      </div>
      <div className="card">
        <h3>用户列表</h3>
        {users.length === 0 ? (
          <div className="empty">无权限或无用户</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.roles.join(", ")}</td>
                  <td>
                    {can("user:edit") && (
                      <button onClick={() => promote(user.id, "tenant_admin")}>
                        提升为 tenant_admin
                      </button>
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
