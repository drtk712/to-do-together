export default function Button({ 
  children, 
  type = "button", 
  variant = "primary", 
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props 
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform active:scale-95";
  
  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-lg",
    secondary: "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-md",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg",
    success: "text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };
  
  const disabledClasses = disabled || loading ? "opacity-50 cursor-not-allowed transform-none" : "";
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
      )}
      {children}
    </button>
  );
} 