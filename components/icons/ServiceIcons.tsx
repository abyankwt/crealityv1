import type { SVGProps } from "react";

/** House with wrench + screwdriver — Field Service */
export function FieldServiceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* House outline */}
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" />
      {/* Wrench (left side) */}
      <path d="M8 21v-4" />
      <path d="M6 17a2 2 0 104 0 2 2 0 00-4 0z" />
      {/* Screwdriver (right side) */}
      <line x1="16" y1="21" x2="16" y2="16" />
      <path d="M14.5 16h3" />
      <path d="M14.5 14h3v2h-3z" />
    </svg>
  );
}

/** Shield with exclamation — Technical Repair */
export function TechnicalRepairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="15.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Wrench + expired calendar badge — Post-Warranty */
export function PostWarrantyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Wrench */}
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      {/* Calendar */}
      <rect x="1" y="13" width="10" height="9" rx="1" />
      <line x1="1" y1="17" x2="11" y2="17" />
      <line x1="4" y1="11" x2="4" y2="14" />
      <line x1="8" y1="11" x2="8" y2="14" />
      {/* X on calendar */}
      <line x1="3.5" y1="19.5" x2="6.5" y2="22.5" />
      <line x1="6.5" y1="19.5" x2="3.5" y2="22.5" />
    </svg>
  );
}
