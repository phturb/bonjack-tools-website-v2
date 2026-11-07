import {
  Home,
  LoisDesNorms,
  CryptoTracker,
  GuessTheSong,
  OtherProjects,
  Profile,
} from "./pages";

export interface AppRoute {
  name: string;
  path: string;
  element: React.ComponentType;
}

export const homeRoute: AppRoute = { name: "Home", path: "/", element: Home };
export const loisDesNormsRoute: AppRoute = {
  name: "Lois des Norms",
  path: "/lois-des-norms",
  element: LoisDesNorms,
};
export const guessTheSongRoute: AppRoute = {
  name: "Guess the Song",
  path: "/guess-the-song",
  element: GuessTheSong,
};
export const cryptoTracker: AppRoute = {
  name: "Crypto Tracker",
  path: "/crypto-tracker",
  element: CryptoTracker,
};
export const profile: AppRoute = {
  name: "Profile",
  path: "/profile",
  element: Profile,
};
export const otherProjects: AppRoute = {
  name: "Other Projects",
  path: "/other-projects",
  element: OtherProjects,
};

export const routes: AppRoute[] = [
  homeRoute,
  loisDesNormsRoute,
  guessTheSongRoute,
  cryptoTracker,
  profile,
  otherProjects,
];

export const cryptoRoutes = {
  name: "Crypto",
  routes: [cryptoTracker],
};

export const gamesToolRoutes = {
  name: "Games Tool",
  routes: [loisDesNormsRoute, guessTheSongRoute],
};
