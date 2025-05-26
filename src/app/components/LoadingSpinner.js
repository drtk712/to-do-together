export default function LoadingSpinner({ className = "", size = "h-12 w-12" }) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full ${size} border-b-2 border-indigo-600 mx-auto`}></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
} 