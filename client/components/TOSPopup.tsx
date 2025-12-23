import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { ToSPopupProps } from "../types/tos-popup";

const ToSPopup: React.FC<ToSPopupProps> = ({ isOpen, onAccept, onDecline }) => {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  // Attach ref to the actual scrollable div inside ScrollArea
  const scrollableDivRef = useRef<HTMLDivElement | null>(null);
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusLiveRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Attach scroll listener to the actual scrollable div
    const el = scrollableDivRef.current;

    const checkScroll = () => {
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 5);
      }
    };

    // If element isn't ready yet (component mount timing), try again shortly.
    if (!el) {
      const t = setTimeout(() => checkScroll(), 50);
      return () => clearTimeout(t);
    }

    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();

    // Move focus into the dialog for keyboard users. Focus the Accept button.
    const prevActive = document.activeElement as HTMLElement | null;
    const focusTimeout = setTimeout(() => {
      acceptButtonRef.current?.focus();
    }, 0);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      clearTimeout(focusTimeout);
      prevActive?.focus?.();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onDecline}>
      {isOpen && <div className="fixed inset-0 backdrop-blur-sm z-50" aria-hidden="true"></div>}
      <DialogContent
        role="dialog"
        aria-modal="true"
        aria-labelledby="tos-title"
        className="z-50 max-w-md mx-auto py-8 px-6 md:p-8"
        aria-describedby="tos-description"
        onKeyDown={(e) => {
          // allow keyboard users to press Enter to accept once they've scrolled
          if (e.key === "Enter" && isScrolledToBottom) {
            onAccept();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle id="tos-title">Terms of Service</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <ScrollArea
            className="max-h-96 tos-scroll-area"
            role="region"
            aria-label="Terms of Service content"
          >
            <div
              ref={scrollableDivRef}
              tabIndex={0}
              className="max-h-96 overflow-y-auto outline-none focus:outline-none bg-transparent border-none shadow-none"
            >
              <DialogDescription
                id="tos-description"
                className="text-primary/80 text-justify sm:mr-3"
              >
            By accessing or using our experimental Stock Market Tracker <strong>ACEquity</strong>, you agree to be bound by these terms of
            Service. If you do not agree to these terms, please do not use the
            Service.
            <br />
            <br />
            <strong>No Financial Advice</strong>
            <br />
            The information provided by the Service is for informational and
            personal tracking purposes only. It is not intended as financial,
            investment, tax, or legal advice. You should consult with a
            professional before making any financial decisions.
            <br />
            <br />
            <strong>Experimental Nature & Data Accuracy</strong>
            <br />
            The Service is experimental and provided "as-is." We do not
            guarantee the accuracy, completeness, or timeliness of any data,
            including stock prices, wishlist items, or other financial
            information. Stock market data may be outdated, incorrect, or
            unavailable at times. Use the information at My own risk.
            unavailable at times. Use the information at your own risk.
            <br />
            <br />
            <strong>No Liability</strong>
            <br />
            To the maximum extent permitted by law, <strong>
              ACEquity
            </strong>{" "}
            and its operators shall not be liable for any direct, indirect,
            incidental, special, or consequential damages resulting from your
            use of the Service. This includes, but is not limited to, losses
            incurred from investment decisions based on information provided by
            the Service.
            <br />
            <br />
            <strong>User Responsibilities</strong>
            <br />
            - You agree to use the Service lawfully and ethically.
            <br />
            - You acknowledge that the Service is subject to updates,
            modifications, or discontinuation at any time without notice.
            <br />
            - You are responsible for any data or preferences you store in the
            Wishlist Tracker.
            <br />
            <br />
            <strong>Third-Party Links & APIs</strong>
            <br />
            The Service may include links to third-party websites or use
            external APIs to fetch stock data. We do not endorse or take
            responsibility for the accuracy or security of any third-party
            services.
            <br />
            <br />
            <strong>Changes to terms</strong>
            <br />
            We may modify these terms at any time. Continued use of the Service
            after changes constitute My acceptance of the updated terms. It is
            My responsibility to review these terms periodically.
            <br />
            <br />
            <strong>Contact</strong>
            <br />
            If you have any questions or concerns about these terms, please
            contact us at{" "}
            <Link className="font-bold" href="mailto:mail@webark.in">
              mail@webark.in
            </Link>
            <br />
            <br />
            By using the Service, you acknowledge that you have read and
            understood these terms and agree to be bound by them.

              </DialogDescription>
            </div>
          </ScrollArea>
          {!isScrolledToBottom && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 w-full flex flex-col items-center z-20"
            >
              <div className="w-full h-12 bg-gradient-to-t from-background to-transparent" />
              <span className="-mt-8 mb-2 px-3 py-1 rounded bg-background/80 text-xs text-muted-foreground shadow">
                Scroll to read more
              </span>
            </div>
          )}
        </div>

        <span ref={statusLiveRef} className="sr-only" aria-live="polite">
          {isScrolledToBottom ? "You have reached the end of the terms." : "Scroll to the end to accept."}
        </span>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            ref={acceptButtonRef}
            size="sm"
            onClick={onAccept}
            disabled={!isScrolledToBottom}
            aria-disabled={!isScrolledToBottom}
            aria-describedby={!isScrolledToBottom ? "tos-description" : undefined}
            className="focus-visible:ring-transparent"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDecline}
            aria-label="Decline terms"
            className="focus-visible:ring-transparent bg-red-600 hover:bg-red-800"
          >
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ToSPopup };
