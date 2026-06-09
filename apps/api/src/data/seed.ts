import type {
  ActivityEvent,
  ApprovalRequest,
  AuditLog,
  ReleaseRecord,
  SupportRisk,
  Tenant,
  User
} from "@trae/shared";

export const tenants: Tenant[] = [
  {
    id: "tenant-acme",
    name: "Acme 精密制造",
    plan: "enterprise",
    industry: "高端制造",
    healthScore: 92,
    contractEndsAt: "2027-03-31",
    customerSuccessManager: "林墨",
    seatsUsed: 238,
    seatsLimit: 300,
    monthlyActiveUsers: 212,
    arr: 1860000
  },
  {
    id: "tenant-orbit",
    name: "Orbit 金融科技",
    plan: "standard",
    industry: "金融 SaaS",
    healthScore: 68,
    contractEndsAt: "2026-09-15",
    customerSuccessManager: "周然",
    seatsUsed: 84,
    seatsLimit: 120,
    monthlyActiveUsers: 73,
    arr: 620000
  },
  {
    id: "tenant-nova",
    name: "Nova Retail 连锁零售",
    plan: "enterprise",
    industry: "连锁零售",
    healthScore: 77,
    contractEndsAt: "2026-12-20",
    customerSuccessManager: "陈屿",
    seatsUsed: 156,
    seatsLimit: 220,
    monthlyActiveUsers: 141,
    arr: 980000
  },
  {
    id: "tenant-nexus",
    name: "Nexus Health 医疗科技",
    plan: "enterprise",
    industry: "医疗健康",
    healthScore: 81,
    contractEndsAt: "2027-01-18",
    customerSuccessManager: "方澜",
    seatsUsed: 98,
    seatsLimit: 150,
    monthlyActiveUsers: 89,
    arr: 740000
  },
  {
    id: "tenant-pivot",
    name: "Pivot Energy 新能源",
    plan: "standard",
    industry: "新能源",
    healthScore: 85,
    contractEndsAt: "2027-05-02",
    customerSuccessManager: "苏嘉宁",
    seatsUsed: 52,
    seatsLimit: 80,
    monthlyActiveUsers: 45,
    arr: 420000
  },
  {
    id: "tenant-helios",
    name: "Helios 航天工程",
    plan: "enterprise",
    industry: "航空航天",
    healthScore: 95,
    contractEndsAt: "2027-08-18",
    customerSuccessManager: "林墨",
    seatsUsed: 180,
    seatsLimit: 200,
    monthlyActiveUsers: 172,
    arr: 1580000
  },
  {
    id: "tenant-verdant",
    name: "Verdant 绿色农业",
    plan: "standard",
    industry: "现代农业",
    healthScore: 54,
    contractEndsAt: "2026-08-10",
    customerSuccessManager: "方澜",
    seatsUsed: 28,
    seatsLimit: 100,
    monthlyActiveUsers: 21,
    arr: 280000
  }
];

