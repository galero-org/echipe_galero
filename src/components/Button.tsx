import React from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost"
  | "link";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean; // Opțional, pentru a afișa un spinner
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  isLoading,
  className = "", // Permite adăugarea de clase suplimentare
  disabled,
  ...props
}) => {
  const baseStyles =
    "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center"; // Am scos text-sm, font-medium, px, py pentru a le customiza per size

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-text-on-primary hover:bg-primary-hover focus:ring-primary disabled:bg-gray-400",
    secondary:
      "bg-secondary text-text-on-primary hover:bg-secondary-hover focus:ring-secondary disabled:bg-gray-300",
    accent:
      "bg-accent text-text-on-accent hover:bg-accent-hover focus:ring-accent disabled:bg-red-300",
    outline:
      "border border-primary text-primary hover:bg-primary hover:text-text-on-primary focus:ring-primary disabled:border-gray-300 disabled:text-gray-400",
    ghost:
      "text-primary hover:bg-primary/10 focus:ring-primary disabled:text-gray-400", // text-primary/10 pentru transparență
    link: "text-accent hover:text-accent-hover underline focus:ring-accent disabled:text-gray-400 p-0", // Fără padding default pentru link
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const actualDisabled = isLoading || disabled;

  return (
    <button
      type="button" // Default to type="button"
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={actualDisabled}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        leftIcon && <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
