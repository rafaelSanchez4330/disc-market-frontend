import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled = false }: Props) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Convertimos el string a un array de 6 elementos
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const focusInput = (index: number) => {
    if (inputsRef.current[index]) {
      inputsRef.current[index]?.focus();
      inputsRef.current[index]?.select();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const char = rawVal.replace(/\D/g, "").slice(-1); // Tomamos el último dígito numérico

    const nextDigits = [...digits];
    nextDigits[index] = char;
    const nextValue = nextDigits.join("").slice(0, 6);
    onChange(nextValue);

    if (char && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < 5) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    onChange(pastedData);
    const nextIndex = Math.min(pastedData.length, 5);
    focusInput(nextIndex);
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => {
        const digit = digits[i] || "";
        const isFilled = Boolean(digit);

        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={disabled}
            className={`h-12 w-11 sm:h-14 sm:w-12 rounded-xl border text-center font-mono text-xl sm:text-2xl font-bold transition-all focus:outline-none ${
              isFilled
                ? "border-accent bg-accent/10 text-accent shadow-sm"
                : "border-line bg-ink text-cream hover:border-line/80 focus:border-accent"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          />
        );
      })}
    </div>
  );
}
