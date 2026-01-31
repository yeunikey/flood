import localFont from "next/font/local";

export const roboto = localFont({
  src: [
    { path: "./roboto/Roboto-Thin.ttf", weight: "100", style: "normal" },
    { path: "./roboto/Roboto-ThinItalic.ttf", weight: "100", style: "italic" },
    { path: "./roboto/Roboto-ExtraLight.ttf", weight: "200", style: "normal" },
    {
      path: "./roboto/Roboto-ExtraLightItalic.ttf",
      weight: "200",
      style: "italic",
    },
    { path: "./roboto/Roboto-Light.ttf", weight: "300", style: "normal" },
    { path: "./roboto/Roboto-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "./roboto/Roboto-Regular.ttf", weight: "400", style: "normal" },
    { path: "./roboto/Roboto-Italic.ttf", weight: "400", style: "italic" },
    { path: "./roboto/Roboto-Medium.ttf", weight: "500", style: "normal" },
    {
      path: "./roboto/Roboto-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    { path: "./roboto/Roboto-SemiBold.ttf", weight: "600", style: "normal" },
    {
      path: "./roboto/Roboto-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    { path: "./roboto/Roboto-Bold.ttf", weight: "700", style: "normal" },
    { path: "./roboto/Roboto-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "./roboto/Roboto-ExtraBold.ttf", weight: "800", style: "normal" },
    {
      path: "./roboto/Roboto-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    { path: "./roboto/Roboto-Black.ttf", weight: "900", style: "normal" },
    { path: "./roboto/Roboto-BlackItalic.ttf", weight: "900", style: "italic" },
  ],
  variable: "--font-roboto",
});