export const users: User[] = [
  {
    id: "u-platform",
    tenantId: "tenant-acme",
    name: "平台管理员",
    email: "platform@example.com",
    roles: ["platform_admin"]
  },
  {
    id: "u-tenant-admin",
    tenantId: "tenant-acme",
    name: "苏嘉宁",
    email: "jianing.su@acme-mfg.example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-auditor",
    tenantId: "tenant-acme",
    name: "审计员",
    email: "audit@example.com",
    roles: ["auditor"]
  },
  {
    id: "u-release",
    tenantId: "tenant-acme",
    name: "发布经理",
    email: "release@example.com",
    roles: ["release_manager"]
  },
  {
    id: "u-orbit-admin",
    tenantId: "tenant-orbit",
    name: "周然",
    email: "ran.zhou@orbit-fin.example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-orbit-member",
    tenantId: "tenant-orbit",
    name: "李悦",
    email: "yue.li@orbit-fin.example.com",
    roles: ["member"]
  },
  {
    id: "u-orbit-auditor",
    tenantId: "tenant-orbit",
    name: "郑衡",
    email: "heng.zheng@orbit-fin.example.com",
    roles: ["auditor"]
  },
  {
    id: "u-nova-admin",
    tenantId: "tenant-nova",
    name: "陈屿",
    email: "yu.chen@nova-retail.example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-nova-member",
    tenantId: "tenant-nova",
    name: "柯澜",
    email: "lan.ke@nova-retail.example.com",
    roles: ["member"]
  },
  {
    id: "u-nova-release",
    tenantId: "tenant-nova",
    name: "唐砚",
    email: "yan.tang@nova-retail.example.com",
    roles: ["release_manager"]
  },
  {
    id: "u-nexus-admin",
    tenantId: "tenant-nexus",
    name: "方澜",
    email: "lan.fang@nexus-health.example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-nexus-auditor",
    tenantId: "tenant-nexus",
    name: "白川",
    email: "chuan.bai@nexus-health.example.com",
    roles: ["auditor"]
  },
  {
    id: "u-nexus-member",
    tenantId: "tenant-nexus",
    name: "沈砚",
    email: "yan.shen@nexus-health.example.com",
    roles: ["member"]
  },
  {
    id: "u-pivot-admin",
    tenantId: "tenant-pivot",
    name: "江云",
    email: "yun.jiang@pivot-energy.example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-helios-admin",
    tenantId: "tenant-helios",
    name: "苏岚",
    email: "lan.su@helios-aero.example.com",
    roles: ["tenant_admin"]
  },
  {
    id: "u-helios-release",
    tenantId: "tenant-helios",
    name: "谢之",
    email: "zhi.xie@helios-aero.example.com",
    roles: ["release_manager"]
  },
  {
    id: "u-verdant-admin",
    tenantId: "tenant-verdant",
    name: "方墨",
    email: "mo.fang@verdant-agri.example.com",
    roles: ["tenant_admin"]
  }
];

export const approvals: ApprovalRequest[] = [
  {
    id: "ap-1001",
    tenantId: "tenant-acme",
    title: "开通生产环境 SSO 单点登录",
    status: "pending",
    requestedBy: "u-tenant-admin"
  },
  {
    id: "ap-1002",
    tenantId: "tenant-acme",
    title: "调整审批流超时时间",
    status: "approved",
    requestedBy: "u-platform",
    decidedBy: "u-release"
  },
  {
    id: "ap-1003",
    tenantId: "tenant-orbit",
    title: "提升金融风控租户席位上限",
    status: "pending",
    requestedBy: "u-orbit-admin"
  },
  {
    id: "ap-1004",
    tenantId: "tenant-nova",
    title: "开通门店批量导入灰度",
    status: "rejected",
    requestedBy: "u-nova-member",
    decidedBy: "u-platform"
  },
  {
    id: "ap-1005",
    tenantId: "tenant-nexus",
    title: "医疗数据接口白名单调整",
    status: "pending",
    requestedBy: "u-nexus-admin"
  },
  {
    id: "ap-1006",
    tenantId: "tenant-helios",
    title: "生产环境新增 2 个部署节点",
    status: "pending",
    requestedBy: "u-helios-admin"
  },
  {
    id: "ap-1007",
    tenantId: "tenant-pivot",
    title: "新能源场站数据接入授权",
    status: "approved",
    requestedBy: "u-pivot-admin",
    decidedBy: "u-platform"
  },
  {
    id: "ap-1008",
    tenantId: "tenant-verdant",
    title: "续约合同评审（半年期）",
    status: "pending",
    requestedBy: "u-verdant-admin"
  },
  {
    id: "ap-1009",
    tenantId: "tenant-acme",
    title: "开放 ERP 数据导出权限",
    status: "approved",
    requestedBy: "u-tenant-admin",
    decidedBy: "u-platform"
  },
  {
    id: "ap-1010",
    tenantId: "tenant-nova",
    title: "零售促销模板批量发布审批",
    status: "pending",
    requestedBy: "u-nova-release"
  }
];

