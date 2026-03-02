import { ThemeProvider } from "@mui/material";
import { ReactNode } from "react";
import theme from "../model/theme";

type ThemeProps = {
  children: ReactNode;
};

function Theme({ children }: ThemeProps) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export default Theme;
