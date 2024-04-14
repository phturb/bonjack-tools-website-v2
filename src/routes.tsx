import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Route, useLocation } from "react-router-dom";
import {
  Home,
  LoisDesNorms,
  LunaBot,
  CryptoTracker,
  ExpenseManager,
  OtherProjects,
} from "./pages";
import Profile from "./pages/Profile";
import { CircularProgress } from "@mui/material";

export const PrivateRoute = (params: { path: string, element: any}) => {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) return (<CircularProgress />);
  return isAuthenticated
    ? (params.element)
    : (<Navigate to={{ pathname: "/" }} state={{ state: { from: pathname }}} />);
}

export const homeRoute = { name: "Home", path: "/", element: Home };
export const loisDesNormsRoute = {
  name: "LoisDesNorms",
  path: "/lois-des-norms",
  element: LoisDesNorms,
};
export const cryptoTracker = {
  name: "Crypto Tracker",
  path: "/crypto-tracker",
  element: CryptoTracker,
};
export const lunaBot = {
  name: "Luna Bot",
  path: "/luna-bot",
  element: LunaBot,
};
export const expensesTracker = {
  name: "Expense Tracker",
  path: "/expense-tracker",
  element: ExpenseManager,
};

export const profile = {
  name: "Profile",
  path: "/profile",
  element: Profile
};

export const otherProjects = {
  name: "Other Projects",
  path: "/other-projects",
  element: OtherProjects,
};

export const routes = [
  homeRoute,
  loisDesNormsRoute,
  expensesTracker,
  cryptoTracker,
  lunaBot,
  otherProjects,
];

export const privateRoutes = [
  profile
];

export const cryptoRoutes = {
  name: "Crypto",
  routes: [cryptoTracker, lunaBot],
};

export const gamesToolRoutes = {
  name: "Games Tool",
  routes: [loisDesNormsRoute],
};
