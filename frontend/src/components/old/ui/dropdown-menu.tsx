"use client";

import * as React from "react";

interface DropdownMenuContext {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContext | undefined>(undefined);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu components must be used within a DropdownMenu");
  }
  return context;
}

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className={`relative inline-block ${className}`} {...props}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
});
DropdownMenu.displayName = "DropdownMenu";

const DropdownMenuTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className = "", ...props }, ref) => {
  const { open, setOpen } = useDropdownMenu();

  return (
    <div
      ref={ref}
      onClick={() => setOpen(!open)}
      className={`cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "left" | "right";
    sideOffset?: number;
  }
>(({ children, className = "", align = "right", sideOffset = 4, ...props }, ref) => {
  const { open } = useDropdownMenu();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        useDropdownMenu().setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={contentRef}
      className={`
        absolute z-50 min-w-[8rem] 
        overflow-hidden rounded-md border bg-white p-1 shadow-md
        transition-all duration-200 ease-out
        ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}
        ${align === "right" ? "right-0" : "left-0"}
        ${className}
      `}
      style={{ marginTop: sideOffset }}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean;
  }
>(({ className = "", inset, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`
        relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none
        transition-colors hover:bg-gray-100 focus:bg-gray-100
        ${inset && "pl-8"}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean;
  }
>(({ className = "", inset, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-2 py-1.5 text-sm font-semibold text-gray-700 ${
        inset && "pl-8"
      } ${className}`}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`-mx-1 my-1 h-px bg-gray-100 ${className}`}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = React.forwardRef<
  HTMLSpanElement, 
  React.HTMLAttributes<HTMLSpanElement>
>(({ className = "", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={`ml-auto text-xs tracking-widest text-gray-500 ${className}`}
      {...props}
    />
  );
});
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
};