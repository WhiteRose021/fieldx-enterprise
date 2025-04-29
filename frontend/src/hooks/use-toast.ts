"use client";

import * as React from "react";
import { type ToastPosition } from "@/components/ui/toast";

const DEFAULT_TOAST_LIMIT = 5;
const DEFAULT_TOAST_DURATION = 5000;

type ToastActionElement = React.ReactNode;

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  playSound?: boolean;
  className?: string;
};

export type ToastOptions = Partial<Omit<ToastProps, "id">>;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToastProps;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToastProps>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

interface State {
  toasts: ToastProps[];
  position: ToastPosition;
  limit: number;
}

const initialState: State = {
  toasts: [],
  position: "bottom-right",
  limit: DEFAULT_TOAST_LIMIT,
};

// Sound effects for different toast variants
const playSoundEffect = (variant: ToastVariant = "default") => {
  if (typeof window === "undefined" || !window.AudioContext) return;
  
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Different tones for different variants
    switch (variant) {
      case "success":
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case "destructive":
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case "warning":
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case "info":
      case "default":
      default:
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
    
    gainNode.connect(audioContext.destination);
  } catch (error) {
    console.error("Failed to play sound effect:", error);
  }
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string, duration = DEFAULT_TOAST_DURATION) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId));
    toastTimeouts.delete(toastId);
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, duration);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, state.limit),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = initialState;

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

interface ToastCreationOptions extends ToastOptions {
  id?: string;
}

function createToast({ 
  variant = "default", 
  duration = DEFAULT_TOAST_DURATION,
  position,
  playSound = false,
  id = genId(),
  ...props 
}: ToastCreationOptions) {
  if (playSound) {
    playSoundEffect(variant);
  }

  const update = (props: Partial<ToastProps>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
    
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      variant,
      duration,
      position,
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
        props.onOpenChange?.(open);
      },
      onDismiss: () => {
        dismiss();
        props.onDismiss?.();
      },
    },
  });

  // Auto-dismiss based on duration
  if (duration !== Infinity) {
    addToRemoveQueue(id, duration);
  }

  return {
    id,
    dismiss,
    update,
  };
}

// Main toast function
export function toast(options: ToastOptions) {
  return createToast(options);
}

// Convenience methods for different toast types
toast.default = (props: ToastOptions) => createToast({ ...props, variant: "default" });
toast.success = (props: ToastOptions) => createToast({ ...props, variant: "success" });
toast.error = (props: ToastOptions) => createToast({ ...props, variant: "destructive" });
toast.warning = (props: ToastOptions) => createToast({ ...props, variant: "warning" });
toast.info = (props: ToastOptions) => createToast({ ...props, variant: "info" });

// Configure global toast settings
toast.configure = (options: { 
  limit?: number;
  position?: ToastPosition;
}) => {
  if (options.limit) {
    memoryState = {
      ...memoryState,
      limit: options.limit,
    };
  }
  
  if (options.position) {
    memoryState = {
      ...memoryState,
      position: options.position,
    };
  }
};

// Dismiss all toasts
toast.dismiss = (toastId?: string) => 
  dispatch({ type: "DISMISS_TOAST", toastId });

// Remove all toasts immediately
toast.remove = (toastId?: string) => 
  dispatch({ type: "REMOVE_TOAST", toastId });

// Hook for consuming toast state
export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    remove: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
  };
}