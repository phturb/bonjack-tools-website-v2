import { Suspense } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { CircularProgress } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header, Footer, ErrorBoundary } from "./components";
import { routes } from "./routes";

const App = () => {
  const { isLoading } = useAuth0();

  const content = isLoading ? (
    <CircularProgress />
  ) : (
    <Routes>
      {routes.map((route) => (
        <Route
          key={route.name}
          path={route.path}
          element={<route.element />}
        />
      ))}
    </Routes>
  );

  return (
    <BrowserRouter>
      <Header />
      <ErrorBoundary>
        <Suspense fallback={<CircularProgress />}>{content}</Suspense>
      </ErrorBoundary>
      <Footer />
    </BrowserRouter>
  );
};

export default App;
