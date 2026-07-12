// Типы, относящиеся к пользователю и аутентификации.

// Текущий авторизованный пользователь.
export interface User {
  id: number;
  email: string;
  role: string;
  balance?: number;
}