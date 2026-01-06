import AddIcon from '@mui/icons-material/Add';
import { Button, Card, CardActionArea, CardContent, Chip, Divider, Typography } from '@mui/material';
import CreatePoolModal from './modal/CreatePoolModal';
import { usePoolStore } from './model/usePoolStore';
import { usePools } from '@/entities/pool/model/usePools';
import UpdatePoolModal from './modal/UpdatePoolModal';
import Pool from '@/entities/pool/types/pool';

function PoolsWidget() {

    const { pools } = usePools();
    const {
        setUpdatePoolModal,
        setCreatePoolModal,
        setEditingPool
    } = usePoolStore();

    return (
        <div className="test">

            <CreatePoolModal />
            <UpdatePoolModal />

            <Button
                variant="outlined"
                startIcon={<AddIcon />}
                disableElevation

                onClick={() => setCreatePoolModal(true)}
            >
                Создать бассейн
            </Button>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
                {pools.sort((a: Pool, b: Pool) => a.id - b.id).map(pool => (
                    <Card key={pool.id} variant="outlined" className='cursor-pointer rounded-2xl!'>
                        <CardActionArea onClick={() => {
                            setEditingPool(pool)
                            setUpdatePoolModal(true);
                        }} className='h-full'>
                            <CardContent className='h-full flex flex-col justify-between'>
                                <div className="flex flex-col gap-2">
                                    <Typography variant="h6">
                                        {pool.name}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        ID: {pool.id}
                                    </Typography>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Divider orientation='horizontal' />

                                    <Chip label={`${pool.sites.length} точек`} className='w-fit' />
                                </div>

                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </div>

            {pools.length === 0 && (
                <Typography color="text.secondary" className='mt-6!'>
                    Бассейны не найдены
                </Typography>
            )}
        </div>
    );
}

export default PoolsWidget;