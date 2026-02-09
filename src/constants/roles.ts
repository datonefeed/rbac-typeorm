export const ROLES = {
  DIRECTOR: 'DIRECTOR',
  PROD_MANAGER: 'PROD_MANAGER',
  SHOP_OPERATOR: 'SHOP_OPERATOR',
  IT_ADMIN: 'IT_ADMIN',
  SUPERADMIN: 'SUPER_ADMIN'
} as const;

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  [ROLES.DIRECTOR]: 'Ban lãnh đạo: xem dashboard, báo cáo, Gantt (chỉ đọc)',
  [ROLES.PROD_MANAGER]: 'Quản lý sản xuất: điều hành dự án khuôn và kế hoạch',
  [ROLES.SHOP_OPERATOR]: 'Công nhân xưởng: xem kế hoạch và nhập giờ thực tế',
  [ROLES.IT_ADMIN]: 'Quản trị ứng dụng: quản lý user, role, permission, master data',
  [ROLES.SUPERADMIN]: 'Quản trị hệ thống: toàn quyền cấu hình và hỗ trợ kỹ thuật'
};

export type RoleType = typeof ROLES[keyof typeof ROLES];
