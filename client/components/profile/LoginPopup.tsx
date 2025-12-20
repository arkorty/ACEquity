"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginPopupProps } from "@/types/login-popup";

const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onCancel,
  onLogin,
  onRequestOtp,
}) => {
  const [step, setStep] = useState<"auth" | "otp">("auth");
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep("auth");
        setActiveTab("login");
        setEmail("");
        setFullname("");
        setOtp("");
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmitAuth = async () => {
    setIsLoading(true);
    try {
      await onRequestOtp(email, activeTab as "login" | "signup", fullname);
      setStep("otp");
    } catch (error) {
      // Error is handled in Header via toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      await onLogin(email, otp, activeTab as "login" | "signup");
    } catch (error) {
      // Error handled in Header
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="items-center">
          <Image src="/logo.png" alt="ACEquity Logo" width={48} height={48} className="mb-2 rounded-full" />
          <DialogTitle className="text-2xl font-bold">Welcome to ACEquity</DialogTitle>
          <DialogDescription>
            Your free stock market tracker.
          </DialogDescription>
        </DialogHeader>

        {step === "auth" ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your email to receive a login code.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="email-login">Email</Label>
                    <Input
                      id="email-login"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmitAuth} className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Sign In"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>
                    Create a new account to start tracking your portfolio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      type="text"
                      placeholder="John Doe"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email-signup">Email</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmitAuth} className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="w-full mt-4">
            <CardHeader>
              <CardTitle>Verify Code</CardTitle>
              <CardDescription>
                Enter the 6-character code sent to {email}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-center py-4">
                <InputOTP
                  value={otp}
                  onChange={(value) => setOtp(value.toUpperCase())}
                  onComplete={handleVerifyOtp}
                  maxLength={6}
                  pattern="[A-Z0-9]*"
                  inputMode="text"
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    {[...Array(6)].map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <Button variant="ghost" onClick={() => setStep("auth")} className="w-full text-xs" disabled={isLoading}>
                Back to Sign In
              </Button>
            </CardFooter>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { LoginPopup };