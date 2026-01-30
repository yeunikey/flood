import { Divider } from "@mui/material";
import CategoryList from "@/widgets/import/table/categories_list/CategoryList";
import { useImportStore } from "@/features/import/model/useImportStore";
import CreateVariableModal from "@/features/import/ui/modal/CreateVariableModal";
import ProgressModal from "@/features/import/ui/modal/ProgressModal";
import { stepperPages } from "@/features/import/model/pages";

export default function TableWidget() {
  const { stepperLevel } = useImportStore();

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <CreateVariableModal />
      <ProgressModal />

      <div className="py-6 w-96 flex-shrink-0">
        <CategoryList />
      </div>

      <Divider orientation="vertical" flexItem />

      <div className="flex-1 overflow-y-auto overflow-x-auto min-w-0 relative">
        {stepperPages[stepperLevel]}
      </div>
    </div>
  );
}
