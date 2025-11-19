import { createContext, useContext, useState } from "react";
import apiClient from "../api/apiClient"; // Make sure you have this file

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create a "hook" to easily use the context
export const useAuth = () => useContext(AuthContext);

// 3. Create the Provider component (this will wrap your whole app)
export const AuthProvider = ({ children }) => {
  // Get user from localStorage on initial load
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("prakriti_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // --- Login Function ---
  const login = async (username, password) => {
    try {
      const response = await apiClient.post("/auth/login", {
        username,
        password,
      });

      if (response.data && response.data.username) {
        const userData = {
          username: response.data.username,
          role: response.data.role,
        };
        localStorage.setItem("prakriti_user", JSON.stringify(userData));
        setUser(userData);
        return userData; // Return user on success
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Pass the error message from the backend (e.g., "invalid credentials")
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  // --- Signup Function ---
  const signup = async (username, email, password, role) => {
    try {
      const response = await apiClient.post("/auth/signup", {
        username,
        email,
        password,
        role,
      });
      return response.data; // Return success message
    } catch (error) {
      console.error("Signup failed:", error);
      throw new Error(error.response?.data?.error || "Signup failed");
    }
  };

  // --- Logout Function ---
  const logout = () => {
    localStorage.removeItem("prakriti_user");
    setUser(null);
  };

  // Provide state and functions to all children
  const value = { user, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};