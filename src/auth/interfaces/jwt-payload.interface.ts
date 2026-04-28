import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  username: string;
  sub: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
