export interface LoginPopupProps {
  isOpen: boolean;
  onCancel: () => void;
  onLogin: (email: string, otp: string, type: "login" | "signup") => Promise<void>;
  onRequestOtp: (email: string, type: "login" | "signup", fullname?: string) => Promise<void>;
}
