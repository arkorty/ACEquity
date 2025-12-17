"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Status = "online" | "offline" | "loading";

export function ServerStatusIndicator() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/healthz`);
        if (response.ok) {
          setStatus("online");
        } else {
          setStatus("offline");
        }
      } catch (error) {
        setStatus("offline");
      }
    };

    checkStatus(); // Initial check
    const intervalId = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const statusConfig = {
    online: {
      color: "bg-green-500",
      message: "Server is online",
      animate: false,
    },
    offline: {
      color: "bg-red-500",
      message: "Server is offline",
      animate: true,
    },
    loading: {
      color: "bg-gray-400",
      message: "Checking server status...",
      animate: true,
    },
  };

  const currentStatus = statusConfig[status];
  const animationClass = currentStatus.animate ? "animate-pulse" : "";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={`w-3 h-3 rounded-full transition-colors ${currentStatus.color} ${animationClass}`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentStatus.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
