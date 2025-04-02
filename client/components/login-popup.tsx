import React, { useState } from "react";
// Removed axios import
import { setCookie } from "nookies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoginPopupProps } from "@/types/login-popup";
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast";
import { Input } from "@/components/ui/input";

const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onLogin,
  onCancel,
}) => {
  const [isCreating, setIsCreating] = useState(false); // Track whether "Create" mode is active
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [userid, setUserid] = useState("");
  const [toasts, setToasts] = useState<
    {
      title: string;
      description: string;
      variant?: "default" | "destructive";
    }[]
  >([]);

  const addToast = (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => {
    setToasts((prev) => [...prev, toast]);
  };

  const handleLogin = () => {
    if (userid) {
      onLogin({ userid });
      onCancel(); // Close the popup after successful login
    } else {
      addToast({
        title: "Missing userid",
        description: "Please enter your userid.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (fullname && email) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fullname, email }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.response.userid) {
            setCookie(null, "userid", data.response.userid, {
              path: "/",
              maxAge: 30 * 24 * 60 * 60, // 30 days
            });
            addToast({
              title: "User Created",
              description: `User ${fullname} has been created successfully.`,
            });
            onLogin({ userid: data.response.userid }); // Log in with the returned userid
            onCancel(); // Close the popup after successful creation and login
          } else {
            addToast({
              title: "Error",
              description: "Failed to retrieve user ID. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          addToast({
            title: "Error",
            description: "Failed to create user. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        addToast({
          title: "Error",
          description: "Failed to create user. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      addToast({
        title: "Missing Information",
        description: "Please enter your fullname and email.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <ToastProvider>
        {toasts.map((toast, index) => (
          <Toast key={index} variant={toast.variant}>
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>

      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="z-50 max-w-sm mx-auto py-8 px-6 md:p-8 overflow-visible">
          <DialogHeader>
            <DialogTitle className="mb-4">
              {isCreating ? "Create" : "Login"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isCreating ? (
              <>
                <div className="flex justify-center">
                  <Input
                    type="text"
                    placeholder="Fullname"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    maxLength={50}
                    className="p-2 rounded-md w-full"
                  />
                </div>
                <div className="flex justify-center">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={50}
                    className="p-2 rounded-md w-full"
                  />
                </div>
              </>
            ) : (
              <div className="flex justify-center">
                <Input
                  type="text"
                  placeholder="UserID"
                  value={userid}
                  onChange={(e) => setUserid(e.target.value)}
                  maxLength={6}
                  className="p-2 rounded-md w-full"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            {isCreating ? (
              <Button
                size="sm"
                onClick={handleCreate}
                className="focus-visible:ring-transparent"
              >
                Okay
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleLogin}
                className="focus-visible:ring-transparent hover:bg-foreground/70"
              >
                Login
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              className="focus-visible:ring-transparent bg-amber-400 hover:bg-amber-600"
            >
              {isCreating ? "Cancel" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { LoginPopup };
