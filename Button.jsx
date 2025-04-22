export default function Button({ children, onClick, variant = 'primary', disabled }) {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
    };
  
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${variants[variant]}`}
      >
        {children}
      </button>
    );
  }