import { jwtDecode } from "jwt-decode";
// Authentication utilities for JWT

const API_URL = import.meta.env.VITE_API_URL;

// Function to handle user registration
export const registerUser = async (userData) => {
  // Make sure we include a role to avoid "Invalid role specified" error
  const registrationData = {
    ...userData,
    role: userData.role || "customer", // Default to "customer" if role not provided
  };

  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registrationData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  // If the backend returns a token on registration, store it
  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  return data;
};

// Function to handle user login
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store token and user info
    // Store only token
    localStorage.setItem("token", data.token);

    return data;
  } catch (error) {
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

// Get the current user by decoding the token
export const getCurrentUser = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

// Get the auth token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Log out user
export const logout = () => {
  localStorage.removeItem("token");
};

// Create auth header for protected API requests
export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
