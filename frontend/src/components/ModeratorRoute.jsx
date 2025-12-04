import React, { useContext } from 'react';
  import { Navigate } from 'react-router-dom';
  import { AuthContext } from '../context/AuthContext';

  const ModeratorRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return null;
    if (!user || (user.role !== 'Moderator' && user.role !== 'Admin')) {
      return <Navigate to="/" />; // Redirect if not a Moderator or Admin
    }
    return children;
  };
  export default ModeratorRoute;