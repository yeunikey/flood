import { ListItemButton, ListItemText, Typography } from "@mui/material";
import { useCategorySelection } from "../model/useCategorySelection";
import { Category } from "@/entities/category/types/categories";

interface CategoryProps {
  category: Category;
  i: number;
}

function CategoryItem({ category }: CategoryProps) {
  const { selectedCategory, setSelectedCategory } = useCategorySelection();

  return (
    <ListItemButton
      onClick={() => setSelectedCategory(category)}
      sx={{
        backgroundColor: selectedCategory?.id == category.id ? "#f3f4f6" : "",
      }}
    >
      <ListItemText
        primary={<Typography fontWeight={500}>{category.name}</Typography>}
        secondary={
          <Typography
            fontSize={14}
            color="textSecondary"
            className="line-clamp-2"
          >
            {category.description}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

export default CategoryItem;
