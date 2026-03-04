import localFont from "next/font/local";

export const golos = localFont({
  src: [
    { path: "./golos/GolosText-Regular.ttf", weight: "400", style: "normal" },
    { path: "./golos/GolosText-Medium.ttf", weight: "500", style: "normal" },
    { path: "./golos/GolosText-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./golos/GolosText-Bold.ttf", weight: "700", style: "normal" },
    { path: "./golos/GolosText-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "./golos/GolosText-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-golos",
});
