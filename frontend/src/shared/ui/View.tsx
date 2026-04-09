"use client";

import * as React from "react";

import { AppBar, Drawer, DrawerHeader } from "@/shared/model/mixin/view";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Paper,
  Autocomplete,
  TextField,
  useMediaQuery,
  Collapse,
  SwipeableDrawer,
} from "@mui/material";
import BrowserUpdatedIcon from "@mui/icons-material/BrowserUpdated";
import Box from "@mui/material/Box";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Cookies from "js-cookie";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Links from "./el/Links";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import ListItemText from "@mui/material/ListItemText";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import SettingsIcon from "@mui/icons-material/Settings";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { cn } from "@/shared/model/utils";
import { deepOrange } from "@mui/material/colors";
import { useAuth } from "@/shared/model/auth";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import { ways } from "@/configs/paths";
import { useSettings } from "@/features/settings/model/useSettings";
import SettingsWidget from "@/widgets/settings/SettingsWidget";
import { baseUrl } from "../model/api/instance";
import { usePools } from "@/entities/pool/model/usePools";
import { useLayers } from "@/entities/layer/model/useLayers";
import { useSearch } from "@/features/search/useSearch";
import { useMonitorStore } from "@/features/monitor/model/useMontorStore";
import Site from "@/entities/site/types/site";
import Pool from "@/entities/pool/types/pool";
import { Category } from "@/entities/category/types/categories";
import { useMonitorSites } from "@/features/monitor/model/useMonitorSites";
import { useMonitorMap } from "@/features/monitor/model/useMonitorMap";

interface ViewProps {
  children?: React.ReactNode;
  links?: string[];
  className?: string;
}

interface SearchOption {
  site: Site;
  category: Pool | Category;
  id: number;
}

