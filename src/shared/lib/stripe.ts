import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

if (!publishableKey) {
  console.warn(
    '⚠️ VITE_STRIPE_PUBLISHABLE_KEY no está definida en el archivo .env del frontend.'
  );
}

export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