export const releases: ReleaseRecord[] = [
  {
    id: "rel-20260601",
    tenantId: "tenant-acme",
    version: "2026.06.01",
    environment: "production",
    status: "deployed",
    operatorId: "u-release",
    createdAt: "2026-06-01T10:00:00.000Z"
  },
  {
    id: "rel-20260605",
    tenantId: "tenant-acme",
    version: "2026.06.05",
    environment: "staging",
    status: "pending",
    operatorId: "u-release",
    createdAt: "2026-06-05T15:00:00.000Z"
  },
  {
    id: "rel-20260606",
    tenantId: "tenant-orbit",
    version: "2026.06.06",
    environment: "production",
    status: "rolled_back",
    operatorId: "u-platform",
    createdAt: "2026-06-06T09:20:00.000Z"
  },
  {
    id: "rel-20260608",
    tenantId: "tenant-nova",
    version: "2026.06.08",
    environment: "staging",
    status: "deployed",
    operatorId: "u-release",
    createdAt: "2026-06-08T13:10:00.000Z"
  },
  {
    id: "rel-20260609",
    tenantId: "tenant-nexus",
    version: "2026.06.09",
    environment: "production",
    status: "deployed",
    operatorId: "u-nexus-admin",
    createdAt: "2026-06-09T08:00:00.000Z"
  },
  {
    id: "rel-20260528",
    tenantId: "tenant-helios",
    version: "2026.05.28",
    environment: "production",
    status: "deployed",
    operatorId: "u-helios-release",
    createdAt: "2026-05-28T09:45:00.000Z"
  },
  {
    id: "rel-20260515",
    tenantId: "tenant-orbit",
    version: "2026.05.15",
    environment: "staging",
    status: "deployed",
    operatorId: "u-orbit-admin",
    createdAt: "2026-05-15T14:00:00.000Z"
  },
  {
    id: "rel-20260510",
    tenantId: "tenant-pivot",
    version: "2026.05.10",
    environment: "production",
    status: "deployed",
    operatorId: "u-pivot-admin",
    createdAt: "2026-05-10T11:00:00.000Z"
  },
  {
    id: "rel-20260603",
    tenantId: "tenant-nova",
    version: "2026.06.03",
    environment: "production",
    status: "deployed",
    operatorId: "u-nova-release",
    createdAt: "2026-06-03T16:00:00.000Z"
  },
  {
    id: "rel-20260607",
    tenantId: "tenant-verdant",
    version: "2026.06.07",
    environment: "staging",
    status: "pending",
    operatorId: "u-verdant-admin",
    createdAt: "2026-06-07T17:20:00.000Z"
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: "log-1",
    tenantId: "tenant-acme",
    actorId: "u-platform",
    action: "approval.approved",
    summary: "审批 ap-1002 已通过",
    createdAt: "2026-06-02T08:30:00.000Z"
  },
  {
    id: "log-2",
    tenantId: "tenant-nova",
    actorId: "u-platform",
    action: "approval.rejected",
    summary: "审批 ap-1004 被拒绝",
    createdAt: "2026-06-04T17:20:00.000Z"
  },
  {
    id: "log-3",
    tenantId: "tenant-orbit",
    actorId: "u-platform",
    action: "release.rolled_back",
    summary: "发布 rel-20260606 回滚",
    createdAt: "2026-06-06T09:25:00.000Z"
  },
  {
    id: "log-4",
    tenantId: "tenant-helios",
    actorId: "u-helios-release",
    action: "release.deployed",
    summary: "发布 rel-20260528 部署到生产",
    createdAt: "2026-05-28T09:48:00.000Z"
  },
  {
    id: "log-5",
    tenantId: "tenant-nexus",
    actorId: "u-nexus-admin",
    action: "release.deployed",
    summary: "发布 rel-20260609 部署到生产",
    createdAt: "2026-06-09T08:02:00.000Z"
  },
  {
    id: "log-6",
    tenantId: "tenant-pivot",
    actorId: "u-platform",
    action: "approval.approved",
    summary: "审批 ap-1007 已通过",
    createdAt: "2026-06-08T14:12:00.000Z"
  }
];

