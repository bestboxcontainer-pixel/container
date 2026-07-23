import type { SVGProps } from "react";

export function BrandLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <rect width="32" height="32" rx="6" fill="currentColor" />
      <path
        d="M9 21V13.5L16 9l7 4.5V21h-4.5v-5h-5v5H9Z"
        fill="white"
      />
    </svg>
  );
}
