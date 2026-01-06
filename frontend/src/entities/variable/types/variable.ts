import Unit from "@/entities/unit/types/unit";

interface Variable {
    id: number;
    name: string;
    unit: Unit;
    description: string;
}

export default Variable;