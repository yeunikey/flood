import { Divider } from "@mui/material";
import CategoryList from "@/widgets/import/categories_list/CategoryList";
import { useImportStore } from "@/features/import/model/useImportStore";
import CreateVariableModal from "@/features/import/ui/modal/CreateVariableModal";
import ProgressModal from "@/features/import/ui/modal/ProgressModal";
import { stepperPages } from "@/features/import/model/pages";

export default function TableWidget() {
  const { stepperLevel } = useImportStore();

  return (
    <div className="flex h-full w-full">
      <CreateVariableModal />
      <ProgressModal />

      <div className="py-6 w-96">
        <CategoryList />
      </div>

      <Divider orientation="vertical" />

      <div className="overflow-y-scroll w-full">
        {stepperPages[stepperLevel]}
      </div>
    </div>
  );
}
