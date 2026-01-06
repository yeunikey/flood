'use client'

import { fetchPools } from "@/entities/pool/api/fetchPools";
import { fetchTiles } from "@/entities/tiles/api/fetchTiles";
import { useAuth } from "@/shared/model/auth";
import View from "@/shared/ui/View";
import ViewWidget from "@/widgets/spatial/ViewWidget";
import { Divider, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";

function SpatialPage() {

    const [currentPage, setPage] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setPage(newValue);
    };

    const { token } = useAuth();

    useEffect(() => {
        if (!token) return;

        fetchPools(token);
        fetchTiles(token);

    }, [token])

    return (
        <View
            links={['Паводки', 'Работа с пространственными данными']}
        >
            <div className="flex flex-col h-full">

                <div className="py-2 pb-0 px-3">
                    <Tabs value={currentPage} onChange={handleChange}>
                        <Tab label="Экспорт из базы" />
                        <Tab label="Импорт данных" />
                    </Tabs>
                </div>

                <Divider orientation="horizontal" />

                <div className="flex-1 min-h-0 relative">
                    {currentPage == 0 && (
                        <ViewWidget />
                    )}
                </div>
            </div>

        </View>
    );
}

export default SpatialPage;