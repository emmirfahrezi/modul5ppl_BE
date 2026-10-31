export interface JwtPayload {
  userId?: number;
  user_id?: number;
  email?: string;
  name?: string;
  role?: string;
  division?: string;
  unit_usaha_id?: number;
  positionId?: number;
  positionName?: string;
  permissions?: string[];
  sub?: number;
}
