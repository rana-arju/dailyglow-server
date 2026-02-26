import Stripe from 'stripe';
import config from "./index"
export const stripe = new Stripe(config.stripe_secret as string, {});

export const STRIPE_PRICES = {
  BASIC_MONTHLY: "price_1RnzuoQmUMn16GEoFbXagwxO",
  PRO_MONTHLY: "price_1RnzteQmUMn16GEokVGaDvOR",
}

// Plan type constants for Stripe metadata
export const STRIPE_PLAN_TYPES = {
  MONTHLY: 'MONTHLY',
  LIMITED_TIME_AUDIT: 'LIMITED_TIME_AUDIT',
  LIFETIME: 'LIFETIME',
  AUDIT_PRICE: 'AUDIT_PRICE' // For individual audit pricing
};

// Stripe webhook events we handle
export const STRIPE_WEBHOOK_EVENTS = {
  PAYMENT_SUCCESS: 'payment_intent.succeeded',
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCESS: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
};

export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET_KEY!

// Utility function to create Stripe customer
export const createStripeCustomer = async (email: string, name?: string) => {
  return await stripe.customers.create({
    email,
    name,
  });
};

// Utility function to create payment intent for one-time purchases
export const createPaymentIntent = async (amount: number, currency: string = 'USD', customerId?: string) => {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });
};
