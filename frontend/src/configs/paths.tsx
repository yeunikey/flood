import LayersIcon from '@mui/icons-material/Layers';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import GestureIcon from '@mui/icons-material/Gesture';
import AddToQueueIcon from '@mui/icons-material/AddToQueue';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

const ways = [
    {
        text: "Мониторинг",
        icon: <LayersIcon />,
        path: '/'
    },
    {
        text: "Аналитика",
        icon: <QueryStatsIcon />,
        path: '/analytic'
    },
    {
        text: "Прогнозы и сценарии",
        icon: <GestureIcon />,
        path: '/visual'
    },
    {
        text: <>Работа с пространственными <br />данными</>,
        icon: <ViewInArIcon />,
        path: '/spatial'
    },
    null,
    {
        text: 'Импорт данных',
        icon: <AddToQueueIcon />,
        path: '/import'
    },
    {
        text: "Администрирование",
        icon: <SupervisorAccountIcon />,
        path: '/admin'
    },
]

export {
    ways
}