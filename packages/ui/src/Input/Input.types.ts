export type InputKind = "text" | "email" | "password";

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  kind?: InputKind;
  /** Browser autofill / password-manager hint (web only; native ignores). */
  autoComplete?: string;
  name?: string;
  /** Helper text under the field (hidden while an error shows). */
  hint?: string;
  /** Accessible names for the password reveal button (web only). */
  showLabel?: string;
  hideLabel?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
}
