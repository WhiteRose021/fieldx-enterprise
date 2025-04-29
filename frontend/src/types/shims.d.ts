// src/types/shims.d.ts
declare module 'class-variance-authority' {
    export type VariantProps<T extends (...args: any) => any> = {
      [K in keyof Parameters<T>[0]]: Parameters<T>[0][K];
    };
    
    export function cva(
      base: string,
      config: {
        variants?: Record<string, Record<string, string>>;
        defaultVariants?: Record<string, string>;
        compoundVariants?: Array<Record<string, string> & { class: string }>;
      }
    ): (props?: Record<string, any>) => string;
  }
  
  declare module 'clsx' {
    export type ClassValue =
      | string
      | number
      | boolean
      | undefined
      | null
      | { [key: string]: any }
      | ClassValue[];
  
    export default function clsx(...inputs: ClassValue[]): string;
  }
  
  declare module 'tailwind-merge' {
    export function twMerge(...inputs: string[]): string;
  }