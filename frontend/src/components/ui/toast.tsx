"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

// Enhanced toast variants with class variance authority
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=closed]:slide-out-to-right-full",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 border-gray-200",
        destructive: "destructive group border-red-500 bg-red-500 text-white",
        success: "success group border-green-500 bg-green-500 text-white",
        warning: "warning group border-yellow-500 bg-yellow-50 text-yellow-800 border-yellow-200",
        info: "info group border-blue-500 bg-blue-50 text-blue-800 border-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Create context to share variant info to child components
type ToastContextType = {
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const useToastContext = () => React.useContext(ToastContext);

// Toast position types
export type ToastPosition = 
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

export interface ToastProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  onDismiss?: () => void;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "Escape" && props.onOpenChange) {
        props.onOpenChange(false);
      }
    };

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={toastVariants({ variant, className })}
        data-state={props.open ? "open" : "closed"}
        {...props}
      />
    );
  }
);
Toast.displayName = "Toast";

// Enhanced action button with variant-specific styling
const actionVariants = cva(
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-gray-200 bg-transparent hover:bg-gray-100 focus:ring-gray-400",
        destructive: "border-red-100/40 hover:border-red-500/30 hover:bg-red-100 hover:text-red-600 focus:ring-red-400 focus:ring-offset-red-600",
        success: "border-green-100/40 hover:border-green-500/30 hover:bg-green-100 hover:text-green-600 focus:ring-green-400 focus:ring-offset-green-600",
        warning: "border-yellow-100/40 hover:border-yellow-500/30 hover:bg-yellow-100 hover:text-yellow-600 focus:ring-yellow-400 focus:ring-offset-yellow-600",
        info: "border-blue-100/40 hover:border-blue-500/30 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-400 focus:ring-offset-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof actionVariants> {
  altText?: string;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
}

const ToastAction = React.forwardRef<HTMLButtonElement, ToastActionProps>(
  ({ className, variant, altText, ...props }, ref) => {
    const toastContext = useToastContext();
    return (
      <button
        ref={ref}
        className={actionVariants({ variant: toastContext?.variant || variant, className })}
        aria-label={altText}
        {...props}
      />
    );
  }
);
ToastAction.displayName = "ToastAction";

// Enhanced close button with variant-specific styling
const closeVariants = cva(
  "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
  {
    variants: {
      variant: {
        default: "text-gray-500 hover:text-gray-900 focus:ring-gray-400",
        destructive: "text-red-300 hover:text-red-50 focus:ring-red-400 focus:ring-offset-red-600",
        success: "text-green-300 hover:text-green-50 focus:ring-green-400 focus:ring-offset-green-600",
        warning: "text-yellow-500 hover:text-yellow-700 focus:ring-yellow-400",
        info: "text-blue-500 hover:text-blue-700 focus:ring-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ToastCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof closeVariants> {
  variant?: "default" | "destructive" | "success" | "warning" | "info";
}

const ToastClose = React.forwardRef<HTMLButtonElement, ToastCloseProps>(
  ({ className, variant, ...props }, ref) => {
    const toastContext = useToastContext();
    return (
      <button
        ref={ref}
        className={closeVariants({ variant: toastContext?.variant || variant, className })}
        aria-label="Close toast"
        {...props}
      >
        <X className="h-4 w-4" />
      </button>
    );
  }
);
ToastClose.displayName = "ToastClose";

interface ToastTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const ToastTitle = React.forwardRef<HTMLHeadingElement, ToastTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-sm font-semibold ${className || ""}`}
        {...props}
      />
    );
  }
);
ToastTitle.displayName = "ToastTitle";

interface ToastDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const ToastDescription = React.forwardRef<HTMLParagraphElement, ToastDescriptionProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-sm opacity-90 ${className || ""}`}
        {...props}
      />
    );
  }
);
ToastDescription.displayName = "ToastDescription";

// Enhanced provider that passes variant context
interface ToastProviderProps extends React.PropsWithChildren {
  variant?: "default" | "destructive" | "success" | "warning" | "info";
}

const ToastProvider = ({ children, variant }: ToastProviderProps) => {
  return (
    <ToastContext.Provider value={{ variant }}>
      {children}
    </ToastContext.Provider>
  );
};

// Enhanced viewport with configurable position
interface ToastViewportProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: ToastPosition;
}

const positionClasses = {
  "top-right": "top-0 right-0 flex-col-reverse",
  "top-left": "top-0 left-0 flex-col-reverse",
  "bottom-right": "bottom-0 right-0 flex-col",
  "bottom-left": "bottom-0 left-0 flex-col",
  "top-center": "top-0 left-1/2 -translate-x-1/2 flex-col-reverse",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 flex-col"
};

const ToastViewport = React.forwardRef<HTMLDivElement, ToastViewportProps>(
  ({ className, position = "bottom-right", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`fixed z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px] ${positionClasses[position]} ${className || ""}`}
        {...props}
      />
    );
  }
);
ToastViewport.displayName = "ToastViewport";

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};