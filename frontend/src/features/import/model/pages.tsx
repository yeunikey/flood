import Metadata from "@/widgets/import/table/metadata/Metadata";
import SelectCsv from "@/widgets/import/table/select_csv/SelectCsv";
import TableCsv from "@/widgets/import/table/table_csv/TableCsv";

const stepperPages = [
    <SelectCsv key="select-csv" />,
    <TableCsv key="table-csv" />,
    <Metadata key="metadata" />
];

export {
    stepperPages
}