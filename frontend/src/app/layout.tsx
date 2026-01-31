import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import Authorize from "@/shared/ui/Authorize";
import { ToastContainer } from "react-toastify";
import { roboto } from "@/shared/fonts/roboto";

export const metadata: Metadata = {
  title: "Панель управления Flood Analytics",
  description:
    "Разработка системы прогнозирования катастрофических паводков в Восточно-Казахстанской области с применением данных ДЗЗ, ГИС-технологий и машинного обучения (ИРН BR24992899)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>
        <ToastContainer autoClose={5000} hideProgressBar />

        <Authorize>{children}</Authorize>
      </body>
    </html>
  );
}
