import { app, BrowserWindow } from "electron";
import * as path from "path";

app.name = "FloodAnalytics";
app.setPath("userData", path.join(app.getPath("appData"), app.name));

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      backgroundThrottling: false,
      partition: "persist:flood_session",
    },
  });

  win.loadURL("https://panel.flood.astanait.edu.kz/");
};

app.commandLine.appendSwitch("disk-cache-size", "1073741824");
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
