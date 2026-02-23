export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userNo: number;
  email: string;
  name: string;
}

export interface AuthUser {
  userNo: number;
  email: string;
  name: string;
}
