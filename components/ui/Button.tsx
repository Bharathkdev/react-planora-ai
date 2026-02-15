const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) => {

  // Base styling applied to every button
  const baseClass = 'btn';

  // Variant controls visual style (primary, ghost, outline, etc.)
  const variantClass = `btn--${variant}`;

  // Size controls padding & font scale
  const sizeClass = `btn--${size}`;

  // Expands button to container width when needed
  const fullWidthClass = fullWidth ? 'btn--full' : '';

  // Compose final class list while safely ignoring empty values
  const combinedClasses = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    // Spread props allows native button behavior (onClick, type, disabled, etc.)
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
