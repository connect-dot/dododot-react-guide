import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { cn } from "../../lib/utils";

/**
 * shadcn/ui-style Select built on Radix Select.
 *
 * Sizing uses px-based Tailwind arbitrary values so the component renders
 * at the intended size regardless of the host's root font-size.
 */

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function ChevronDownIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "crg-inline-flex crg-h-[36px] crg-items-center crg-justify-between crg-gap-[8px]",
      "crg-rounded-[8px] crg-border crg-border-solid crg-border-border crg-bg-surface",
      "crg-px-[12px] crg-text-[14px] crg-leading-[20px] crg-font-medium crg-text-foreground",
      "crg-cursor-pointer crg-outline-none",
      "data-[state=open]:crg-border-brand focus-visible:crg-border-brand",
      "disabled:crg-cursor-not-allowed disabled:crg-opacity-50",
      "[&>span]:crg-line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <span className="crg-text-icon">
        <ChevronDownIcon size={16} />
      </span>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    { className, children, position = "popper", sideOffset = 6, ...props },
    ref,
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        className={cn(
          // BottomSheet(Radix Dialog, modal) 안에서 쓰일 때 body 가 pointer-events: none 이
          // 되므로, body 로 포털되는 드롭다운에 명시적으로 auto 를 줘야 옵션 클릭이 된다.
          "crg-z-[1100] crg-pointer-events-auto crg-min-w-[var(--radix-select-trigger-width)] crg-overflow-hidden",
          "crg-rounded-[10px] crg-border crg-border-solid crg-border-border crg-bg-surface",
          "crg-shadow-elevation-02",
          "crg-text-[14px] crg-leading-[20px] crg-text-foreground",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="crg-p-[6px]">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ),
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "crg-relative crg-flex crg-w-full crg-items-center crg-gap-[8px]",
      "crg-rounded-[6px] crg-px-[10px] crg-py-[8px]",
      "crg-text-[14px] crg-leading-[20px] crg-text-foreground crg-cursor-pointer",
      "crg-outline-none crg-select-none",
      "data-[highlighted]:crg-bg-muted data-[highlighted]:crg-text-foreground",
      "data-[state=checked]:crg-text-brand data-[state=checked]:crg-font-semibold",
      "data-[disabled]:crg-pointer-events-none data-[disabled]:crg-opacity-50",
      className,
    )}
    {...props}
  >
    <span className="crg-inline-flex crg-h-[16px] crg-w-[16px] crg-items-center crg-justify-center crg-text-brand">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon size={16} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText asChild>
      <span className="crg-flex-1 crg-truncate crg-text-left">{children}</span>
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
