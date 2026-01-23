import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Zoom,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CategoryItem from "@/features/import/ui/CategoryItem";
import { useEffect } from "react";
import { useCategorySelection } from "@/features/import/model/useCategorySelection";
import CreateCategoryModal from "@/features/import/ui/modal/CreateCategoryModal";
import { useCategoryModal } from "@/features/import/model/modal/useCategoryModal";
import { fetchCategories } from "@/features/import/model/services/categoryService";
import { useCategories } from "@/entities/category/model/useCategories";

function CategoriesList() {
  const { categories } = useCategories();
  const { setSelectedCategory } = useCategorySelection();

  const { setOpen } = useCategoryModal();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length == 0) {
      return;
    }

    setSelectedCategory(categories[0]);
  }, [categories]);

  return (
    <>
      <CreateCategoryModal />

      <Typography
        variant="overline"
        gutterBottom
        sx={{ display: "block" }}
        fontWeight={500}
        className="text-neutral-500 pl-3"
      >
        Категории
      </Typography>

      {categories.map((category, i) => (
        <CategoryItem category={category} i={i} key={i} />
      ))}

      <Card elevation={0} className="flex justify-center">
        <CardActionArea onClick={() => setOpen(true)}>
          <CardContent
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyItems: "center",
            }}
          >
            <AddIcon fontSize="small" /> Создать
          </CardContent>
        </CardActionArea>
      </Card>
    </>
  );
}

export default CategoriesList;
