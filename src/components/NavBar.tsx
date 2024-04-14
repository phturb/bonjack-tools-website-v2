import React from "react";
import {
  AppBar,
  Box,
  Menu,
  Container,
  Button,
  MenuItem,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import {
  cryptoRoutes,
  gamesToolRoutes,
  homeRoute,
  expensesTracker,
  otherProjects,
  routes,
} from "../routes";
import { Link as RouterLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const NavBar = () => {
  const [anchorElNav, setAnchorElNav] = useState<HTMLElement | null>(null);
  const [anchorElCrypto, setAnchorElCrypto] = useState<HTMLElement | null>(
    null
  );
  const [anchorElGames, setAnchorElGames] = useState<HTMLElement | null>(null);
  const [anchorElProfile, setAnchorElProfile] = useState<HTMLElement | null>(
    null
  );

  const handleOpenUserMenu = (
    event: React.MouseEvent<HTMLElement>,
    anchorSet: (value: React.SetStateAction<HTMLElement | null>) => void
  ) => {
    anchorSet(event.currentTarget);
  };

  const handleCloseNavMenu = (
    anchorSet: (value: React.SetStateAction<HTMLElement | null>) => void
  ) => {
    anchorSet(null);
  };

  const buttonNavGenerator = (route: { name: string; path: string }) => {
    return (
      <Button
        component={RouterLink}
        to={route.path}
        key={route.name + "-nav"}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          handleCloseNavMenu(setAnchorElNav);
        }}
        sx={{ my: 2, color: "white", display: "block" }}
      >
        {route.name}
      </Button>
    );
  };

  const menuItemNavGenerator = (route: { name: string; path: string }) => {
    return (
      <MenuItem
        key={route.name + "-nav"}
        component={RouterLink}
        to={route.path}
        onClick={(event: React.MouseEvent<HTMLElement>) => {
          handleCloseNavMenu(setAnchorElNav);
        }}
      >
        <Typography textAlign="center">{route.name}</Typography>
      </MenuItem>
    );
  };

  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  console.log(isAuthenticated);
  console.log(user);
  const profileButton = !isAuthenticated ? (
    <Button onClick={() => loginWithRedirect()} sx={{ my: 2, color: "white" }}>
      Login
    </Button>
  ) : (
    <Box sx={{ flexGrow: 0 }}>
      <Tooltip title="Open settings">
        <IconButton
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            handleOpenUserMenu(event, setAnchorElProfile);
          }}
          sx={{ p: 0 }}
        >
          <Avatar alt={user?.name} src={user?.picture} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorEl={anchorElProfile}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorElProfile)}
        onClose={(event: React.MouseEvent<HTMLElement>) => {
          handleCloseNavMenu(setAnchorElProfile);
        }}
      >
        <MenuItem
          key="profile"
          component={RouterLink}
          to="/profile"
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            handleCloseNavMenu(setAnchorElProfile);
          }}
        >
          <Typography textAlign="center">Profile</Typography>
        </MenuItem>
        <MenuItem key="logout" onClick={() => logout()}>
          <Typography textAlign="center">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              component="div"
              noWrap
              sx={{ mr: 2, display: { xs: "none", md: "flex" } }}
            >
              BonJack Tools
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                color="inherit"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  handleOpenUserMenu(event, setAnchorElNav);
                }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="navigation-menu"
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                anchorEl={anchorElNav}
                open={Boolean(anchorElNav)}
                onClose={(event: React.MouseEvent<HTMLElement>) => {
                  handleCloseNavMenu(setAnchorElNav);
                }}
              >
                {routes.map(menuItemNavGenerator)}
              </Menu>
            </Box>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}
            >
              BonJack Tools
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {buttonNavGenerator(homeRoute)}

              <Button
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  handleOpenUserMenu(event, setAnchorElCrypto);
                }}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {cryptoRoutes.name}
              </Button>
              <Menu
                id={`navigation-menu-${cryptoRoutes.name}`}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                anchorEl={anchorElCrypto}
                open={Boolean(anchorElCrypto)}
                onClose={(event: React.MouseEvent<HTMLElement>) => {
                  handleCloseNavMenu(setAnchorElCrypto);
                }}
              >
                {cryptoRoutes.routes.map(menuItemNavGenerator)}
              </Menu>
              <Button
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  handleOpenUserMenu(event, setAnchorElGames);
                }}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {gamesToolRoutes.name}
              </Button>
              <Menu
                id={`navigation-menu-${gamesToolRoutes.name}`}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                anchorEl={anchorElGames}
                open={Boolean(anchorElGames)}
                onClose={(event: React.MouseEvent<HTMLElement>) => {
                  handleCloseNavMenu(setAnchorElGames);
                }}
              >
                {gamesToolRoutes.routes.map(menuItemNavGenerator)}
              </Menu>
              {buttonNavGenerator(expensesTracker)}
              {buttonNavGenerator(otherProjects)}
            </Box>
            {profileButton}
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};

export default NavBar;
