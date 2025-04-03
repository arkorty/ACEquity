import React, { useState } from "react";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onLogin,
  onCancel,
}) => {
  const [isCreating, setIsCreating] = useState(false);
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

  const handleLogin = async () => {
    if (userid) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userid}`,
          {
            method: "GET",
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.response.userid === userid) {
            onCancel();
            addToast({
              title: "Login Success",
              description: `Welcome back, User ${userid}!`,
            });
            onLogin({ userid });
          } else {
            onCancel();
            addToast({
              title: "Login Failed",
              description: "Invalid userid. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          onCancel();
          addToast({
            title: "Login Failed",
            description: "User not found. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        onCancel();
        addToast({
          title: "Login Failed",
          description: "An error occurred during login. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      onCancel();
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
              maxAge: 30 * 24 * 60 * 60,
            });
            onCancel();
            addToast({
              title: "User Created",
              description: `User ${fullname} has been created.`,
            });
            onLogin({ userid: data.response.userid });
          } else {
            onCancel();
            addToast({
              title: "Error",
              description: "Failed to retrieve user ID. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          onCancel();
          addToast({
            title: "Error",
            description: "Failed to create user. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        onCancel();
        addToast({
          title: "Error",
          description: "Failed to create user. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      onCancel();
      addToast({
        title: "Missing Information",
        description: "Please enter your fullname and email.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <ToastProvider>
        {toasts.map((toast, index) => (
          <Toast
            key={index}
            variant={toast.variant}
            className="px-8 md:py-11 mb-2"
          >
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        ))}
        <ToastViewport className="md:h-full" />
      </ToastProvider>

      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent
          className="z-50 max-w-sm mx-auto py-4 px-6 md:py-6 md:px-8 overflow-visible"
          aria-describedby="login-description"
        >
          <DialogHeader>
            <DialogTitle className="mb-4">
              {isCreating ? "Create" : "Login"}
            </DialogTitle>
          </DialogHeader>
          <div id="login-description" className="space-y-4">
            {isCreating ? (
              <div className="space-y-2">
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
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Enter your User ID to log in to your account.
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    value={userid}
                    onChange={(value) => {
                      setUserid(value.toUpperCase());
                      if (value.length === 6) {
                        handleLogin();
                      }
                    }}
                    maxLength={6}
                    pattern="[A-Z0-9]*"
                    inputMode="text"
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="text-foreground bg-background dark:text-foreground dark:bg-background dark:caret-foreground"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            {isCreating && (
              <Button
                size="sm"
                onClick={handleCreate}
                className="focus-visible:ring-transparent hover:bg-foreground/70"
              >
                Okay
              </Button>
            )}
            {isCreating ? (
              <Button
                size="sm"
                onClick={() => setIsCreating(!isCreating)}
                className="focus-visible:ring-transparent text-foreground bg-red-500 hover:bg-red-600"
              >
                Cancel
              </Button>
            ) : (
              <div className="flex flex-col md:flex-row md:space-x-2 items-center">
                <p className="text-sm text-muted-foreground text-center mb-2 md:mb-0">
                  or create a new account
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsCreating(!isCreating)}
                  className="focus-visible:ring-transparent text-foreground bg-purple-400 hover:bg-purple-600"
                >
                  Create
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { LoginPopup };
