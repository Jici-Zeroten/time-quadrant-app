export const Button = ({ children, className = "", ...props }) => (
  <button
    className={`px-4 py-2 bg-black text-white rounded ${className}`}
    {...props}
  >
    {children}
  </button>
);
