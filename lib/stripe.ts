import Stripe from 'stripe'

// Only initialize Stripe if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null

export const STRIPE_PRICE_IDS = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
  PRO: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  ENTERPRISE: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
}
