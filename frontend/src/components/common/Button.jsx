import React from "react";
import "./Button.css";

function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  icon = null,
  iconPosition = "left",
  ...rest
}) {
  const classNames = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? "btn-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {icon && iconPosition === "left" && <span className="btn-icon">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="btn-icon">{icon}</span>}
    </button>
  );
}

export default Button;