function View({ children, links, className }: ViewProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeSites, setActiveSites } = useMonitorSites();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { setOpenSettings } = useSettings();
  const { query, setQuery } = useSearch();
  const { setSelectedCategory, setSelectedSite } = useMonitorStore();
  const { map } = useMonitorMap();

  const { pools } = usePools();
  const { layers } = useLayers();

  const options = React.useMemo(() => {
    const opts: SearchOption[] = [];
    const seen = new Set<string>();

    layers.forEach((l) => {
      l.sites.forEach((s) => {
        if (s.name) {
          const key = `${l.category.name}-${s.name}`;
          if (!seen.has(key)) {
            opts.push({ site: s, category: l.category, id: s.id });
            seen.add(key);
          }
        }
      });
    });
    return opts;
  }, [pools, layers]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const { setToken, setUser } = useAuth();

  const logout = () => {
    setToken("");
    setUser(null);

    Cookies.remove("token");

    router.push("/auth");
  };

  // Filter navigation items for bottom nav (exclude null separators and restricted items)
  const bottomNavItems = React.useMemo(() => {
    return ways
      .filter((item) => {
        if (item === null) return false;
        if (item.path === "/admin" && user?.role !== "admin") return false;
        if (
          item.path === "/import" &&
          !["admin", "editor"].includes(user?.role || "")
        )
          return false;
        return true;
      })
      .slice(0, 5) as NonNullable<(typeof ways)[number]>[];
  }, [user]);

  // Current bottom nav value
  const bottomNavValue = bottomNavItems.findIndex(
    (item) => item.path === pathname
  );

  // Mobile Drawer content
  const mobileDrawerContent = (
    <Box sx={{ width: 280, pt: 2 }} role="presentation">
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="h6" fontWeight={600}>
          Панель управления
        </Typography>
      </Box>
      <Divider />
      {(() => {
        const groups: ((typeof ways)[number][] | null)[] = [];
        let currentGroup: (typeof ways)[number][] = [];

        ways.forEach((item) => {
          if (item === null) {
            if (currentGroup.length > 0) {
              groups.push(currentGroup);
              currentGroup = [];
            }
            groups.push(null);
          } else {
            if (item.path === "/admin" && user?.role !== "admin") return;
            if (
              item.path === "/import" &&
              !["admin", "editor"].includes(user?.role || "")
            )
              return;
            currentGroup.push(item);
          }
        });

        if (currentGroup.length > 0) groups.push(currentGroup);

        return groups.map((group, groupIndex) => {
          if (group === null)
            return <Divider key={`divider-${groupIndex}`} />;

          return (
            <List key={`list-${groupIndex}`}>
              {group.map((item, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  onClick={() => {
                    if (!item) return;
                    router.push(item.path);
                    setMobileDrawerOpen(false);
                  }}
                >
                  <ListItemButton selected={pathname === item.path}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          );
        });
      })()}
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        flexDirection: "column",
      }}
    >
      <SettingsWidget />

      {/* Mobile swipeable drawer */}
      {isMobile && (
        <SwipeableDrawer
          anchor="left"
          open={mobileDrawerOpen}
          onOpen={() => setMobileDrawerOpen(true)}
          onClose={() => setMobileDrawerOpen(false)}
        >
          {mobileDrawerContent}
        </SwipeableDrawer>
      )}

      <AppBar position="fixed" open={open} elevation={0}>
        <Toolbar
          sx={{
            justifyContent: "space-between",
            minHeight: { xs: "56px !important", sm: "64px !important" },
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Left side */}
          <div className="flex items-center">
            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open mobile menu"
                onClick={() => setMobileDrawerOpen(true)}
                edge="start"
                sx={{ mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={[{ marginRight: 5 }, open && { display: "none" }]}
              >
                <MenuOpenIcon />
              </IconButton>
            )}
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ display: { xs: searchOpen ? "none" : "block", sm: "block" }, fontSize: { xs: "0.95rem", sm: "1.25rem" } }}
            >
              Панель управления
            </Typography>
          </div>

          {/* Right side */}
          <div className="flex items-center" style={{ gap: isMobile ? 4 : 64 }}>
            {/* Search: collapsed icon on mobile, full on desktop */}
            {isMobile ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {searchOpen ? (
                  <Box sx={{ display: "flex", alignItems: "center", bgcolor: "background.paper", borderRadius: 2, px: 1 }}>
                    <Autocomplete
                      freeSolo
                      sx={{ width: { xs: 180, sm: 280 } }}
                      options={options}
                      inputValue={query}
                      onInputChange={(_, newInputValue) => setQuery(newInputValue)}
                      onChange={(_, value) => {
                        if (value && typeof value !== "string") {
                          router.push(`/`);
                          setSelectedCategory(value.category);
                          setSelectedSite(value.site);
                          setSearchOpen(false);
                          setTimeout(() => {
                            if (!activeSites.some((s) => s.id === value.site.id)) {
                              setActiveSites([...activeSites, value.site]);
                            }
                            if (map && value.site.longtitude && value.site.latitude) {
                              map.flyTo({ center: [value.site.longtitude, value.site.latitude], zoom: 14, essential: true });
                            }
                          }, 1000);
                        }
                      }}
                      getOptionLabel={(option) =>
                        typeof option === "string" ? option : option.site.name
                      }
                      renderOption={(props, option) => {
                        const { key, ...rest } = props;
                        return (
                          <li key={`${option.category.name}-${option.site.name}-${option.id}`} {...rest}>
                            <div className="flex flex-col">
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                                {option.category.name}
                              </Typography>
                              <Typography variant="body2">{option.site.name}</Typography>
                            </div>
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          autoFocus
                          placeholder="Поиск объектов..."
                          variant="standard"
                          InputProps={{ ...params.InputProps, disableUnderline: true, sx: { fontSize: 14 } }}
                        />
                      )}
                    />
                    <IconButton size="small" color="inherit" onClick={() => setSearchOpen(false)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <IconButton color="inherit" onClick={() => setSearchOpen(true)}>
                    <SearchIcon />
                  </IconButton>
                )}
              </Box>
            ) : (
              <Paper
                component="form"
                sx={{ p: "0 4px", display: "flex", alignItems: "center", width: 400 }}
                elevation={0}
                onSubmit={(e) => e.preventDefault()}
              >
                <Autocomplete
                  freeSolo
                  sx={{ ml: 1, flex: 1 }}
                  options={options}
                  inputValue={query}
                  onInputChange={(_, newInputValue) => setQuery(newInputValue)}
                  onChange={(_, value) => {
                    if (value && typeof value !== "string") {
                      router.push(`/`);
                      setSelectedCategory(value.category);
                      setSelectedSite(value.site);
                      setTimeout(() => {
                        if (!activeSites.some((s) => s.id === value.site.id)) {
                          setActiveSites([...activeSites, value.site]);
                        }
                        if (map && value.site.longtitude && value.site.latitude) {
                          map.flyTo({ center: [value.site.longtitude, value.site.latitude], zoom: 14, essential: true });
                        }
                      }, 1000);
                    }
                  }}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.site.name
                  }
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={`${option.category.name}-${option.site.name}-${option.id}`} {...rest}>
                        <div className="flex flex-col">
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                            {option.category.name}
                          </Typography>
                          <Typography variant="body2">{option.site.name}</Typography>
                        </div>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Поиск метеостанции, гидропостов или других объектов"
                      variant="standard"
                      InputProps={{ ...params.InputProps, disableUnderline: true, sx: { fontSize: 14 } }}
                    />
                  )}
                />
                <IconButton type="button" sx={{ p: "10px" }} aria-label="search">
                  <SearchIcon />
                </IconButton>
              </Paper>
            )}

            <div style={{ display: "flex", gap: isMobile ? 2 : 24, alignItems: "center" }}>
              {!isMobile && (
                <IconButton
                  size="small"
                  href="https://drive.google.com/file/d/14HsJpl1Eg2G-vDpRjXnf-GNKqCiDhDNs/view?usp=drive_link"
                  target="_blank"
                >
                  <BrowserUpdatedIcon color="inherit" className="text-neutral-200" />
                </IconButton>
              )}
              {!isMobile && (
                <IconButton size="small" onClick={() => setOpenSettings(true)}>
                  <SettingsIcon color="inherit" className="text-neutral-200" />
                </IconButton>
              )}

              <Avatar
                sx={{ bgcolor: deepOrange[500], width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, cursor: "pointer" }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                src={user?.image ? `${baseUrl}/images/` + user.image : undefined}
              >
                A
              </Avatar>
            </div>

            <Menu
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              onClick={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              {isMobile && (
                <MenuItem onClick={() => setOpenSettings(true)}>
                  <Typography>Настройки</Typography>
                </MenuItem>
              )}
              <MenuItem onClick={logout}>
                <Typography color="error">Выйти</Typography>
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      {/* Desktop Drawer */}
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

        {(() => {
          const groups: ((typeof ways)[number][] | null)[] = [];
          let currentGroup: (typeof ways)[number][] = [];

          ways.forEach((item) => {
            if (item === null) {
              if (currentGroup.length > 0) {
                groups.push(currentGroup);
                currentGroup = [];
              }
              groups.push(null);
            } else {
              if (item.path === "/admin" && user?.role !== "admin") return;
              if (
                item.path === "/import" &&
                !["admin", "editor"].includes(user?.role || "")
              )
                return;
              currentGroup.push(item);
            }
          });

          if (currentGroup.length > 0) groups.push(currentGroup);

          return groups.map((group, groupIndex) => {
            if (group === null) return <Divider key={`divider-${groupIndex}`} />;

            return (
              <List key={`list-${groupIndex}`}>
                {group.map((item, index) => (
                  <ListItem
                    key={index}
                    disablePadding
                    sx={{ display: "block" }}
                    onClick={() => {
                      if (!item) return;
                      router.push(item?.path);
                    }}
                  >
                    <ListItemButton
                      sx={[
                        { minHeight: 48, px: 2.5 },
                        open ? { justifyContent: "initial" } : { justifyContent: "center" },
                      ]}
                    >
                      <ListItemIcon
                        sx={[
                          { minWidth: 0, justifyContent: "center" },
                          open ? { mr: 3 } : { mr: "auto" },
                        ]}
                      >
                        {item?.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item?.text}
                        sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            );
          });
        })()}
      </Drawer>

      {/* Main content */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          flexDirection: "column",
        }}
      >
        <div className={cn("flex-1 relative pt-14 sm:pt-16 flex flex-col overflow-hidden")}>
          {links && (
            <Links>
              {links.map((link, i) => (
                <Typography
                  key={i}
                  sx={{
                    color: i == links.length - 1 ? "text.primary" : "inherit",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {link}
                </Typography>
              ))}
            </Links>
          )}

          <div
            className={cn(
              "flex-1 relative min-h-0 pb-14 md:pb-0",
              className,
            )}
          >
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <Paper elevation={3} sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: theme.zIndex.appBar }}>
            <BottomNavigation
              value={bottomNavValue !== -1 ? bottomNavValue : false}
              onChange={(_, newValue) => {
                const item = bottomNavItems[newValue];
                if (item) router.push(item.path);
              }}
              showLabels={false}
              sx={{ height: 56 }}
            >
              {bottomNavItems.map((item, index) => (
                <BottomNavigationAction
                  key={index}
                  icon={item.icon}
                  sx={{ minWidth: 0, px: 0.5 }}
                />
              ))}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default View;
