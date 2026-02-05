export interface User {
  id: string;
  email: string;
  isMasterAdmin?: boolean;
  emailVerified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface Alias {
  id: string;
  address: string;
  userId?: string;
  createdAt?: string;
  expiresAt: string;
  isActive: boolean;
  isPaused?: boolean;
  unreadCount?: number;
}

export interface Email {
  id: string;
  aliasId: string;
  sender: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead?: boolean;
  sizeBytes?: number;
}

export interface Invite {
  id: string;
  token: string;
  email?: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  isMasterAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export type ExtendDuration = '10min' | '1hour' | '1day' | '1week' | '1month';
