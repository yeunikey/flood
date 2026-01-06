import { create } from 'zustand';
import { STYLES } from './styles';

export type ProjectionsType = "albers" | "equalEarth" | "equirectangular" | "lambertConformalConic" | "mercator" | "naturalEarth" | "winkelTripel" | "globe";
export type StylesType = {
    image: string;
    link: string;
    label: string
}

type Store = {
    openSettings: boolean;
    setOpenSettings: (openSettings: boolean) => void;

    projection: ProjectionsType;
    setProjection: (projection: ProjectionsType) => void;

    style: StylesType;
    setStyle: (projection: StylesType) => void;
};

export const useSettings = create<Store>((set) => ({
    openSettings: false,
    setOpenSettings: (createPoolModal: boolean) => set({
        openSettings: createPoolModal
    }),

    projection: "globe",
    setProjection: (projection: ProjectionsType) => set({
        projection
    }),

    style: STYLES[0],
    setStyle: (style: StylesType) => set({
        style
    })
}));

