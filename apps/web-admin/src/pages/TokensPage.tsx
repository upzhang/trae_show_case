import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface ApiToken {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export function TokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newToken, setNewToken] = useState({ name: "", scopes: ["read"] as string[], expiresAt: "" });
  const [filter, setFilter] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const availableScopes = ["read", "write", "delete", "admin"];

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    setLoading(true);
    try {
      const response = await api.get("/tokens");
      setTokens(response.data);
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const response = await api.post("/tokens", newToken);
      alert(`Token 创建成功：${response.data.token}\n请妥善保存此 Token，仅显示一次！`);
      setShowCreateModal(false);
      setNewToken({ name: "", scopes: ["read"], expiresAt: "" });
      fetchTokens();
    } catch (error) {
      console.error("Failed to create token:", error);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("确定要删除这个 Token 吗？")) {
      try {
        await api.delete(`/tokens/${id}`);
        fetchTokens();
      } catch (error) {
        console.error("Failed to delete token:", error);
      }
    }
  }

  async function handleRotate(id: string) {
    if (confirm("确定要轮换这个 Token 吗？原 Token 将立即失效！")) {
      try {
        const response = await api.post(`/tokens/${id}/rotate`);
        alert(`新 Token：${response.data.token}\n请妥善保存！`);
        fetchTokens();
      } catch (error) {
        console.error("Failed to rotate token:", error);
      }
    }
  }

  async function copyToken(token: string, id: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  const filteredTokens = tokens.filter(t =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  function formatToken(token: string): string {
    if (token.length <= 12) return token;
    return `${token.slice(0, 6)}...${token.slice(-6)}`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>API Token 管理</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          创建 Token
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索 Token..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>Token</th>
                <th>权限范围</th>
                <th>到期时间</th>
                <th>使用次数</th>
                <th>最后使用</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map((token) => (
                <tr key={token.id}>
                  <td>{token.name}</td>
                  <td>
                    <div className="token-display">
                      <span className="mono">{formatToken(token.token)}</span>
                      <button 
                        onClick={() => copyToken(token.token, token.id)} 
                        className="copy-btn"
                      >
                        {copiedId === token.id ? "已复制" : "复制"}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="tags">
                      {token.scopes.map((scope) => (
                        <span key={scope} className="tag">{scope}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : "永久"}
                  </td>
                  <td>{token.usageCount}</td>
                  <td>
                    {token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : "从未使用"}
                  </td>
                  <td>{new Date(token.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    <button onClick={() => handleRotate(token.id)} className="btn-secondary">
                      轮换
                    </button>
                    <button onClick={() => handleDelete(token.id)} className="btn-danger">
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTokens.length === 0 && (
            <div className="empty-state">暂无 API Token</div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建 API Token</h2>
            <div className="form-group">
              <label>名称</label>
              <input
                type="text"
                value={newToken.name}
                onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                placeholder="输入 Token 名称"
              />
            </div>
            <div className="form-group">
              <label>权限范围</label>
              <div className="checkbox-grid">
                {availableScopes.map((scope) => (
                  <label key={scope} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={newToken.scopes.includes(scope)}
                      onChange={(e) => {
                        const scopes = [...newToken.scopes];
                        if (e.target.checked) {
                          scopes.push(scope);
                        } else {
                          scopes.splice(scopes.indexOf(scope), 1);
                        }
                        setNewToken({ ...newToken, scopes });
                      }}
                    />
                    {scope}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>到期时间（可选）</label>
              <input
                type="date"
                value={newToken.expiresAt ? new Date(newToken.expiresAt).toISOString().split("T")[0] : ""}
                onChange={(e) => setNewToken({ ...newToken, expiresAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : "" })}
              />
              <p className="hint">留空表示永久有效</p>
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
    </div>
  );
}