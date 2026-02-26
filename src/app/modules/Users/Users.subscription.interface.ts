// User Subscription Status Interface
export interface UserSubscriptionStatusResponse {
  canCreateAudit: boolean;
  needsSubscription: boolean;
  redirectToPlans: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  freeTrialInfo: {
    isFreeTrial: boolean;
    freeAuditsUsed: number;
    freeAuditsRemaining: number;
    maxFreeAudits: number;
  };
  subscriptionInfo: {
    hasActiveSubscription: boolean;
    subscriptionType?: string;
    planName?: string;
    startDate?: string;
    endDate?: string;
    daysRemaining?: number;
    isExpired: boolean;
  };
  auditCredits: {
    remaining: number;
    total: number;
  };
  academyInfo: {
    hasAcademyAccess: boolean;
    moduleComplete: number;
    totalScore: number;
    isGraduate: boolean;
    totalAttempts: number;
  };
  recommendations: {
    action: 'can_create' | 'subscribe_required' | 'upgrade_recommended' | 'expired_renew';
    message: string;
    suggestedPlans?: string[];
  };
  limits: {
    dailyLimit?: number;
    monthlyLimit?: number;
    totalUsedToday?: number;
    totalUsedThisMonth?: number;
  };
}

// Quick Status Check Response (minimal data for fast checks)
export interface QuickStatusResponse {
  canCreateAudit: boolean;
  redirectToPlans: boolean;
  status: 'active' | 'trial' | 'expired' | 'no_subscription';
  remainingAudits: number;
  message: string;
}

// Subscription renewal reminder response
export interface SubscriptionReminderResponse {
  showReminder: boolean;
  urgency: 'low' | 'medium' | 'high';
  daysUntilExpiry: number;
  message: string;
  subscriptionInfo: {
    planName: string;
    endDate: string;
    autoRenewal: boolean;
  };
}

export interface UserAccessParams {
  userId: string;
  checkType?: 'full' | 'quick' | 'reminder';
}