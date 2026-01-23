import Metadata from "@/widgets/import/metadata/Metadata";
import SelectCsv from "@/widgets/import/select_csv/SelectCsv";
import TableCsv from "@/widgets/import/table_csv/TableCsv";

const stepperPages = [
    <SelectCsv key="select-csv" />,
    <TableCsv key="table-csv" />,
    <Metadata key="metadata" />
];

export {
    stepperPages
}