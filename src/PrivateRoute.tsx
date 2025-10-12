import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useLocation } from "react-router-dom";
import { CircularProgress } from "@mui/material";

export const PrivateRoute = (params: { path: string, element: any }) => {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return (<CircularProgress />);
  return isAuthenticated
    ? (params.element)
    : (<Navigate to={{ pathname: "/" }} state={{ state: { from: pathname } }} />);
}