export const supportRisks: SupportRisk[] = [
  {
    id: "risk-1001",
    tenantId: "tenant-orbit",
    title: "生产环境回滚后客户仍收到旧版账单通知",
    severity: "critical",
    status: "in_progress",
    slaDueAt: "2026-06-09T22:00:00.000Z",
    ownerId: "u-platform",
    category: "release",
    impact: "影响 12 家子商户的账单通知准确性",
    createdAt: "2026-06-09T09:10:00.000Z"
  },
  {
    id: "risk-1002",
    tenantId: "tenant-acme",
    title: "SSO 元数据即将过期",
    severity: "high",
    status: "open",
    slaDueAt: "2026-06-10T12:00:00.000Z",
    ownerId: "u-tenant-admin",
    category: "security",
    impact: "可能导致 238 个企业席位无法登录",
    createdAt: "2026-06-09T10:20:00.000Z"
  },
  {
    id: "risk-1003",
    tenantId: "tenant-nova",
    title: "门店批量导入失败率高于阈值",
    severity: "medium",
    status: "waiting_customer",
    slaDueAt: "2026-06-11T18:00:00.000Z",
    ownerId: "u-release",
    category: "support",
    impact: "影响华东区域 34 家门店初始化效率",
    createdAt: "2026-06-08T16:40:00.000Z"
  },
  {
    id: "risk-1004",
    tenantId: "tenant-orbit",
    title: "月活连续两周下降超过 15%",
    severity: "medium",
    status: "open",
    slaDueAt: "2026-06-12T10:00:00.000Z",
    ownerId: "u-orbit-admin",
    category: "adoption",
    impact: "续约健康度从 76 降至 68",
    createdAt: "2026-06-07T11:15:00.000Z"
  },
  {
    id: "risk-1005",
    tenantId: "tenant-acme",
    title: "合同增购报价待客户确认",
    severity: "low",
    status: "resolved",
    slaDueAt: "2026-06-13T17:00:00.000Z",
    ownerId: "u-platform",
    category: "billing",
    impact: "预计新增 60 个席位 ARR",
    createdAt: "2026-06-06T14:05:00.000Z"
  },
  {
    id: "risk-1006",
    tenantId: "tenant-nexus",
    title: "医疗数据接口白名单审批超时",
    severity: "critical",
    status: "open",
    slaDueAt: "2026-06-10T08:00:00.000Z",
    ownerId: "u-nexus-admin",
    category: "security",
    impact: "已影响 5 家试点医院的数据同步",
    createdAt: "2026-06-09T07:50:00.000Z"
  },
  {
    id: "risk-1007",
    tenantId: "tenant-verdant",
    title: "客户活跃数据连续三周未上报",
    severity: "high",
    status: "in_progress",
    slaDueAt: "2026-06-10T18:00:00.000Z",
    ownerId: "u-verdant-admin",
    category: "adoption",
    impact: "续约风险较高，需 CSM 主动触达",
    createdAt: "2026-06-08T10:00:00.000Z"
  },
  {
    id: "risk-1008",
    tenantId: "tenant-helios",
    title: "生产环境新增节点审计合规性评估",
    severity: "medium",
    status: "open",
    slaDueAt: "2026-06-14T12:00:00.000Z",
    ownerId: "u-helios-release",
    category: "security",
    impact: "需要完成合规自评后才可部署",
    createdAt: "2026-06-09T08:20:00.000Z"
  },
  {
    id: "risk-1009",
    tenantId: "tenant-pivot",
    title: "场站接入数据导出权限调整工单",
    severity: "low",
    status: "resolved",
    slaDueAt: "2026-06-08T12:00:00.000Z",
    ownerId: "u-pivot-admin",
    category: "support",
    impact: "已按最新权限策略调整完成",
    createdAt: "2026-06-07T09:00:00.000Z"
  }
];

