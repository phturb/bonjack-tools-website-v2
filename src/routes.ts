import {
  Home,
  LoisDesNorms,
  CryptoTracker,
  GuessTheSong,
  OtherProjects,
  Profile,
  SwissList,
  SwissNew,
  SwissTournament,
} from "./pages";

export interface AppRoute {
  name: string;
  path: string;
  element: React.ComponentType;
  /** Registered with the router but left out of every navigation menu. */
  hidden?: boolean;
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
export const swissList: AppRoute = {
  name: "Swiss Tournament",
  path: "/swiss",
  element: SwissList,
};
export const swissNew: AppRoute = {
  name: "New Swiss Tournament",
  path: "/swiss/new",
  element: SwissNew,
  hidden: true,
};
export const swissTournament: AppRoute = {
  name: "Swiss Tournament Details",
  path: "/swiss/:id",
  element: SwissTournament,
  hidden: true,
};

export const routes: AppRoute[] = [
  homeRoute,
  loisDesNormsRoute,
  guessTheSongRoute,
  cryptoTracker,
  profile,
  otherProjects,
  swissList,
  swissNew,
  swissTournament,
];

/** Routes shown in navigation menus. */
export const menuRoutes: AppRoute[] = routes.filter((route) => !route.hidden);

export const cryptoRoutes = {
  name: "Crypto",
  routes: [cryptoTracker],
};

export const gamesToolRoutes = {
  name: "Games Tool",
  routes: [loisDesNormsRoute, guessTheSongRoute, swissList],
};
