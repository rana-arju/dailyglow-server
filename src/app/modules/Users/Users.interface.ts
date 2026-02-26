import { Role, UserStatus } from '@prisma/client';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Search by name, email
  role?:  'USER' | 'all';
  status?: UserStatus | 'all';
  sortBy?: 'name' | 'email' | 'role' | 'status' | 'created' | 'updated';
  sortOrder?: 'asc' | 'desc';
  isVerified?: boolean;
  hasSubscription?: boolean;
}

export interface UserFilterOptions {
  search?: string;
  role?: Role;
  status?: UserStatus;
  isVerified?: boolean;
  hasSubscription?: boolean;
}

export interface UserListResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  location?: string; // Optional location field
  status: UserStatus;
  isVerified: boolean;
  isEmailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  hasActiveSubscription: boolean;
  totalAudits: number;
  lastActivity: Date;
}

export interface UserPaginatedResponse {
  data: UserListResponse[];
  meta: {
    total: number;
    page: number;
    totalPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// User Profile Interfaces
export interface UserProfileStats {
  // Basic user info
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
  role: Role;
  status: UserStatus;
  
  // Subscription info
  subscriptionType: string; // e.g., "SmartBuyer", "Premium Dealer", etc.
  memberSince: Date; // user createdAt
  
  // Audit stats
  totalAuditGenerated: number;
  
  // Subscription stats
  totalPlanPurchased: number;
  
  // Academy stats
  totalAttempts: number; // from academy table
  academyRecord?: {
    totalScore: number;
    moduleComplete: number;
    totalTimeTaken: number;
    isGraduate: boolean;
  } | null;
}

export interface UserAuditItem {
  id: string;
  auditId: string;
  buyerName: string | null;
  dealerName: string;
  vinNumber: string | null;
  trustScore: number;
  academyResult?: 'View' | 'Download' | null; // Based on some logic
  dateTime: Date;
  createdAt: Date;
}

export interface UserAuditListParams {
  userId: string;
  page?: number;
  limit?: number;
  search?: string; // Search by buyer name, dealer name, VIN
  sortBy?: 'dateTime' | 'trustScore' | 'vinNumber' | 'dealerName';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface UserAuditListResponse {
  data: UserAuditItem[];
  meta: {
    total: number;
    page: number;
    totalPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