export const activityEvents: ActivityEvent[] = [
  {
    id: "evt-1001",
    tenantId: "tenant-orbit",
    type: "risk",
    title: "高危风险进入处理中：生产环境回滚后客户仍收到旧版账单通知",
    actorId: "u-platform",
    targetId: "risk-1001",
    createdAt: "2026-06-09T10:30:00.000Z"
  },
  {
    id: "evt-1002",
    tenantId: "tenant-acme",
    type: "approval",
    title: "审批已提交：开通生产环境 SSO 单点登录",
    actorId: "u-tenant-admin",
    targetId: "ap-1001",
    createdAt: "2026-06-09T09:40:00.000Z"
  },
  {
    id: "evt-1003",
    tenantId: "tenant-nova",
    type: "release",
    title: "灰度发布 2026.06.08 已部署到 staging",
    actorId: "u-release",
    targetId: "rel-20260608",
    createdAt: "2026-06-08T13:12:00.000Z"
  },
  {
    id: "evt-1004",
    tenantId: "tenant-orbit",
    type: "release",
    title: "生产发布 2026.06.06 触发回滚",
    actorId: "u-platform",
    targetId: "rel-20260606",
    createdAt: "2026-06-06T09:25:00.000Z"
  },
  {
    id: "evt-1005",
    tenantId: "tenant-acme",
    type: "user",
    title: "新增企业席位 24 个，月活达到 212",
    actorId: "u-platform",
    targetId: "tenant-acme",
    createdAt: "2026-06-05T15:30:00.000Z"
  },
  {
    id: "evt-1006",
    tenantId: "tenant-nova",
    type: "approval",
    title: "审批被拒绝：开通门店批量导入灰度",
    actorId: "u-platform",
    targetId: "ap-1004",
    createdAt: "2026-06-04T17:20:00.000Z"
  },
  {
    id: "evt-1007",
    tenantId: "tenant-acme",
    type: "audit",
    title: "审计记录：审批 ap-1002 已通过",
    actorId: "u-platform",
    targetId: "log-1",
    createdAt: "2026-06-02T08:30:00.000Z"
  },
  {
    id: "evt-1008",
    tenantId: "tenant-orbit",
    type: "user",
    title: "Orbit 客户管理员完成角色初始化",
    actorId: "u-orbit-admin",
    targetId: "u-orbit-admin",
    createdAt: "2026-06-01T11:00:00.000Z"
  },
  {
    id: "evt-1009",
    tenantId: "tenant-nexus",
    type: "risk",
    title: "医疗数据接口白名单审批超时告警已触发",
    actorId: "u-nexus-admin",
    targetId: "risk-1006",
    createdAt: "2026-06-09T07:55:00.000Z"
  },
  {
    id: "evt-1010",
    tenantId: "tenant-nexus",
    type: "release",
    title: "生产发布 2026.06.09 已部署",
    actorId: "u-nexus-admin",
    targetId: "rel-20260609",
    createdAt: "2026-06-09T08:01:00.000Z"
  },
  {
    id: "evt-1011",
    tenantId: "tenant-helios",
    type: "release",
    title: "生产发布 2026.05.28 已部署",
    actorId: "u-helios-release",
    targetId: "rel-20260528",
    createdAt: "2026-05-28T09:46:00.000Z"
  },
  {
    id: "evt-1012",
    tenantId: "tenant-helios",
    type: "approval",
    title: "审批已提交：生产环境新增 2 个部署节点",
    actorId: "u-helios-admin",
    targetId: "ap-1006",
    createdAt: "2026-06-09T08:22:00.000Z"
  },
  {
    id: "evt-1013",
    tenantId: "tenant-pivot",
    type: "risk",
    title: "场站接入数据导出权限调整工单已解决",
    actorId: "u-pivot-admin",
    targetId: "risk-1009",
    createdAt: "2026-06-08T10:20:00.000Z"
  },
  {
    id: "evt-1014",
    tenantId: "tenant-verdant",
    type: "risk",
    title: "客户活跃数据连续三周未上报，触发续约预警",
    actorId: "u-verdant-admin",
    targetId: "risk-1007",
    createdAt: "2026-06-08T10:10:00.000Z"
  },
  {
    id: "evt-1015",
    tenantId: "tenant-acme",
    type: "approval",
    title: "审批已通过：开放 ERP 数据导出权限",
    actorId: "u-platform",
    targetId: "ap-1009",
    createdAt: "2026-06-07T16:00:00.000Z"
  },
  {
    id: "evt-1016",
    tenantId: "tenant-nova",
    type: "release",
    title: "生产发布 2026.06.03 已部署",
    actorId: "u-nova-release",
    targetId: "rel-20260603",
    createdAt: "2026-06-03T16:05:00.000Z"
  }
];
