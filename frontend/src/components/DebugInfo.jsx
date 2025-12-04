import React from 'react';

const DebugInfo = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'black', 
      color: 'white', 
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>API URL: {import.meta.env.VITE_API_URL || 'UNDEFINED'}</div>
      <div>Google Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID || 'UNDEFINED'}</div>
      <div>Mode: {import.meta.env.MODE}</div>
      <div>Dev: {import.meta.env.DEV ? 'YES' : 'NO'}</div>
    </div>
  );
};

export default DebugInfo;