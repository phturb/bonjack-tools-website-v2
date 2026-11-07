import React, { useState } from "react";
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
import { Link as RouterLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  AppRoute,
  cryptoRoutes,
  gamesToolRoutes,
  homeRoute,
  otherProjects,
  profile,
  routes,
} from "../routes";

type Anchor = HTMLElement | null;

const DropdownMenu = (props: {
  id: string;
  label: string;
  routes: AppRoute[];
}) => {
  const [anchor, setAnchor] = useState<Anchor>(null);
  return (
    <>
      <Button
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ my: 2, color: "white", display: "block" }}
      >
        {props.label}
      </Button>
      <Menu
        id={props.id}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        keepMounted
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {props.routes.map((route) => (
          <MenuItem
            key={route.name}
            component={RouterLink}
            to={route.path}
            onClick={() => setAnchor(null)}
          >
            <Typography textAlign="center">{route.name}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const NavBar = () => {
  const [anchorElNav, setAnchorElNav] = useState<Anchor>(null);
  const [anchorElProfile, setAnchorElProfile] = useState<Anchor>(null);
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  const navButton = (route: AppRoute) => (
    <Button
      component={RouterLink}
      to={route.path}
      key={route.name}
      sx={{ my: 2, color: "white", display: "block" }}
    >
      {route.name}
    </Button>
  );

  const profileButton = !isAuthenticated ? (
    <Button
      onClick={() =>
        loginWithRedirect({
          appState: { returnTo: window.location.pathname + window.location.search },
        })
      }
      sx={{ my: 2, color: "white" }}
    >
      Login
    </Button>
  ) : (
    <Box sx={{ flexGrow: 0 }}>
      <Tooltip title="Open settings">
        <IconButton
          onClick={(event: React.MouseEvent<HTMLElement>) =>
            setAnchorElProfile(event.currentTarget)
          }
          sx={{ p: 0 }}
        >
          <Avatar alt={user?.name} src={user?.picture} />
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: "45px" }}
        id="menu-profile"
        anchorEl={anchorElProfile}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={Boolean(anchorElProfile)}
        onClose={() => setAnchorElProfile(null)}
      >
        <MenuItem
          component={RouterLink}
          to={profile.path}
          onClick={() => setAnchorElProfile(null)}
        >
          <Typography textAlign="center">Profile</Typography>
        </MenuItem>
        <MenuItem
          onClick={() =>
            logout({ logoutParams: { returnTo: window.location.origin } })
          }
        >
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
                aria-label="open navigation"
                onClick={(event: React.MouseEvent<HTMLElement>) =>
                  setAnchorElNav(event.currentTarget)
                }
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="navigation-menu"
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                keepMounted
                anchorEl={anchorElNav}
                open={Boolean(anchorElNav)}
                onClose={() => setAnchorElNav(null)}
              >
                {routes.map((route) => (
                  <MenuItem
                    key={route.name}
                    component={RouterLink}
                    to={route.path}
                    onClick={() => setAnchorElNav(null)}
                  >
                    <Typography textAlign="center">{route.name}</Typography>
                  </MenuItem>
                ))}
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
              {navButton(homeRoute)}
              <DropdownMenu
                id="navigation-menu-crypto"
                label={cryptoRoutes.name}
                routes={cryptoRoutes.routes}
              />
              <DropdownMenu
                id="navigation-menu-games"
                label={gamesToolRoutes.name}
                routes={gamesToolRoutes.routes}
              />
              {navButton(otherProjects)}
            </Box>
            {profileButton}
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};

export default NavBar;
