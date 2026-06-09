import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: "boolean" | "number" | "string" | "select";
  defaultValue: unknown;
  isEnabled: boolean;
  rolloutPercentage?: number;
  tenantOverrides?: { tenantId: string; value: unknown; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);
  const [newFeature, setNewFeature] = useState({
    key: "",
    name: "",
    description: "",
    type: "boolean" as FeatureFlag["type"],
    defaultValue: true
  });
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideTenantId, setOverrideTenantId] = useState("");

  useEffect(() => {
    fetchFeatures();
  }, []);

  async function fetchFeatures() {
    setLoading(true);
    try {
      const response = await api.get("/features");
      setFeatures(response.data);
    } catch (error) {
      console.error("Failed to fetch features:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await api.post("/features", newFeature);
      setShowCreateModal(false);
      setNewFeature({ key: "", name: "", description: "", type: "boolean", defaultValue: true });
      fetchFeatures();
    } catch (error) {
      console.error("Failed to create feature:", error);
    }
  }

  async function handleToggle(feature: FeatureFlag) {
    try {
      await api.put(`/features/${feature.key}`, { isEnabled: !feature.isEnabled });
      fetchFeatures();
    } catch (error) {
      console.error("Failed to toggle feature:", error);
    }
  }

  async function handleAddOverride() {
    if (!selectedFeature) return;
    
    try {
      let value: unknown = overrideValue;
      if (selectedFeature.type === "boolean") {
        value = overrideValue === "true";
      } else if (selectedFeature.type === "number") {
        value = parseFloat(overrideValue);
      }
      
      await api.post(`/features/${selectedFeature.key}/override`, {
        overrideTenantId,
        value
      });
      setShowOverrideModal(false);
      setOverrideValue("");
      setOverrideTenantId("");
      fetchFeatures();
    } catch (error) {
      console.error("Failed to add override:", error);
    }
  }

  async function handleRemoveOverride(feature: FeatureFlag, tenantId: string) {
    try {
      await api.delete(`/features/${feature.key}/override/${tenantId}`);
      fetchFeatures();
    } catch (error) {
      console.error("Failed to remove override:", error);
    }
  }

  function getTypeLabel(type: FeatureFlag["type"]) {
    const labels = { boolean: "布尔", number: "数字", string: "字符串", select: "选择" };
    return labels[type];
  }

  function getTypeInput(type: FeatureFlag["type"], value: unknown) {
    switch (type) {
      case "boolean":
        return <input type="checkbox" checked={value === true} disabled />;
      case "number":
        return <input type="number" value={value as number} disabled />;
      default:
        return <input type="text" value={String(value)} disabled />;
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>功能开关管理</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          创建功能开关
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>键</th>
                <th>类型</th>
                <th>默认值</th>
                <th>状态</th>
                <th>灰度百分比</th>
                <th>租户覆盖</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.id}>
                  <td>{feature.name}</td>
                  <td className="mono">{feature.key}</td>
                  <td>{getTypeLabel(feature.type)}</td>
                  <td>{getTypeInput(feature.type, feature.defaultValue)}</td>
                  <td>
                    <span className={`status ${feature.isEnabled ? "active" : "inactive"}`}>
                      {feature.isEnabled ? "启用" : "禁用"}
                    </span>
                  </td>
                  <td>
                    {feature.rolloutPercentage !== undefined ? `${feature.rolloutPercentage}%` : "-"}
                  </td>
                  <td>
                    {feature.tenantOverrides?.length || 0}
                  </td>
                  <td className="actions">
                    <button onClick={() => handleToggle(feature)} className="btn-secondary">
                      {feature.isEnabled ? "禁用" : "启用"}
                    </button>
                    <button onClick={() => { setSelectedFeature(feature); setShowOverrideModal(true); }} className="btn-secondary">
                      添加覆盖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {features.length === 0 && (
            <div className="empty-state">暂无功能开关</div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建功能开关</h2>
            <div className="form-group">
              <label>键（key）</label>
              <input
                type="text"
                value={newFeature.key}
                onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value })}
                placeholder="例如: new_ui"
              />
            </div>
            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                placeholder="输入功能名称"
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={newFeature.description}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                placeholder="功能描述..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>类型</label>
              <select value={newFeature.type} onChange={(e) => setNewFeature({ ...newFeature, type: e.target.value as FeatureFlag["type"] })}>
                <option value="boolean">布尔</option>
                <option value="number">数字</option>
                <option value="string">字符串</option>
                <option value="select">选择</option>
              </select>
            </div>
            <div className="form-group">
              <label>默认值</label>
              {newFeature.type === "boolean" ? (
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={newFeature.defaultValue === true}
                    onChange={(e) => setNewFeature({ ...newFeature, defaultValue: e.target.checked })}
                  />
                  启用
                </label>
              ) : (
                <input
                  type={newFeature.type === "number" ? "number" : "text"}
                  value={String(newFeature.defaultValue)}
                  onChange={(e) => {
                    const val = newFeature.type === "number" ? parseFloat(e.target.value) : e.target.value;
                    setNewFeature({ ...newFeature, defaultValue: val });
                  }}
                  placeholder="输入默认值"
                />
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleCreate} className="btn-primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverrideModal && selectedFeature && (
        <div className="modal">
          <div className="modal-content">
            <h2>添加租户覆盖</h2>
            <p className="modal-hint">为 {selectedFeature.name} 添加租户特定的值覆盖</p>
            <div className="form-group">
              <label>租户 ID</label>
              <input
                type="text"
                value={overrideTenantId}
                onChange={(e) => setOverrideTenantId(e.target.value)}
                placeholder="例如: tenant-acme"
              />
            </div>
            <div className="form-group">
              <label>覆盖值</label>
              {selectedFeature.type === "boolean" ? (
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={overrideValue === "true"}
                    onChange={(e) => setOverrideValue(e.target.checked ? "true" : "false")}
                  />
                  启用
                </label>
              ) : (
                <input
                  type={selectedFeature.type === "number" ? "number" : "text"}
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder={`输入${getTypeLabel(selectedFeature.type)}值`}
                />
              )}
            </div>
            {selectedFeature.tenantOverrides && selectedFeature.tenantOverrides.length > 0 && (
              <div className="form-group">
                <label>现有覆盖</label>
                <div className="override-list">
                  {selectedFeature.tenantOverrides.map((override) => (
                    <div key={override.tenantId} className="override-item">
                      <span>{override.tenantId}: {String(override.value)}</span>
                      <button onClick={() => handleRemoveOverride(selectedFeature!, override.tenantId)} className="btn-danger btn-sm">
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => { setShowOverrideModal(false); setOverrideValue(""); setOverrideTenantId(""); }} className="btn-secondary">
                取消
              </button>
              <button onClick={handleAddOverride} className="btn-primary">
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}