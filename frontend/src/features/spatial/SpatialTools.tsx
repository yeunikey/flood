import { MapLegend } from "./tools/SpatialLegend";
import { SpatialSettings } from "./tools/SpatialSettings";

function SpatialTools() {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-0">
      <MapLegend />
      <SpatialSettings />
    </div>
  );
}

export default SpatialTools;
