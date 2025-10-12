import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { CircularProgress } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header, Footer } from "./components";
import { PrivateRoute } from "./PrivateRoute";
import { privateRoutes, routes } from "./routes";

const App = () => {

  const { isLoading } = useAuth0();

  const content = isLoading ? <CircularProgress /> : (
    <Routes>
      {routes.map((route) => (
        <Route
          key={route.name}
          path={route.path}
          element={<route.element />}
        />
      ))}
      {privateRoutes.map((route) => (
        <Route
          key={route.name}
          path={route.path}
          element={
            <PrivateRoute path={route.path} element={<route.element />} />
          }
        />
      ))}
    </Routes>
  );


  return (
    <BrowserRouter>
      <Header />
      {content}
      <Footer />
    </BrowserRouter>
  );
};

export default App;
