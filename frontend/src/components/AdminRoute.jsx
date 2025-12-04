import React, { useContext } from 'react';
  import { Navigate } from 'react-router-dom';
  import { AuthContext } from '../context/AuthContext';

  const AdminRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return null; // Or a spinner
    if (!user || user.role !== 'Admin') {
      return <Navigate to="/" />; // Redirect to home if not an admin
    }
    return children;
  };
  export default AdminRoute;