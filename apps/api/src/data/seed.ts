import type {
  ActivityEvent,
  ApprovalRequest,
  AuditLog,
  ReleaseRecord,
  SupportRisk,
  Tenant,
  User
} from "@trae/shared";

const tenantNames = [
  "Acme 精密制造", "Orbit 金融科技", "Nova Retail 连锁零售", "Nexus Health 医疗科技",
  "Pivot Energy 新能源", "Helios 航天工程", "Verdant 绿色农业", "Quantum 量子科技",
  "Aurora 极光软件", "BlueSky 蓝天物流", "CyberTech 网络科技", "DataFlow 数据流",
  "EagleEye 鹰眼安防", "FutureWave 未来浪潮", "GoldenGate 金门贸易", "Horizon 地平线",
  "Infinity 无限科技", "Jade 翡翠传媒", "Kingdom 王国集团", "Luna 月球科技"
];

const industries = ["高端制造", "金融 SaaS", "连锁零售", "医疗健康", "新能源", "航空航天", "现代农业", "软件服务", "物流运输", "网络安全"];
const plans = ["enterprise", "standard"];
const csms = ["林墨", "周然", "陈屿", "方澜", "苏嘉宁"];

export const tenants: Tenant[] = tenantNames.map((name, index) => ({
  id: `tenant-${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
  name,
  plan: plans[index % plans.length],
  industry: industries[index % industries.length],
  healthScore: Math.floor(Math.random() * 40) + 60,
  contractEndsAt: `202${Math.floor(Math.random() * 2) + 6}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  customerSuccessManager: csms[index % csms.length],
  seatsUsed: Math.floor(Math.random() * 200) + 10,
  seatsLimit: Math.floor(Math.random() * 200) + 50,
  monthlyActiveUsers: Math.floor(Math.random() * 180) + 10,
  arr: Math.floor(Math.random() * 2000000) + 100000
}));

const userNames = [
  "苏嘉宁", "林墨", "周然", "陈屿", "方澜", "谢之", "唐砚", "柯澜", "白川", "沈砚",
  "江云", "苏岚", "方墨", "郑衡", "李悦", "王浩", "张明", "刘芳", "陈伟", "刘洋",
  "杨帆", "赵静", "黄丽", "吴强", "徐敏", "孙伟", "马丽", "朱军", "胡杰", "郭英",
  "何勇", "高磊", "罗燕", "林涛", "钟华", "梁伟", "宋敏", "许强", "邓丽", "韩杰"
];

const roles = ["tenant_admin", "member", "auditor", "release_manager"];

export const users: User[] = [];
tenants.forEach((tenant) => {
  const tenantRoleCount = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < tenantRoleCount; i++) {
    const baseIndex = (tenants.indexOf(tenant) * 4 + i) % userNames.length;
    const role = roles[i % roles.length];
    users.push({
      id: `u-${tenant.id}-${role}-${i}`,
      tenantId: tenant.id,
      name: userNames[baseIndex],
      email: `${userNames[baseIndex].toLowerCase().replace(/\s+/g, "")}@${tenant.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}.example.com`,
      roles: [role],
      isActive: Math.random() > 0.1
    });
  }
});

users.push({
  id: "u-platform",
  tenantId: "tenant-acme",
  name: "平台管理员",
  email: "platform@example.com",
  roles: ["platform_admin"],
  isActive: true
});

const approvalTitles = [
  "开通生产环境 SSO 单点登录", "调整审批流超时时间", "提升租户席位上限",
  "开通门店批量导入灰度", "医疗数据接口白名单调整", "生产环境新增部署节点",
  "新能源场站数据接入授权", "续约合同评审", "开放 ERP 数据导出权限",
  "零售促销模板批量发布审批", "API 访问权限调整", "数据导出格式变更",
  "安全策略更新", "系统集成配置", "用户权限批量调整", "审计日志保留期限调整",
  "告警规则配置", "Webhook 配置更新", "SSO 元数据更新", "存储容量扩容"
];

const approvalStatuses: ApprovalRequest["status"][] = ["pending", "approved", "rejected"];

export const approvals: ApprovalRequest[] = [];
for (let i = 0; i < 50; i++) {
  const tenant = tenants[i % tenants.length];
  const tenantUsers = users.filter(u => u.tenantId === tenant.id);
  const status = approvalStatuses[Math.floor(Math.random() * approvalStatuses.length)];
  const requestedBy = tenantUsers[Math.floor(Math.random() * tenantUsers.length)]?.id || "u-platform";
  
  approvals.push({
    id: `ap-${String(i + 1001).padStart(4, "0")}`,
    tenantId: tenant.id,
    title: approvalTitles[i % approvalTitles.length],
    status,
    requestedBy,
    decidedBy: status !== "pending" ? (tenantUsers[Math.floor(Math.random() * tenantUsers.length)]?.id || "u-platform") : undefined,
    createdAt: `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00.000Z`
  });
}

const environments: ReleaseRecord["environment"][] = ["production", "staging", "development"];
const releaseStatuses: ReleaseRecord["status"][] = ["pending", "deployed", "rolled_back", "failed"];

