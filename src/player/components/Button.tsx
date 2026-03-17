import { ButtonHTMLAttributes, ReactNode } from "react";
import s from "../Player.module.css";

type YtpButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tooltip: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  children: ReactNode;
};

/** YtpButton — control bar button with tooltip via data-attribute */
export function YtpButton({
  tooltip,
  onClick,
  onMouseEnter,
  ariaLabel,
  className = "",
  ariaPressed,
  children,
  ...rest
}: YtpButtonProps) {
  return (
    <button
      type="button"
      className={`${s.ytpButton} ${className}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-label={ariaLabel ?? tooltip}
      data-tooltip={tooltip}
      aria-pressed={ariaPressed}
      {...rest}
    >
      {children}
    </button>
  );
}
