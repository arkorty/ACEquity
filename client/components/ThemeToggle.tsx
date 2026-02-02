"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const router = useRouter();

  // Ensure the component is mounted before rendering the theme icon
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 21) {
      router.push("/scp");
      setClickCount(0);
    } else {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }
  };

  if (!mounted) {
    // Avoid rendering until mounted to prevent incorrect icons
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className="relative flex items-center justify-center overflow-hidden"
    >
      <Sun
        className={`absolute h-[1.2rem] w-[1.2rem] transition-opacity duration-300 ${
          resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-[1.2rem] w-[1.2rem] transition-opacity duration-300 ${
          resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
