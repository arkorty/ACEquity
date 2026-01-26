"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, LogIn, User, Briefcase, PanelLeftOpen, Home, ShoppingBag, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { LoginPopup } from "@/components/profile/LoginPopup";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { logout, verifyOtp } from '@/lib/redux/slices/authSlice';
import { openLoginPopup, closeLoginPopup } from '@/lib/redux/slices/CTASlice';
import { fetchDataLastUpdated } from '@/lib/stockApi';

const navigation = [
  { name: "Home", href: "/", icon: Home, requiresAuth: false },
  { name: "Markets", href: "/markets", icon: ShoppingBag, requiresAuth: true },
  { name: "Watchlists", href: "/watchlist", icon: Eye, requiresAuth: true },
  { name: "Holdings", href: "/holdings", icon: Briefcase, requiresAuth: true },
  { name: "Profile", href: "/profile", icon: User, requiresAuth: true },
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { isLoginPopupOpen } = useSelector((state: RootState) => state.cta);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/healthz`);
        setIsServerOnline(response.ok);
      } catch (error) {
        setIsServerOnline(false);
      }
    };

    const fetchMarketDate = async () => {
      try {
        const data = await fetchDataLastUpdated();
        if (data.lastSuccess) {
          const date = new Date(data.lastSuccess);
          setLastUpdated(date.toLocaleString("en-IN", { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }
      } catch (error) {
        console.error("Failed to fetch last updated date:", error);
      }
    };

    checkStatus();
    fetchMarketDate();
    const intervalId = setInterval(checkStatus, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!user && isServerOnline && !isLoading) {
      const currentNavItem = navigation.find(item => item.href === pathname);
      
      if (currentNavItem?.requiresAuth) {
        dispatch(openLoginPopup());
      } else {
        const hasShownLoginCTA = localStorage.getItem('loginCTA') === 'true';
        if (!hasShownLoginCTA) {
          const timer = setTimeout(() => {
            dispatch(openLoginPopup());
            localStorage.setItem('loginCTA', 'true');
          }, 15000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [user, isServerOnline, isLoading, pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success("You have been logged out.");
    window.location.href = "/";
  };

  const handleLogin = async (email: string, otp: string, type: "login" | "signup") => {
    if (!email || !otp) {
      toast.error("Please provide both email and OTP.");
      return;
    }
    try {
      const user = await dispatch(verifyOtp({ email, otp })).unwrap();
      if (type === "signup") {
        toast.success(`Welcome to ACEquity, ${user.fullname || user.email}!`);
      } else {
        toast.success(`Welcome back, ${user.fullname || user.email}!`);
      }
      dispatch(closeLoginPopup());
    } catch (error: any) {
      toast.error(error || "Login failed. Invalid OTP.");
    }
  };

  const handleRequestOtp = async (email: string, type: "login" | "signup", fullname?: string) => {
    if (!email) {
      toast.error("Please provide My email.");
      throw new Error("Missing email");
    }
    try {
      const endpoint = type === 'signup' ? '/signup' : '/signin';
      const body = type === 'signup' ? { email, fullname } : { email };
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to request OTP.");
      }

      toast.success(`OTP sent to ${email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to request OTP. Please try again.");
      throw error;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-8 flex h-14 items-center justify-between">
        {/* Logo and Title Section */}
        <div className="flex items-center">
          {/* Mobile View - Logo */}
          <Link href="/" className="flex md:hidden items-center space-x-2">
            <span className="font-bold">ACEquity</span>
          </Link>

          {/* Desktop View - Home Link */}
          <Link href="/" className="hidden md:flex items-center space-x-2">
            <span className="font-bold">ACEquity</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-6">
            {navigation
              .filter((item) => !item.requiresAuth || !!user)
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

        {/* Data Source Info (Desktop) */}
        {lastUpdated && (
          <div className={`hidden ${!user ? "md:flex" : "xl:flex"} items-center text-xs text-muted-foreground absolute left-1/2 transform -translate-x-1/2`}>
            <span>Data Source: Yahoo Finance</span>
            <span className="mx-2">•</span>
            <span>Last Updated: {lastUpdated}</span>
          </div>
        )}

        {/* Dark Mode Toggle and Mobile Menu */}
        <div className="flex items-center space-x-2">
          {!user && isServerOnline && (
            <Button 
              variant="outline" 
              className="hidden md:flex items-center gap-2"
              onClick={() => dispatch(openLoginPopup())}
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Button>
          )}
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
              >
                <PanelLeftOpen className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <MobileNav 
                closeNav={() => setIsMobileNavOpen(false)} 
                onLoginClick={() => dispatch(openLoginPopup())} 
              />
            </SheetContent>
          </Sheet>
          <ModeToggle />
        </div>
      </div>

      {/* Data Source Info (Mobile/Tablet) */}
      {lastUpdated && (
        <div className={`${!user ? "md:hidden" : "xl:hidden"} w-full text-[10px] text-center text-muted-foreground py-1 bg-muted/20 border-t`}>
          <span>Data Source: Yahoo Finance</span>
          <span className="mx-2">•</span>
          <span>Last Updated: {lastUpdated}</span>
        </div>
      )}

      {/* Login Popup */}
      <LoginPopup
        isOpen={isLoginPopupOpen}
        onCancel={() => dispatch(closeLoginPopup())}
        onLogin={handleLogin}
        onRequestOtp={handleRequestOtp}
      />
    </header>
  );
}

function MobileNav({ closeNav, onLoginClick }: { closeNav: () => void; onLoginClick: () => void }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success("You have been logged out.");
    closeNav();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Links */}
      <nav className="flex-1 mt-12">
        {navigation
          .filter((item) => !item.requiresAuth || !!user)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-12 py-2 transition-colors ${
                pathname === item.href 
                  ? "text-accent-foreground" 
                  : "text-muted-foreground hover:bg-accent"
              }`}
              onClick={closeNav}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
      </nav>

      {/* Footer with Logout/Login Button */}
      <div className="p-6 border-t">
        {user ? (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
            onClick={() => {
              onLoginClick();
              closeNav();
            }}
          >
            <LogIn className="h-5 w-5" />
            <span>Login</span>
          </Button>
        )}
      </div>
    </div>
  );
}
