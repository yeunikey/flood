import type {} from "@mui/x-date-pickers/themeAugmentation";
import { createTheme } from "@mui/material";

const DEFAULT_HEIGHT = 40;

const theme = createTheme({
  palette: {
    primary: {
      main: "#497ab3",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          padding: "0px 24px",
          height: DEFAULT_HEIGHT,
        },
      },
    },
    MuiPickersInputBase: {
      styleOverrides: {
        root: {
          height: DEFAULT_HEIGHT,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          height: DEFAULT_HEIGHT,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          height: DEFAULT_HEIGHT,
          padding: "0px 10px",
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        notched: true,
      },
    },
    MuiInputLabel: {
      defaultProps: {
        shrink: true,
      },
    },
  },
  typography: {
    fontFamily: "var(--font-golos)",
  },
});

export default theme;
