"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

export function Toaster() {
  const { toasts, position = "bottom-right" } = useToast();
  
  // Animation variants based on position
  const getAnimationVariant = (pos: string) => {
    const isTop = pos.startsWith("top");
    const isLeft = pos.includes("left");
    const isCenter = pos.includes("center");
    
    if (isCenter) {
      return {
        initial: { opacity: 0, y: isTop ? -20 : 20, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: isTop ? -20 : 20, scale: 0.9, transition: { duration: 0.2 } }
      };
    }
    
    if (isLeft) {
      return {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
      };
    }
    
    return {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
    };
  };
  
  const animationVariant = getAnimationVariant(position);

  return (
    <ToastProvider>
      <ToastViewport position={position}>
        <AnimatePresence mode="sync">
          {toasts.map(function ({ id, title, description, action, variant, ...props }) {
            return (
              <motion.div
                key={id}
                layout
                style={{ marginBottom: "8px" }}
                initial={animationVariant.initial}
                animate={animationVariant.animate}
                exit={animationVariant.exit}
              >
                <Toast 
                  variant={variant} 
                  {...props} 
                  className={`shadow-lg backdrop-blur-sm ${props.className || ""}`}
                >
                  <div className="grid gap-1">
                    {title && <ToastTitle>{title}</ToastTitle>}
                    {description && (
                      <ToastDescription>{description}</ToastDescription>
                    )}
                  </div>
                  {action}
                  <ToastClose onClick={() => useToast().dismiss(id)} />
                </Toast>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ToastViewport>
    </ToastProvider>
  );
}