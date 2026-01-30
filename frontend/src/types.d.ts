// requests
interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
}

// auth
interface User {
  id: number;
  email: string;
  image?: string;
  role: "admin" | "viewer" | "editor";
}

interface AuthResponse {
  token: string;
  user: User;
}

// files & images
export class SavedImage {
  id: string;
  filename: string;
}

export class SavedFile {
  id: string;
  filename: string;
}

// layer
export class Layer {
  id: number;
  name: string;
  file: string;
}

// cuahsi
export class Catalog {
  id: number;
}

export class Category {
  id: number;
  name: string;
  description: string;
}

export class DataSource {
  id: number;
  name: string;
}

export class DataValue {
  id: number;
  value: string;
  variable: Variable;
}

export class MethodType {
  id: number;
  name: string;
  description: string;
}

export class Qcl {
  id: number;
  name: string;
  description: string;
}

export class SiteType {
  id: number;
  name: string;
  description: string;
}

export class Site {
  id: number;
  code: string;
  name: string;
  siteType: SiteType;
  longtitude: number;
  latitude: number;
}

export class Unit {
  id: number;
  name: string;
  symbol: string;
  description: string;
}

export class Variable {
  id: number;
  name: string;
  unit: Unit;
  description: string;
}

export class Group {
  id: number;

  category: Category;
  date_utc: Date;
  qcl: Qcl;
  group: Group;

  site: Site;
  method: MethodType;
  source: DataSource;
}

export interface GroupResponse {
  group: Group;
  content: DataValue[];
}

export interface GroupPaginated {
  content: GroupResponse[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

interface GroupedData {
  group: Group;
  values: DataValue[];
}

interface Tile {
  id: string;
  name: string;
  geoPath: string;
  mbtilesPath: string;
  type: "geojson" | "geotiff";
  colorMode: "solid" | "gradient";
  selectedVariable: string;
  solidColor: string;
  gradientColorA: string;
  gradientColorB: string;
}

export {
  User,
  AuthResponse,
  ApiResponse,
  Site,
  SiteType,
  SavedImage,
  SavedFile,
  Layer,
  Catalog,
  Category,
  Variable,
  DataValue,
  Group,
  GroupResponse,
  GroupPaginated,
  GroupedData,
  Tile,
};
