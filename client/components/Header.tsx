"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { BarChart2, List, LogOut, User, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ThemeToggle";
import { useState } from "react";
import { LoginPopup } from "@/components/profile/LoginPopup";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/redux/store';
import { logout, fetchUser } from '@/lib/redux/slices/authSlice';

const navigation = [
  { name: "Markets", href: "/markets", icon: BarChart2, requiresAuth: true },
  { name: "Watchlist", href: "/watchlist", icon: List, requiresAuth: true },
  { name: "AI Assistant", href: "/assistant", icon: List, requiresAuth: true },
  { name: "Profile", href: "/profile", icon: User, requiresAuth: true },
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("You have been logged out.");
    window.location.href = "/";
  };

  const handleLogin = async (userid: string) => {
    if (!userid) {
      toast.error("Please enter your user ID.");
      return;
    }
    try {
      const user = await dispatch(fetchUser(userid)).unwrap();
      toast.success(`Welcome back, ${user.fullname}!`);
      setIsLoginPopupOpen(false);
    } catch (error) {
      toast.error("Login failed. Please check the user ID and try again.");
    }
  };

  const handleCreateUser = async (fullname: string, email: string) => {
    if (!fullname || !email) {
      toast.error("Please enter your fullname and email.");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullname, email }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create user.");
      }

      await handleLogin(data.response.userid);
      toast.success(`User ${fullname} created successfully!`);

    } catch (error: any) {
      toast.error(error.message || "Failed to create user. Please try again.");
    }
  };

  if (isLoading) {
    return null;
  }

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

        {/* Dark Mode Toggle and Login/Logout */}
        <div className="flex items-center space-x-2">
          {user ? (
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

      {/* Login Popup */}
      <LoginPopup
        isOpen={isLoginPopupOpen}
        onCancel={() => setIsLoginPopupOpen(false)}
        onLogin={handleLogin}
        onCreateUser={handleCreateUser}
      />
    </header>
  );
}

function MobileNav({ closeNav }: { closeNav: () => void }) {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <nav className="flex flex-col space-y-8 mt-16">
      {navigation
        .filter((item) => !item.requiresAuth || !!user)
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
