import { Category } from "@/entities/category/types/categories";
import Site from "@/entities/site/types/site";

interface Layer {
    category: Category,
    sites: Site[]
}

export default Layer;