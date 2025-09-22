import React, { createContext, useEffect, useState } from "react";
import { useMemo } from "react";
import axios from "axios";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../config/firebase.init";
import {
  registerUser as registerUserFn,
  loginUser as loginUserFn,
  logout as logoutUserFn,
  getCurrentUser,
  isAuthenticated,
} from "../../utils/auth";

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Memoized userId and role from decoded token
  const userId = useMemo(() => user?._id || user?.id || null, [user]);
  const userRole = useMemo(() => user?.role || null, [user]);
  const [loader, setLoader] = useState(true);
  const [error, setError] = useState("");

  // Sign up new user
  const signUp = async (userData) => {
    try {
      setLoader(true);
      const result = await registerUserFn(userData);

      // Set user from decoded token
      if (result && result.token) {
        setUser(getCurrentUser());
      }

      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setLoader(true);
      const result = await loginUserFn(credentials);
      setUser(getCurrentUser());
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await logoutUserFn();
      setUser(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      // Make API call to update user
      const response = await axios.patch(
        `http://localhost:3000/api/auth/users/${userData._id}`,
        userData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Update user from backend response (if token is refreshed)
      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        setUser(getCurrentUser());
      }

      return response.data;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Google login
  const googleLogin = async () => {
    try {
      setLoader(true);
      setError("");

      // Use Firebase signInWithPopup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Firebase Google user:", user);

      if (user) {
        // Create user object for backend authentication
        const userImp = {
          name: user.displayName,
          email: user.email,
          photoUrl: user.photoURL, // Firebase provides photoURL
          role: "customer",
        };

        if (userImp.email && userImp.name) {
          try {
            // Use the new Google authentication endpoint
            const response = await axios.post(
              "http://localhost:3000/api/auth/google-auth",
              userImp
            );
            console.log("Google authentication response:", response.data);

            // Store token and set user if successful
            if (response.data.token) {
              localStorage.setItem("token", response.data.token);
              setUser(getCurrentUser());
            }

            return result; // Return the Firebase result
          } catch (err) {
            console.error(
              "Error during Google authentication:",
              err.response || err
            );
            throw new Error(
              err.response?.data?.message || "Google authentication failed"
            );
          }
        } else {
          throw new Error("Missing user data from Google");
        }
      } else {
        throw new Error("No user data received from Google");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message || "Failed to log in with Google");
      throw error;
    } finally {
      setLoader(false);
    }
  };

  // Check authentication status on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setUser(getCurrentUser());
      } else {
        setUser(null);
      }
      setLoader(false);
    };

    checkAuth();

    // Listen for storage events to sync auth state across tabs
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const contextValue = {
    user,
    userId,
    userRole,
    signUp,
    login,
    logout,
    updateUser,
    googleLogin,
    error,
    setError,
    loader,
    setLoader,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
