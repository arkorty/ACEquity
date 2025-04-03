"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Home, List, LogOut, User, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { LoginPopup } from "@/components/login-popup";
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from "@/components/ui/toast";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Markets", href: "/markets", icon: BarChart2 },
  { name: "Watchlist", href: "/watchlist", icon: List, requiresAuth: true },
  { name: "Profile", href: "/profile", icon: User, requiresAuth: true },
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [toasts, setToasts] = useState<
    {
      title: string;
      description: string;
      variant?: "default" | "destructive";
    }[]
  >([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const cookies = parseCookies();
    setIsLoggedIn(!!cookies.userid);
  }, []);

  const addToast = (toast: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => {
    setToasts((prev) => [...prev, toast]);
  };

  const handleLogin = async (credentials: { userid: string }) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${credentials.userid}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      const data = await response.json();

      setCookie(null, "userid", data.response.userid, {
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      setIsLoggedIn(true);
      setIsLoginPopupOpen(false);
      addToast({
        title: "Success",
        description: "Logged in successfully.",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description:
          "Failed to log in. Please check your connection or try again later.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    destroyCookie(null, "userid");
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-8 flex h-14 items-center justify-between">
        {/* Logo and Title Section */}
        <div className="flex items-center">
          {/* Mobile View - Sheet Trigger */}
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <BarChart2
                className="flex items-center md:hidden cursor-pointer h-6 w-6"
                onClick={() => setIsMobileNavOpen(true)}
              />
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav closeNav={() => setIsMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link
            href="/"
            className="flex items-center ml-2 md:hidden cursor-pointer"
          >
            <span className="font-bold">ACEquity</span>
          </Link>

          {/* Desktop View - Home Link */}
          <Link href="/" className="hidden md:flex items-center space-x-2">
            <BarChart2 className="h-6 w-6" />
            <span className="font-bold">ACEquity</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
            {navigation
              .filter((item) => !item.requiresAuth || isLoggedIn)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors hover:text-foreground/80 ${
                    pathname === item.href
                      ? "text-foreground"
                      : "text-foreground/60"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
          </nav>
        </div>

        {/* Dark Mode Toggle and Login/Logout */}
        <div className="flex items-center space-x-2">
          {isLoggedIn ? (
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              className="relative flex items-center justify-center overflow-hidden"
            >
              <LogOut className="h-6 w-6" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsLoginPopupOpen(true)}
              className="relative flex items-center justify-center overflow-hidden"
            >
              <UserCircle className="h-6 w-6" />
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastProvider>
        {toasts.map((toast, index) => (
          <Toast key={index} variant={toast.variant} className="px-8 md:py-11">
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </Toast>
        ))}
        <ToastViewport className="md:h-full" />
      </ToastProvider>

      {/* Login Popup */}
      <LoginPopup
        isOpen={isLoginPopupOpen}
        onLogin={handleLogin}
        onCancel={() => setIsLoginPopupOpen(false)}
      />
    </header>
  );
}

function MobileNav({ closeNav }: { closeNav: () => void }) {
  const pathname = usePathname();
  const cookies = parseCookies();
  const isLoggedIn = !!cookies.userid;

  return (
    <nav className="flex flex-col space-y-8 mt-16">
      {navigation
        .filter((item) => !item.requiresAuth || isLoggedIn)
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-2 ${
              pathname === item.href ? "text-foreground" : "text-foreground/60"
            }`}
            onClick={closeNav}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
    </nav>
  );
}
