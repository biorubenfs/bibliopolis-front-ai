export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'regular';
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  results: {
    type: 'users';
    id: string;
    attributes: User;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DecodedToken {
  id: string;
  role: 'admin' | 'regular';
  iat: number;
  exp: number;
}
