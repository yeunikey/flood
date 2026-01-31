import LayersIcon from "@mui/icons-material/Layers";
import AddToQueueIcon from "@mui/icons-material/AddToQueue";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import TimelineIcon from "@mui/icons-material/Timeline";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";

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
    text: "Импорт данных",
    icon: <AddToQueueIcon />,
    path: "/import",
  },
  {
    text: "Администрирование",
    icon: <SupervisorAccountIcon />,
    path: "/admin",
  },
];

export { ways };
