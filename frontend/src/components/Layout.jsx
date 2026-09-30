import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Air,
  Water,
  Assignment,
  Description,
  DarkMode,
  LightMode,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";

const DRAWER_WIDTH = 240;
const COLLAPSED_WIDTH = 68;

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: <Dashboard /> },
  { label: "Stack Emissions", path: "/emissions", icon: <Air /> },
  { label: "Pollution Levels", path: "/pollution", icon: <Water /> },
  { label: "Inspections", path: "/inspections", icon: <Assignment /> },
  { label: "Statutory Reports", path: "/reports", icon: <Description /> },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1, minHeight: 64 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: "linear-gradient(135deg, #2E7D32, #66BB6A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Air sx={{ color: "white", fontSize: 20 }} />
        </Box>
        {!collapsed && (
          <Typography variant="h6" fontWeight={700} noWrap sx={{ color: "primary.main" }}>
            EcoComply
          </Typography>
        )}
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: collapsed ? 1.5 : 2,
                  ...(isActive && {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": { backgroundColor: "primary.dark" },
                    "& .MuiListItemIcon-root": { color: "white" },
                  }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      {!isMobile && (
        <Box sx={{ p: 1, display: "flex", justifyContent: collapsed ? "center" : "flex-end" }}>
          <IconButton onClick={() => setCollapsed(!collapsed)} size="small">
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton onClick={toggleMode} sx={{ mr: 1 }}>
              {mode === "dark" ? <LightMode sx={{ color: "#FFA726" }} /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          <Tooltip title={user?.name || "User"}>
            <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, cursor: "pointer" }} onClick={logout}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, backgroundColor: "background.paper" } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              transition: "width 0.25s ease",
              overflowX: "hidden",
              backgroundColor: "background.paper",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
