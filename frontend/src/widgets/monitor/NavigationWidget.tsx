import MonitorItems from "@/features/monitor/MonitorItems";
import PublicLayers from "@/features/monitor/PublicLayers";
import { Divider, Typography } from "@mui/material";

function NavigationWidget() {
    return (
        <div className="flex flex-col h-full">

            <div className="pl-3 pt-3">
                <Typography variant="overline" gutterBottom sx={{ display: 'block' }} fontWeight={500} className="text-neutral-500">
                    Публичные слои
                </Typography>

                <PublicLayers />
            </div>

            <Divider orientation="horizontal" />

            <div className="pt-3 flex flex-col min-h-0">
                <Typography variant="overline" gutterBottom sx={{ display: 'block' }} fontWeight={500} className="text-neutral-500 pl-3">
                    Список бассейнов
                </Typography>

                <div className="flex-1 min-h-0 overflow-y-scroll">
                    <MonitorItems />
                </div>
            </div>
        </div>
    );
}

export default NavigationWidget;