import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const { user, loader } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give auth context time to load user data
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking authentication
  if (loader || isChecking) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="relative">
          {/* Logo with pulse and bounce animation */}
          <img
            src="/logo.png"
            alt="Loading..."
            className="w-20 h-20 md:w-24 md:h-24 "
          />
          {/* Spinning ring around logo */}
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        {/* Loading text */}
        <p className="mt-6 text-gray-600 text-lg font-medium animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
