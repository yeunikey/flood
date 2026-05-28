import Site from "@/entities/site/types/site";

export interface RemoteHydroSite {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  remoteDate: string | null;
  hasLevel: boolean;
  hasDischarge: boolean;
  currentValues: Record<string, string | null>;
}

export interface LoadedHydroRange {
  startDate: string;
  endDate: string;
  groupsCount: number;
}

export interface HydroParserSite {
  site: Site;
  remoteAvailable: boolean;
  remote: RemoteHydroSite | null;
  loaded: LoadedHydroRange | null;
}

export interface HydroImportResult {
  insertedGroups: number;
  insertedValues: number;
  startDate: string;
  endDate: string;
}

export interface HydroImportAllResult {
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  totalSites?: number;
  availableSites?: number;
  successfulSites?: number;
  failedSites?: number;
  insertedGroups?: number;
  insertedValues?: number;
  message?: string;
}
