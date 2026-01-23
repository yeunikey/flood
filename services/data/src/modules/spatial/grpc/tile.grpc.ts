import { Observable } from 'rxjs';

export interface Tile {
  id: string;
  name?: string;
}

export interface TilesGrpcService {
  findMany(data: { ids: string[] }): Observable<{ tiles: Tile[] }>;
}
