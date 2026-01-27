import { Collapse, Divider, IconButton, Tab, Tabs, Tooltip } from "@mui/material";
import { useMonitorStore } from "./model/useMontorStore";
import CloseIcon from '@mui/icons-material/Close';
import { useState } from "react";
import TableRowsIcon from '@mui/icons-material/TableRows';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableInfo from "./info/TableInfo";

function SiteInfo() {

    const { selectedSite, setSelectedSite } = useMonitorStore();
    const [value, setValue] = useState(0);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Collapse
            in={selectedSite != null}
            orientation="vertical"
            timeout={300}
            unmountOnExit>
            <div className="relative h-96 bg-white flex flex-col z-10">

                <Divider orientation="horizontal" />

                <div className="absolute z-[100] top-3 right-3">
                    <Tooltip title="Закрыть">
                        <IconButton
                            sx={{
                                backgroundColor: 'white',
                                color: '#1976d2',
                                '&:hover': { backgroundColor: '#f0f0f0' },
                                boxShadow: 1,
                            }}
                            size="small"
                            onClick={() => setSelectedSite(null)}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </div>

                <div className="flex h-full flex-1 min-w-0 overflow-hidden">

                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={value}
                        onChange={handleChange}
                        sx={{ borderRight: 1, borderColor: 'divider', minWidth: '144px' }}
                        className="py-3"
                    >
                        <Tab label="Таблица" icon={<TableRowsIcon />} iconPosition="start" />
                        <Tab label="Чарты" icon={<BarChartIcon />} iconPosition="start" />
                    </Tabs>

                    <div className="flex-1 min-w-0 relative overflow-hidden flex flex-col p-4">
                        <TableInfo />
                    </div>
                </div>

            </div>
        </Collapse >
    );
}

export default SiteInfo;