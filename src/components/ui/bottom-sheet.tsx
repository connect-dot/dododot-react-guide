import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "../../lib/utils";

/**
 * shadcn/ui-style BottomSheet built on Radix Dialog.
 *
 * Slides up from the bottom of the viewport with a drag-handle visual and
 * dark backdrop. Closes on overlay click / Escape / explicit close button.
 */

const BottomSheet = DialogPrimitive.Root;
const BottomSheetTrigger = DialogPrimitive.Trigger;
const BottomSheetClose = DialogPrimitive.Close;
const BottomSheetTitle = DialogPrimitive.Title;
const BottomSheetDescription = DialogPrimitive.Description;

function CloseGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "crg-fixed crg-inset-0 crg-z-[1090] crg-bg-black/40",
      "data-[state=open]:crg-opacity-100 data-[state=closed]:crg-opacity-0",
      "crg-transition-opacity crg-duration-200 crg-ease-out",
      className,
    )}
    {...props}
  />
));
BottomSheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Visible title in the header. */
    title?: React.ReactNode;
    /** Visually hidden description for screen readers (a11y). */
    srDescription?: string;
    /** Hide the close (X) button in the header. */
    hideClose?: boolean;
  }
>(({ className, children, title, srDescription, hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <BottomSheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "crg-fixed crg-z-[1100] crg-left-0 crg-right-0 crg-bottom-0",
        "crg-h-[100vh] crg-max-h-[100vh]",
        "crg-flex crg-flex-col",
        "crg-bg-surface",
        "crg-rounded-t-[20px]",
        "crg-shadow-elevation-03",
        "crg-outline-none",
        "data-[state=open]:crg-translate-y-0",
        "data-[state=closed]:crg-translate-y-full",
        "crg-transition-transform crg-duration-200 crg-ease-out",
        className,
      )}
      {...props}
    >
      {/* Drag handle */}
      <div className="crg-flex crg-justify-center crg-pt-[10px] crg-pb-[6px]">
        <div className="crg-h-[4px] crg-w-[44px] crg-rounded-full crg-bg-border" />
      </div>

      {/* Header */}
      <div className="crg-flex crg-items-center crg-justify-between crg-px-[20px] crg-pb-[12px]">
        <DialogPrimitive.Title asChild>
          <span className="crg-text-[16px] crg-leading-[24px] crg-font-bold crg-text-foreground">
            {title ?? " "}
          </span>
        </DialogPrimitive.Title>
        {!hideClose ? (
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="닫기"
              className={cn(
                "crg-inline-flex crg-items-center crg-justify-center",
                "crg-h-[32px] crg-w-[32px] crg-rounded-[8px] crg-border-0",
                "crg-bg-transparent crg-text-icon hover:crg-text-foreground",
                "crg-cursor-pointer",
              )}
            >
              <CloseGlyph size={20} />
            </button>
          </DialogPrimitive.Close>
        ) : null}
      </div>

      {srDescription ? (
        <DialogPrimitive.Description className="crg-sr-only">
          {srDescription}
        </DialogPrimitive.Description>
      ) : null}

      {/* Body */}
      <div className="crg-flex-1 crg-min-h-0 crg-flex crg-flex-col">
        {children}
      </div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
BottomSheetContent.displayName = DialogPrimitive.Content.displayName;

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetOverlay,
  BottomSheetContent,
};
