import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Card, CardHeader, CardBody } from "../components/Card";
import { Modal } from "../components/Modal";
import { Badge } from "../components/Badge";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";
import { Input } from "../components/Input";
import { Textarea } from "../components/Textarea";
import { Checkbox } from "../components/Checkbox";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SearchInput } from "../components/SearchInput";
import { Divider } from "../components/Divider";

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  type: "system" | "custom";
  createdAt: string;
  updatedAt: string;
}

interface PermissionGroups {
  permissions: string[];
  groups: Record<string, string[]>;
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permData, setPermData] = useState<PermissionGroups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<RoleDefinition | null>(null);
  const [showClone, setShowClone] = useState<RoleDefinition | null>(null);
  const [showDelete, setShowDelete] = useState<RoleDefinition | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPerms, setFormPerms] = useState<Set<string>>(new Set());
  const [cloneName, setCloneName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [rolesData, permData] = await Promise.all([
        api.get<RoleDefinition[]>("/api/roles"),
        api.get<PermissionGroups>("/api/permissions"),
      ]);
      setRoles(rolesData);
      setPermData(permData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormDesc("");
    setFormPerms(new Set());
    setCloneName("");
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setShowCreate(true);
  }

  function openEdit(role: RoleDefinition) {
    setFormName(role.name);
    setFormDesc(role.description);
    setFormPerms(new Set(role.permissions));
    setShowEdit(role);
  }

  function openClone(role: RoleDefinition) {
    setCloneName(`${role.name} (副本)`);
    setShowClone(role);
  }

  async function handleCreate() {
    if (!formName.trim()) {
      setFormError("请输入角色名称");
      return;
    }
    if (formPerms.size === 0) {
      setFormError("请至少选择一个权限");
      return;
    }
    try {
      setSaving(true);
      await api.post("/api/roles", {
        name: formName.trim(),
        description: formDesc.trim(),
        permissions: Array.from(formPerms),
      });
      setShowCreate(false);
      resetForm();
      await loadData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit() {
    if (!showEdit) return;
    if (!formName.trim()) {
      setFormError("请输入角色名称");
      return;
    }
    try {
      setSaving(true);
      await api.put(`/api/roles/${showEdit.id}`, {
        name: formName.trim(),
        description: formDesc.trim(),
        permissions: Array.from(formPerms),
      });
      setShowEdit(null);
      resetForm();
      await loadData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleClone() {
    if (!showClone || !cloneName.trim()) return;
    try {
      setSaving(true);
      await api.post(`/api/roles/${showClone.id}/clone`, { name: cloneName.trim() });
      setShowClone(null);
      setCloneName("");
      await loadData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "克隆失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!showDelete) return;
    try {
      setSaving(true);
      await api.delete(`/api/roles/${showDelete.id}`);
      setShowDelete(null);
      await loadData();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setSaving(false);
    }
  }

  function togglePerm(perm: string) {
    const next = new Set(formPerms);
    if (next.has(perm)) {
      next.delete(perm);
    } else {
      next.add(perm);
    }
    setFormPerms(next);
  }

  function toggleGroup(groupPerms: string[], checked: boolean) {
    const next = new Set(formPerms);
    if (checked) {
      groupPerms.forEach((p) => next.add(p));
    } else {
      groupPerms.forEach((p) => next.delete(p));
    }
    setFormPerms(next);
  }

  const filteredRoles = roles.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title="加载失败">{error}</Alert>;
  }

  return (
    <div>
      <PageHeader
        title="角色与权限管理"
        description="管理自定义角色和权限矩阵"
        actions={<Button icon="plus" onClick={openCreate}>创建角色</Button>}
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <SearchInput
          placeholder="搜索角色..."
          value={search}
          onChange={setSearch}
          className="search-input"
        />
      </div>

      {filteredRoles.length === 0 ? (
        <EmptyState
          title="暂无角色"
          description="点击上方按钮创建第一个自定义角色"
          action={{ label: "创建角色", onClick: openCreate }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredRoles.map((role) => (
            <Card key={role.id}>
              <CardBody>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 15 }}>{role.name}</strong>
                      {role.type === "system" ? (
                        <Badge variant="info" size="sm">系统</Badge>
                      ) : (
                        <Badge variant="default" size="sm">自定义</Badge>
                      )}
                    </div>
                    <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
                      {role.description || "无描述"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {role.permissions.slice(0, 8).map((p) => (
                        <Badge key={p} variant="info" size="sm">{p}</Badge>
                      ))}
                      {role.permissions.length > 8 && (
                        <Badge variant="default" size="sm">+{role.permissions.length - 8}</Badge>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" icon="edit" onClick={() => openEdit(role)}>
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" icon="copy" onClick={() => openClone(role)}>
                      克隆
                    </Button>
                    {role.type !== "system" && (
                      <Button variant="ghost" size="sm" icon="trash" onClick={() => setShowDelete(role)}>
                        删除
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* 权限矩阵展示 */}
      {permData && (
        <div style={{ marginTop: 16 }}>
        <Card>
          <CardHeader>权限矩阵</CardHeader>
          <CardBody>
            <div className="permission-matrix">
              <table>
                <thead>
                  <tr>
                    <th>模块</th>
                    <th>权限码</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permData.groups).map(([group, perms]) => (
                    <tr key={group}>
                      <td style={{ fontWeight: 500 }}>{group}</td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {perms.map((p) => (
                            <Badge key={p} variant="info" size="sm">{p}</Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      <Modal
        open={showCreate || showEdit !== null}
        onClose={() => { setShowCreate(false); setShowEdit(null); resetForm(); }}
        title={showCreate ? "创建角色" : "编辑角色"}
        size="lg"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {formError && <Alert type="error">{formError}</Alert>}
          <Input
            label="角色名称"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="例如：运营主管"
          />
          <Textarea
            label="角色描述"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="描述该角色的职责和权限范围"
          />
          <Divider label="权限选择" />
          {permData && Object.entries(permData.groups).map(([group, perms]) => {
            const allChecked = perms.every((p) => formPerms.has(p));
            const someChecked = perms.some((p) => formPerms.has(p));
            return (
              <div key={group}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Checkbox
                    label={group}
                    checked={allChecked}
                    onChange={(e) => toggleGroup(perms, e.target.checked)}
                  />
                  {someChecked && !allChecked && (
                    <Badge variant="warning" size="sm">部分</Badge>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingLeft: 24 }}>
                  {perms.map((p) => (
                    <Checkbox
                      key={p}
                      label={p}
                      checked={formPerms.has(p)}
                      onChange={() => togglePerm(p)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="ghost" onClick={() => { setShowCreate(false); setShowEdit(null); resetForm(); }}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={showCreate ? handleCreate : handleEdit}
            loading={saving}
          >
            {showCreate ? "创建" : "保存"}
          </Button>
        </div>
      </Modal>

      {/* 克隆弹窗 */}
      <Modal
        open={showClone !== null}
        onClose={() => { setShowClone(null); setCloneName(""); }}
        title="克隆角色"
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            label="新角色名称"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            placeholder="输入克隆后的角色名称"
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="ghost" onClick={() => { setShowClone(null); setCloneName(""); }}>
            取消
          </Button>
          <Button variant="primary" onClick={handleClone} loading={saving}>
            克隆
          </Button>
        </div>
      </Modal>

      {/* 删除确认 */}
      <ConfirmDialog
        open={showDelete !== null}
        title="删除角色"
        message={`确定要删除角色「${showDelete?.name}」吗？此操作不可撤销。`}
        variant="danger"
        confirmLabel="删除"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(null)}
        loading={saving}
      />
    </div>
  );
}
