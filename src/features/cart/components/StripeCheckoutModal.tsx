import { useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../../../shared/lib/stripe";
import { paymentService } from "../../../shared/api/services/paymentService";
import { Button } from "../../../shared/ui/Button";

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
  amount: number;
  onSuccess: (orderData: {
    orderId: number;
    trackingNumber: string;
    totalAmount: number;
  }) => void;
}

function CheckoutForm({
  amount,
  onClose,
  onSuccess,
}: {
  amount: number;
  onClose: () => void;
  onSuccess: (orderData: {
    orderId: number;
    trackingNumber: string;
    totalAmount: number;
  }) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Confirmar pago con Stripe (soporta 3DSecure si el banco lo solicita)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Ocurrió un error al procesar el pago");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        // 2. Notificar al backend para consolidar orden y tracking
        const orderResponse = await paymentService.confirm(paymentIntent.id);
        onSuccess({
          orderId: orderResponse.order_id,
          trackingNumber: orderResponse.tracking_number,
          totalAmount: orderResponse.total_amount || amount,
        });
      } else {
        setErrorMessage(
          "El pago no pudo ser confirmado de inmediato. Por favor verifica tu método de pago."
        );
      }
    } catch (err: any) {
      console.error("Error al confirmar con el backend:", err);
      setErrorMessage(
        err.message || "Error al registrar la orden después del cobro"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Contenido con scroll para campos de Stripe */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 overscroll-contain">
        <div className="rounded-xl border border-line/60 bg-ink/60 p-3 text-xs text-muted flex items-center justify-between">
          <span>Total a pagar con Stripe:</span>
          <span className="font-mono font-bold text-accent text-base">
            ${amount.toFixed(2)} USD
          </span>
        </div>

        <div className="min-h-[180px]">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            ⚠️ {errorMessage}
          </div>
        )}
      </div>

      {/* Footer fijo para que los botones nunca se salgan de pantalla */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-line bg-ink-soft space-y-2">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isProcessing}
            className="w-1/3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-2/3"
          >
            {isProcessing ? "Procesando pago..." : `Pagar $${amount.toFixed(2)}`}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <svg
            className="h-3.5 w-3.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Transacción encriptada de 256 bits procesada por Stripe</span>
        </div>
      </div>
    </form>
  );
}

export function StripeCheckoutModal({
  isOpen,
  onClose,
  clientSecret,
  amount,
  onSuccess,
}: StripeCheckoutModalProps) {
  if (!isOpen || !clientSecret) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-lg max-h-[90vh] rounded-3xl border border-line bg-ink-soft shadow-2xl overflow-hidden">
        {/* Header fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line flex-shrink-0 bg-ink-soft">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent font-bold text-sm">
              💳
            </span>
            <h3 className="font-display text-xl text-foreground">
              Finalizar Pago
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#f59e0b",
                colorBackground: "#0e0e10",
                colorText: "#f3f4f6",
                colorDanger: "#ef4444",
                borderRadius: "12px",
                spacingUnit: "4px",
              },
            },
          }}
        >
          <CheckoutForm
            amount={amount}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        </Elements>
      </div>
    </div>
  );
}
