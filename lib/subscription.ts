import { SubscriptionTier } from '@prisma/client'

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 147,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Up to 3 user accounts',
      'Unlimited cases & clients',
      '50GB document storage',
      'Time tracking & invoicing',
      'Client portal',
      'End-to-end encryption',
      '2FA security',
      'Email support (48h)',
    ],
    limits: {
      users: 3,
      storage: 50 * 1024 * 1024 * 1024, // 50GB in bytes
    },
  },
  PRO: {
    name: 'Pro',
    price: 297,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Up to 6 user accounts',
      'Everything in Basic',
      'AI Document Analyzer',
      'OCR & text extraction',
      'Document summarization',
      'Risk assessment',
      '200GB storage',
      'Advanced reporting',
      'API access',
      'Priority support (24h)',
    ],
    limits: {
      users: 6,
      storage: 200 * 1024 * 1024 * 1024, // 200GB in bytes
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 497,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Unlimited user accounts',
      'Everything in Pro',
      'AI Legal Assistant Chatbot',
      'Legal research assistance',
      'Document drafting AI',
      'Unlimited storage',
      'SSO integration',
      'White-label options',
      'Dedicated support (4h)',
      'Custom integrations',
    ],
    limits: {
      users: Infinity,
      storage: Infinity,
    },
  },
}

export function getSubscriptionLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_PLANS[tier].limits
}

export function canAccessFeature(tier: SubscriptionTier, feature: string): boolean {
  const featureAccess: Record<string, SubscriptionTier[]> = {
    'basic_features': ['BASIC', 'PRO', 'ENTERPRISE'],
    'document_analyzer': ['PRO', 'ENTERPRISE'],
    'ai_chatbot': ['ENTERPRISE'],
    'api_access': ['PRO', 'ENTERPRISE'],
    'sso': ['ENTERPRISE'],
    'white_label': ['ENTERPRISE'],
  }

  return featureAccess[feature]?.includes(tier) ?? false
}
