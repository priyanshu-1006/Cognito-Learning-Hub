import React, { useContext } from 'react';
  import { Navigate, useLocation } from 'react-router-dom';
  import { AuthContext } from '../context/AuthContext';

  const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const location = useLocation();

    // If the auth state is still loading, don't render anything yet.
    // This prevents a flicker from the protected page to the login page.
    if (loading) {
      return null; // Or a loading spinner if you prefer
    }

    // If the user is not authenticated, redirect them to the login page.
    // We also pass the page they were trying to access in the state,
    // so we can redirect them back after they log in.
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If the user is authenticated, render the child components (the protected page).
    return children;
  };

  export default ProtectedRoute;