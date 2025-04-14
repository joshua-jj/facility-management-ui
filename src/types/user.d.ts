export interface User {
  user: { [key: string]: unknown };
  refreshToken: string;
  token: string;
}

export interface UserDetail {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  phoneNumber: string;
  role: string;
}
