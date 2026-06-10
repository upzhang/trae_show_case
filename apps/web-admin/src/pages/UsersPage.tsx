import { useEffect, useState, useMemo } from "react";

import { api } from "../lib/api";
import { can } from "../lib/session";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Modal } from "../components/Modal";
import { SearchInput } from "../components/SearchInput";
import { FilterBar } from "../components/FilterBar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { StatusDot } from "../components/StatusDot";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";

import type { UserView } from "../lib/api";
import type { RoleCode } from "@trae/shared";

const ALL_ROLES: RoleCode[] = [
  "platform_admin",
  "tenant_admin",
  "auditor",
  "release_manager",
  "member",
];

// 预置缺陷 1 — 权限缺口（前端部分）：
// 下方角色编辑按钮在 role:edit 权限缺失时依然显示，
// 造成"前端按钮可见 + 后端实际放行"的不一致现象。
// 正确修复：按钮显示条件改为 can("role:edit")。
export default function UsersPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchActionOpen, setBatchActionOpen] = useState(false);
  const [batchActionType, setBatchActionType] = useState<"enable" | "disable">("enable");
  const [detailUser, setDetailUser] = useState<UserView | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 角色编辑 Modal 状态
  const [roleEditUser, setRoleEditUser] = useState<UserView | null>(null);
  const [roleEditOpen, setRoleEditOpen] = useState(false);
  const [editingRoles, setEditingRoles] = useState<RoleCode[]>([]);
  const [addRoleValue, setAddRoleValue] = useState<RoleCode>("member");
  const [roleEditSaving, setRoleEditSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    if (!can("user:view")) {
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(): Promise<void> {
    if (!name.trim() || !email.trim()) {
      window.alert("请填写姓名与邮箱");
      return;
    }
    await api.createUser({ name: name.trim(), email: email.trim(), roles: [newRole] });
    setName("");
    setEmail("");
    load();
  }

  async function promote(id: string, target: string): Promise<void> {
    await api.updateUserRoles(id, [target]);
    load();
  }

  // 角色编辑 Modal 操作
  function openRoleEdit(user: UserView): void {
    setRoleEditUser(user);
    setEditingRoles([...user.roles] as RoleCode[]);
    setAddRoleValue("member");
    setRoleEditOpen(true);
  }

  function closeRoleEdit(): void {
    setRoleEditOpen(false);
    setRoleEditUser(null);
    setEditingRoles([]);
    setRoleEditSaving(false);
  }

  function removeRole(role: RoleCode): void {
    setEditingRoles((prev) => prev.filter((r) => r !== role));
  }

  function addRole(): void {
    if (!addRoleValue) return;
    setEditingRoles((prev) => {
      if (prev.includes(addRoleValue)) return prev;
      return [...prev, addRoleValue];
    });
  }

  async function saveRoles(): Promise<void> {
    if (!roleEditUser) return;
    setRoleEditSaving(true);
    try {
      await api.updateUserRoles(roleEditUser.id, editingRoles);
      closeRoleEdit();
      load();
    } catch (err) {
      console.error(err);
      window.alert("角色更新失败");
    } finally {
      setRoleEditSaving(false);
    }
  }

  function getAvailableRoles(): RoleCode[] {
    return ALL_ROLES.filter((r) => !editingRoles.includes(r));
  }

  // 筛选 + 搜索
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.roles.includes(roleFilter));
    }

    return result;
  }, [users, search, roleFilter]);

  // 统计
  const activeUsers = users.filter((u) => u.isActive !== false);
  const adminUsers = users.filter((u) =>
    u.roles.includes("platform_admin") || u.roles.includes("tenant_admin")
  );

  // 多选
  function toggleSelect(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll(): void {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    }
  }

  function openBatchAction(type: "enable" | "disable"): void {
    if (selectedIds.size === 0) {
      window.alert("请先选择用户");
      return;
    }
    setBatchActionType(type);
    setBatchActionOpen(true);
  }

  async function confirmBatchAction(): Promise<void> {
    // 演示：批量操作通过逐个调用来模拟
    for (const id of selectedIds) {
      try {
        if (batchActionType === "enable") {
          // 启用用户：设为 member 角色
          await api.updateUserRoles(id, ["member"]);
        } else {
          // 禁用用户：清空角色
          await api.updateUserRoles(id, []);
        }
      } catch (err) {
        console.error(`操作失败: ${id}`, err);
      }
    }
    setSelectedIds(new Set());
    setBatchActionOpen(false);
    load();
  }

  function openDetail(user: UserView): void {
    setDetailUser(user);
    setDetailOpen(true);
  }

  function closeDetail(): void {
    setDetailOpen(false);
    setDetailUser(null);
  }

  const roleOptions = [
    { value: "all", label: "全部角色" },
    { value: "platform_admin", label: "平台管理员" },
    { value: "tenant_admin", label: "租户管理员" },
    { value: "auditor", label: "审计员" },
    { value: "release_manager", label: "发布经理" },
    { value: "member", label: "成员" }
  ];

  function getRoleBadgeVariant(role: string): "info" | "success" | "warning" | "danger" | "default" {
    switch (role) {
      case "platform_admin": return "danger";
      case "tenant_admin": return "warning";
      case "auditor": return "info";
      case "release_manager": return "success";
      default: return "default";
    }
  }

  return (
    <>
      <PageHeader
        title="用户与权限管理"
        description="管理平台用户、角色分配与批量操作"
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon="refresh"
            onClick={() => { load(); }}
            disabled={loading}
          >
            刷新
          </Button>
        }
      />

      {/* 统计卡片 */}
      <div className="stat-grid">
        <StatCard
          title="用户总数"
          value={users.length}
          icon="user"
          color="blue"
        />
        <StatCard
          title="活跃用户"
          value={activeUsers.length}
          icon="check"
          color="green"
        />
        <StatCard
          title="管理员"
          value={adminUsers.length}
          icon="lock"
          color="purple"
        />
        <StatCard
          title="已选择"
          value={selectedIds.size}
          icon="filter"
          color="orange"
        />
      </div>

      {/* 创建用户 */}
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
          <Button variant="primary" onClick={createUser} disabled={!can("user:edit")}>
            创建
          </Button>
        </div>
      </div>

      {/* 搜索与筛选 + 批量操作 */}
      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="搜索姓名、邮箱..."
            />
            <FilterBar
              filters={[
                {
                  key: "role",
                  label: "全部角色",
                  options: roleOptions,
                  value: roleFilter,
                  onChange: setRoleFilter
                }
              ]}
              onReset={() => {
                setSearch("");
                setRoleFilter("all");
              }}
            />
          </div>
          {selectedIds.size > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="primary" size="sm" onClick={() => openBatchAction("enable")}>
                批量启用
              </Button>
              <Button variant="danger" size="sm" onClick={() => openBatchAction("disable")}>
                批量禁用
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 用户列表 */}
      <div className="card">
        <h3>用户列表</h3>
        {loading ? (
          <div className="table-loading">
            <Spinner size={32} />
            <span>加载中...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon="search"
            title={users.length === 0 ? "无权限或无用户" : "未找到匹配的用户"}
            description={users.length === 0 ? undefined : "尝试调整搜索条件或筛选器"}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td>
                    <span
                      style={{ cursor: "pointer", color: "#2563eb" }}
                      onClick={() => openDetail(user)}
                    >
                      {user.id}
                    </span>
                  </td>
                  <td>
                    <strong
                      style={{ cursor: "pointer" }}
                      onClick={() => openDetail(user)}
                    >
                      {user.name}
                    </strong>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {user.roles.map((role) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)} size="sm">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusDot
                      color={user.isActive !== false ? "green" : "gray"}
                      pulse={user.isActive !== false}
                    />
                    {" "}
                    {user.isActive !== false ? "活跃" : "禁用"}
                  </td>
                  <td>
                    {can("role:edit") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRoleEdit(user)}
                      >
                        编辑角色
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 批量操作确认 */}
      <ConfirmDialog
        open={batchActionOpen}
        title={batchActionType === "enable" ? "批量启用用户" : "批量禁用用户"}
        message={`确定要${batchActionType === "enable" ? "启用" : "禁用"}已选择的 ${selectedIds.size} 个用户吗？`}
        variant={batchActionType === "disable" ? "danger" : "primary"}
        confirmLabel={batchActionType === "enable" ? "启用" : "禁用"}
        onConfirm={confirmBatchAction}
        onCancel={() => setBatchActionOpen(false)}
      />

      {/* 用户详情 Modal */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={detailUser ? `用户详情 — ${detailUser.name}` : ""}
        size="md"
      >
        {detailUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 基本信息 */}
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">用户 ID</span>
                <span className="detail-value">{detailUser.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">姓名</span>
                <span className="detail-value">{detailUser.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">邮箱</span>
                <span className="detail-value">{detailUser.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">所属租户</span>
                <span className="detail-value">{detailUser.tenantId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态</span>
                <span className="detail-value">
                  <StatusDot
                    color={detailUser.isActive !== false ? "green" : "gray"}
                    pulse={detailUser.isActive !== false}
                  />
                  {" "}
                  {detailUser.isActive !== false ? "活跃" : "已禁用"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">创建时间</span>
                <span className="detail-value">{detailUser.createdAt ?? "—"}</span>
              </div>
            </div>

            {/* 角色列表 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>角色列表</h4>
              {detailUser.roles.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>暂无角色</p>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {detailUser.roles.map((role) => (
                    <Badge key={role} variant={getRoleBadgeVariant(role)}>
                      {role}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 所属团队 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>所属团队</h4>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>
                租户 {detailUser.tenantId} 下的成员
              </p>
            </div>

            {/* 最近活动时间线 */}
            <div className="card">
              <h4 style={{ margin: "0 0 12px", fontSize: 14 }}>最近活动</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <span className="timeline-title">用户创建</span>
                    <span className="timeline-desc">账号创建于平台</span>
                    <span className="timeline-time">{detailUser.createdAt ?? "—"}</span>
                  </div>
                </div>
                {detailUser.roles.length > 0 && (
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#16a34a" }} />
                    <div className="timeline-content">
                      <span className="timeline-title">角色分配</span>
                      <span className="timeline-desc">
                        被授予角色：{detailUser.roles.join(", ")}
                      </span>
                      <span className="timeline-time">—</span>
                    </div>
                  </div>
                )}
                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: detailUser.isActive !== false ? "#16a34a" : "#9ca3af" }} />
                  <div className="timeline-content">
                    <span className="timeline-title">
                      {detailUser.isActive !== false ? "活跃中" : "已禁用"}
                    </span>
                    <span className="timeline-desc">
                      {detailUser.isActive !== false
                        ? "用户当前处于活跃状态"
                        : "用户已被禁用"}
                    </span>
                    <span className="timeline-time">当前</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer" style={{ padding: "12px 0 0", borderTop: "1px solid #e5e7eb", marginTop: 16 }}>
          <Button variant="ghost" onClick={closeDetail}>
            关闭
          </Button>
        </div>
      </Modal>

      {/* 角色编辑 Modal */}
      <Modal
        open={roleEditOpen}
        onClose={closeRoleEdit}
        title={roleEditUser ? `编辑角色 — ${roleEditUser.name}` : ""}
        size="md"
      >
        {roleEditUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 用户基本信息 */}
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">姓名</span>
                <span className="detail-value">{roleEditUser.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">邮箱</span>
                <span className="detail-value">{roleEditUser.email}</span>
              </div>
            </div>

            {/* 当前角色列表 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>当前角色</h4>
              {editingRoles.length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>暂无角色</p>
              ) : (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {editingRoles.map((role) => (
                    <Badge key={role} variant={getRoleBadgeVariant(role)}>
                      {role}
                      <span
                        onClick={() => removeRole(role)}
                        style={{
                          marginLeft: 6,
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                        title={`移除 ${role}`}
                      >
                        ×
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 添加角色 */}
            <div className="card">
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>添加角色</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={addRoleValue}
                  onChange={(e) => setAddRoleValue(e.target.value as RoleCode)}
                  disabled={getAvailableRoles().length === 0}
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addRole}
                  disabled={getAvailableRoles().length === 0}
                >
                  添加
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer" style={{ padding: "12px 0 0", borderTop: "1px solid #e5e7eb", marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={closeRoleEdit}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={saveRoles}
            loading={roleEditSaving}
            disabled={roleEditSaving}
          >
            保存
          </Button>
        </div>
      </Modal>
    </>
  );
}
