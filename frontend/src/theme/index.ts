import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#10b981", // Green color for TradeUp
      light: "#34d399",
      dark: "#059669",
    },
    secondary: {
      main: "#ef4444", // Red color for TradeUp
      light: "#f87171",
      dark: "#dc2626",
    },
    background: {
      default: "#f9fafb",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "3.5rem",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: "2.5rem",
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.8rem",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        },
      },
    },
  },
});

// Custom gradients as constants (not functions)
export const customGradients = {
  primary: "linear-gradient(135deg, #10b981 0%, #ef4444 100%)",
  background: "linear-gradient(145deg, #f0fdf4 0%, #fef2f2 50%, #ffffff 50%)",
};