export const releases: ReleaseRecord[] = [];
for (let i = 0; i < 80; i++) {
  const tenant = tenants[i % tenants.length];
  const tenantUsers = users.filter(u => u.tenantId === tenant.id && u.roles.includes("release_manager"));
  const operatorId = tenantUsers.length > 0 
    ? tenantUsers[Math.floor(Math.random() * tenantUsers.length)].id 
    : tenantUsers[Math.floor(Math.random() * tenantUsers.length)]?.id || "u-platform";
  
  releases.push({
    id: `rel-${2026}${String(Math.floor(Math.random() * 6) + 1).padStart(2, "0")}${String(Math.floor(Math.random() * 30) + 1).padStart(2, "0")}-${i}`,
    tenantId: tenant.id,
    version: `2026.0${Math.floor(Math.random() * 6) + 1}.${Math.floor(Math.random() * 30) + 1}`,
    environment: environments[Math.floor(Math.random() * environments.length)],
    status: releaseStatuses[Math.floor(Math.random() * releaseStatuses.length)],
    operatorId,
    createdAt: `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00.000Z`,
    deployedAt: Math.random() > 0.3 ? `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00.000Z` : undefined,
    rolledBackAt: Math.random() > 0.8 ? `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00.000Z` : undefined
  });
}

const auditActions = [
  "approval.approved", "approval.rejected", "approval.created",
  "release.deployed", "release.rolled_back", "release.created",
  "user.created", "user.updated", "user.deleted",
  "tenant.created", "tenant.updated", "tenant.deleted",
  "role.created", "role.updated", "role.deleted",
  "webhook.created", "webhook.updated", "webhook.deleted",
  "token.created", "token.revoked"
];

export const auditLogs: AuditLog[] = [];
for (let i = 0; i < 150; i++) {
  const tenant = tenants[i % tenants.length];
  const tenantUsers = users.filter(u => u.tenantId === tenant.id);
  const actorId = tenantUsers[Math.floor(Math.random() * tenantUsers.length)]?.id || "u-platform";
  const action = auditActions[Math.floor(Math.random() * auditActions.length)];
  
  auditLogs.push({
    id: `log-${i + 1}`,
    tenantId: tenant.id,
    actorId,
    action,
    summary: `${action.replace(".", " ")} ${Math.random().toString(36).substr(2, 8)}`,
    createdAt: `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}.000Z`,
    details: Math.random() > 0.5 ? { resourceId: `res-${Math.random().toString(36).substr(2, 9)}` } : undefined
  });
}

const riskTitles = [
  "生产环境回滚后客户仍收到旧版通知", "SSO 元数据即将过期",
  "门店批量导入失败率高于阈值", "月活连续两周下降超过 15%",
  "合同增购报价待客户确认", "医疗数据接口白名单审批超时",
  "客户活跃数据连续三周未上报", "生产环境新增节点审计合规性评估",
  "场站接入数据导出权限调整工单", "API 响应时间超过阈值",
  "数据库连接池耗尽", "内存使用率过高", "磁盘空间不足",
  "网络延迟增加", "安全漏洞扫描发现高危问题", "SSL 证书即将过期",
  "第三方服务集成失败", "数据同步延迟", "用户认证失败率上升",
  "日志采集中断"
];

const riskSeverities: SupportRisk["severity"][] = ["critical", "high", "medium", "low"];
const riskStatuses: SupportRisk["status"][] = ["open", "in_progress", "waiting_customer", "resolved"];
const riskCategories: SupportRisk["category"][] = ["release", "security", "support", "adoption", "billing"];

export const supportRisks: SupportRisk[] = [];
for (let i = 0; i < 40; i++) {
  const tenant = tenants[i % tenants.length];
  const tenantUsers = users.filter(u => u.tenantId === tenant.id);
  const severity = riskSeverities[Math.floor(Math.random() * riskSeverities.length)];
  const status = riskStatuses[Math.floor(Math.random() * riskStatuses.length)];
  
  supportRisks.push({
    id: `risk-${String(i + 1001).padStart(4, "0")}`,
    tenantId: tenant.id,
    title: riskTitles[i % riskTitles.length],
    severity,
    status,
    slaDueAt: `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:00:00.000Z`,
    ownerId: tenantUsers[Math.floor(Math.random() * tenantUsers.length)]?.id || "u-platform",
    category: riskCategories[Math.floor(Math.random() * riskCategories.length)],
    impact: `影响 ${Math.floor(Math.random() * 50)} 个用户/商户`,
    createdAt: `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00.000Z`,
    resolvedAt: status === "resolved" ? `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00.000Z` : undefined
  });
}

const eventTypes: ActivityEvent["type"][] = ["risk", "approval", "release", "user", "audit", "tenant"];

export const activityEvents: ActivityEvent[] = [];
for (let i = 0; i < 180; i++) {
  const tenant = tenants[i % tenants.length];
  const tenantUsers = users.filter(u => u.tenantId === tenant.id);
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  let title = "";
  switch (type) {
    case "risk":
      title = `${Math.random() > 0.5 ? "新增风险" : "风险状态变更"}: ${riskTitles[i % riskTitles.length]}`;
      break;
    case "approval":
      title = `${Math.random() > 0.5 ? "审批已提交" : "审批已处理"}: ${approvalTitles[i % approvalTitles.length]}`;
      break;
    case "release":
      title = `${Math.random() > 0.5 ? "发布已部署" : "发布已回滚"}: ${releases[i % releases.length]?.version || "unknown"}`;
      break;
    case "user":
      title = `${Math.random() > 0.5 ? "新增用户" : "用户权限更新"}`;
      break;
    case "tenant":
      title = `${Math.random() > 0.5 ? "租户信息更新" : "席位调整"}`;
      break;
    case "audit":
      title = `审计记录: ${auditActions[i % auditActions.length]}`;
      break;
  }
  
  activityEvents.push({
    id: `evt-${String(i + 1001).padStart(4, "0")}`,
    tenantId: tenant.id,
    type,
    title,
    actorId: tenantUsers[Math.floor(Math.random() * tenantUsers.length)]?.id || "u-platform",
    targetId: `${type}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: `2026-0${Math.floor(Math.random() * 6) + 1}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}.000Z`
  });
}