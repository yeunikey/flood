import LayersIcon from "@mui/icons-material/Layers";
import AddToQueueIcon from "@mui/icons-material/AddToQueue";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import TimelineIcon from "@mui/icons-material/Timeline";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DescriptionIcon from "@mui/icons-material/Description";

const ways = [
  {
    text: "Мониторинг",
    icon: <LayersIcon />,
    path: "/",
  },
  {
    text: "Аналитика",
    icon: <QueryStatsIcon />,
    path: "/analytic",
  },
  {
    text: "Прогнозы и сценарии",
    icon: <TimelineIcon />,
    path: "/visual",
  },
  {
    text: (
      <>
        Работа с пространственными <br />
        данными
      </>
    ),
    icon: <TravelExploreIcon />,
    path: "/spatial",
  },
  null,
  {
    text: "Статистика",
    icon: <AssessmentIcon />,
    path: "/statistics",
  },
  {
    text: "Документация",
    icon: <DescriptionIcon />,
    path: "/docs",
  },
  null,
  {
    text: "Импорт данных",
    icon: <AddToQueueIcon />,
    path: "/import",
  },
  {
    text: "Парсер гидропостов",
    icon: <CloudDownloadIcon />,
    path: "/parser",
  },
  null,
  {
    text: "Администрирование",
    icon: <SupervisorAccountIcon />,
    path: "/admin",
  },
];

export { ways };
