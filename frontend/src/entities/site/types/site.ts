import Pool from "@/entities/pool/types/pool";
import SiteType from "./site_type";

interface Site {
    id: number;
    code: string;
    name: string;
    siteType: SiteType;
    longtitude: number;
    latitude: number;
    pool?: Pool;
}

export default Site;