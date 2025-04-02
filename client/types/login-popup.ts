export interface LoginPopupProps {
  isOpen: boolean;
  onLogin: (credentials: { userid: string }) => void;
  onCancel: () => void;
}
