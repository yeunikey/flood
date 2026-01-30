import {
    Typography,
    Button,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import { usePools } from "@/entities/pool/model/usePools";
import Pool from "@/entities/pool/types/pool";

import { usePoolStore } from "./model/usePoolStore";
import CreatePoolModal from "./modal/CreatePoolModal";
import UpdatePoolModal from "./modal/UpdatePoolModal";

function PoolsWidget() {
  const { pools } = usePools();
  const { setUpdatePoolModal, setCreatePoolModal, setEditingPool } =
    usePoolStore();

  const handleEdit = (pool: Pool) => {
    setEditingPool(pool);
    setUpdatePoolModal(true);
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4">
      <CreatePoolModal />
      <UpdatePoolModal />

      <div className="flex justify-between items-center">
        <Typography variant="h6" fontWeight="medium">
          Бассейны
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreatePoolModal(true)}
        >
          Создать
        </Button>
      </div>

      <TableContainer
        component={Paper}
        className="flex-1 overflow-auto shadow-sm rounded-lg! border border-gray-200"
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={50}>ID</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Количество точек</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pools
              ?.sort((a: Pool, b: Pool) => a.id - b.id)
              .map((pool) => (
                <TableRow key={pool.id} hover>
                  <TableCell>{pool.id}</TableCell>
                  <TableCell className="font-medium">{pool.name}</TableCell>
                  <TableCell>
                    {pool.sites?.length ? (
                      <Chip label={pool.sites.length} size="small" />
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex justify-end gap-1">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(pool)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

            {(!pools || pools.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  className="py-8 text-gray-500"
                >
                  Бассейны не найдены. Создайте новый бассейн.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default PoolsWidget;
