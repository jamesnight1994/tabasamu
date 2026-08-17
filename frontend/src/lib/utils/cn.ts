import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Class-name merge. Tailwind-aware, so later utilities win predictably. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
