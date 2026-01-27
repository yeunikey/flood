import { DataValue } from "@/types";

export interface GroupedData {
  group: {
    id: number;
    date_utc: string;
    category: { id: number; name: string };
    site: { id: number; code: string; name: string };
  };
  values: DataValue[];
}

export interface PaginatedResult<T> {
  content: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  minDate: Date;
  maxDate: Date;
}
