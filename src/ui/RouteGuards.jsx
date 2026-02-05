import React from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, getRole } from '../lib/api';

export function RequireAuth({ children }) {
  const token = getAuthToken();
  if (!token) return <Navigate to="/" replace />;
  return children;
}

export function RequireRole({ roles, children }) {
  const token = getAuthToken();
  const role = getRole();
  if (!token) return <Navigate to="/" replace />;
  if (!roles.includes(role)) return <Navigate to="/" replace />;
  return children;
}
