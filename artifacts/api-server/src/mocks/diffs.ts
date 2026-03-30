export const mockDiffs: Record<string, object> = {
  "ana-001": {
    analysisId: "ana-001",
    files: [
      {
        path: "src/components/checkout/PaymentStep.tsx",
        language: "tsx",
        additions: 45,
        deletions: 8,
        before: `import { CardElement } from '@stripe/react-stripe-js';

export function PaymentStep({ onComplete }: PaymentStepProps) {
  return (
    <div className="payment-step">
      <h3>Payment Information</h3>
      <CardElement options={cardStyle} />
      <button onClick={handleSubmit}>Pay Now</button>
    </div>
  );
}`,
        after: `import { CardElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { usePaymentRequest } from '@/hooks/usePaymentRequest';

export function PaymentStep({ onComplete }: PaymentStepProps) {
  const { paymentRequest, canMakePayment } = usePaymentRequest(amount);

  return (
    <div className="payment-step">
      <h3>Payment Information</h3>
      {canMakePayment && (
        <div className="digital-wallet-section">
          <PaymentRequestButtonElement options={{ paymentRequest }} />
          <div className="divider">or pay with card</div>
        </div>
      )}
      <CardElement options={cardStyle} />
      <button onClick={handleSubmit}>Pay Now</button>
    </div>
  );
}`,
        riskLabel: "low",
      },
      {
        path: "src/hooks/usePaymentRequest.ts",
        language: "typescript",
        additions: 38,
        deletions: 0,
        before: "// New file",
        after: `import { useStripe } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';

export function usePaymentRequest(amount: number) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'FR',
      currency: 'eur',
      total: { label: 'Order Total', amount },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });
  }, [stripe, amount]);

  return { paymentRequest, canMakePayment };
}`,
        riskLabel: "low",
      },
      {
        path: "server/routes/payment.routes.ts",
        language: "typescript",
        additions: 12,
        deletions: 3,
        before: `router.post('/create-intent', async (req, res) => {
  const intent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'eur',
    payment_method_types: ['card'],
  });
  res.json({ clientSecret: intent.client_secret });
});`,
        after: `router.post('/create-intent', async (req, res) => {
  const intent = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: 'eur',
    payment_method_types: ['card'],
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
  });
  res.json({ clientSecret: intent.client_secret });
});`,
        riskLabel: "medium",
      },
    ],
    summary: "Add Apple Pay and Google Pay support via Stripe Payment Request API. Creates a new hook for payment request management and updates the payment step component.",
    totalAdditions: 95,
    totalDeletions: 11,
  },
  "ana-002": {
    analysisId: "ana-002",
    files: [
      {
        path: "src/components/payment/PaymentFormValidator.tsx",
        language: "tsx",
        additions: 18,
        deletions: 12,
        before: `const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      validateField(entry.target.id);
    }
  });
}, { rootMargin: '0px 0px -10vh 0px' });`,
        after: `const observer = useSafeIntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry && entry.isIntersecting) {
      validateField(entry.target?.id);
    }
  });
}, { rootMargin: '0px 0px -50px 0px' });`,
        riskLabel: "low",
      },
      {
        path: "src/hooks/useSafeIntersectionObserver.ts",
        language: "typescript",
        additions: 32,
        deletions: 0,
        before: "// New file",
        after: `import { useEffect, useRef } from 'react';

export function useSafeIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver not supported');
      return;
    }

    try {
      observerRef.current = new IntersectionObserver(callback, {
        ...options,
        rootMargin: options?.rootMargin?.replace(/vh|vw/g, 'px') || '0px',
      });
    } catch (e) {
      console.error('IntersectionObserver init failed:', e);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  return observerRef;
}`,
        riskLabel: "low",
      },
    ],
    summary: "Fix Safari 17.x crash by replacing direct IntersectionObserver usage with a compatibility wrapper that handles viewport-relative units and null entries.",
    totalAdditions: 50,
    totalDeletions: 12,
  },
};

export function getDiffForAnalysis(analysisId: string) {
  return mockDiffs[analysisId] || mockDiffs["ana-001"];
}
