import { ProjectionsType } from "./useSettings";

export const PROJECTIONS: {
    value: ProjectionsType;
    label: string;
    description: string;
    image: string;
}[] = [
        {
            value: "globe",
            label: "Глобус",
            description: "Сферическое отображение Земли без проекционных искажений",
            image: "/images/projections/globe.png",
        },
        {
            value: "mercator",
            label: "Меркатор",
            description: "Навигационная проекция, искажает размеры у полюсов",
            image: "/images/projections/mercator.png",
        },
        {
            value: "equalEarth",
            label: "Equal Earth",
            description: "Сохраняет площади континентов",
            image: "/images/projections/equal-earth.png",
        },
        {
            value: "naturalEarth",
            label: "Natural Earth",
            description: "Компромиссная проекция для тематических карт",
            image: "/images/projections/natural-earth.png",
        },
        {
            value: "winkelTripel",
            label: "Winkel Tripel",
            description: "Минимизирует искажения формы и расстояний",
            image: "/images/projections/winkel-tripel.png",
        },
        {
            value: "equirectangular",
            label: "Equirectangular",
            description: "Простая прямоугольная сетка широт и долгот",
            image: "/images/projections/equirectangular.png",
        },
        {
            value: "albers",
            label: "Albers",
            description: "Коническая проекция, хороша для средних широт",
            image: "/images/projections/albers.png",
        },
        {
            value: "lambertConformalConic",
            label: "Lambert Conformal Conic",
            description: "Коническая проекция с сохранением углов",
            image: "/images/projections/lambert-conformal-conic.png",
        },
    ];