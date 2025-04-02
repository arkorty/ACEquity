"use client";

// Import statements
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Home, List, LogOut, User, UserCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useState } from "react";
import { destroyCookie } from "nookies";

// Navigation items array
const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Markets", href: "/markets", icon: BarChart2 },
  { name: "Watchlist", href: "/watchlist", icon: List },
  { name: "Profile", href: "/profile", icon: User },
];

// Header component
export default function Header() {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleLogout = () => {
    destroyCookie(null, "userid");
    window.location.href = "/";
  };

  return (
    // Header container
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
            {navigation.map((item) => (
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

        {/* Dark Mode Toggle */}
        <div className="flex items-center space-x-2">
          {pathname === "/profile" ? (
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
              onClick={() => (window.location.href = "/profile")}
              className="relative flex items-center justify-center overflow-hidden"
            >
              <UserCircle className="h-6 w-6" />
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

// MobileNav component
function MobileNav({ closeNav }: { closeNav: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-8 mt-16">
      {navigation.map((item) => (
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
