import React, { createContext, useState, useEffect, useContext } from 'react';
  import { jwtDecode } from 'jwt-decode'; // We need a library to decode the token

  // Create the context
  export const AuthContext = createContext(null);

  // Custom hook to use the AuthContext
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };

  // Create the provider component
  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Check for a token in localStorage when the app loads
      const token = localStorage.getItem('quizwise-token');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          // Check if the token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            localStorage.removeItem('quizwise-token');
            setUser(null);
          } else {
            setUser(decodedToken.user);
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem('quizwise-token');
          setUser(null);
        }
      }
      setLoading(false);
    }, []);

    const login = (token) => {
      localStorage.setItem('quizwise-token', token);
      const decodedToken = jwtDecode(token);
      setUser(decodedToken.user);
    };

    const logout = () => {
      localStorage.removeItem('quizwise-token');
      setUser(null);
    };

    // The value provided to consuming components
    const value = {
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading,
    };

    return (
      <AuthContext.Provider value={value}>
        {!loading && children}
      </AuthContext.Provider>
    );
  };