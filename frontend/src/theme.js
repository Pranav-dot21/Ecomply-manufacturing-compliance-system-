import { createTheme } from "@mui/material/styles";

const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
            primary: { main: "#66BB6A", light: "#A5D6A7", dark: "#2E7D32" },
            secondary: { main: "#FFB74D", light: "#FFE0B2", dark: "#F57C00" },
            background: { default: "#121212", paper: "#1E1E1E" },
            text: { primary: "#E0E0E0", secondary: "#9E9E9E" },
            error: { main: "#EF5350" },
            warning: { main: "#FFA726" },
            success: { main: "#66BB6A" },
            info: { main: "#42A5F5" },
          }
        : {
            primary: { main: "#2E7D32", light: "#66BB6A", dark: "#1B5E20" },
            secondary: { main: "#F57C00", light: "#FFB74D", dark: "#E65100" },
            background: { default: "#F5F5F5", paper: "#FFFFFF" },
            text: { primary: "#212121", secondary: "#757575" },
            error: { main: "#D32F2F" },
            warning: { main: "#F57C00" },
            success: { main: "#2E7D32" },
            info: { main: "#1976D2" },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === "dark"
                ? "0 2px 12px rgba(0,0,0,0.4)"
                : "0 2px 12px rgba(0,0,0,0.08)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
        },
      },
    },
  });

export { getAppTheme };
