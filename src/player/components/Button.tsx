import { ReactNode } from "react";
import s from "../Player.module.css";

/** YtpButton — control bar button with tooltip via data-attribute */
export function YtpButton({
  tooltip,
  onClick,
  onMouseEnter,
  ariaLabel,
  className = "",
  ariaPressed,
  children,
}: {
  tooltip: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  ariaLabel?: string;
  className?: string;
  ariaPressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${s.ytpButton} ${className}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-label={ariaLabel ?? tooltip}
      data-tooltip={tooltip}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  );
}
