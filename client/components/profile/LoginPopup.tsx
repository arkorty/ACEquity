import React, { useState } from "react";
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

interface LoginPopupProps {
  isOpen: boolean;
  onCancel: () => void;
  onLogin: (userid: string) => Promise<void>;
  onCreateUser: (fullname: string, email: string) => Promise<void>;
}

const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onCancel,
  onLogin,
  onCreateUser,
}) => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [userid, setUserid] = useState("");

  const handleLogin = () => {
    onLogin(userid);
  };

  const handleCreate = () => {
    onCreateUser(fullname, email);
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
        <Tabs defaultValue="login" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Enter your 6-character user ID to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-center py-4">
                  <InputOTP
                    value={userid}
                    onChange={(value) => setUserid(value.toUpperCase())}
                    onComplete={handleLogin}
                    maxLength={6}
                    pattern="[A-Z0-9]*"
                    inputMode="text"
                  >
                    <InputOTPGroup>
                      {[...Array(6)].map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </CardContent>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="John Doe"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreate} className="w-full">Create Account</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export { LoginPopup };
