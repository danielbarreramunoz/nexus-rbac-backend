export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
}
