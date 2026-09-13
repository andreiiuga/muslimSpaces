export type InputKind = "text" | "email" | "password";

export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  kind?: InputKind;
}
