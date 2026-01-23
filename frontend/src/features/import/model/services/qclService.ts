import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { ApiResponse } from "@/types";
import { toast } from "react-toastify";
import { useImportStore } from "../useImportStore";
import { useQclModal } from "../modal/useQclModal";
import Qcl from "@/entities/qcl/types/qcl";
import { useQcl } from "@/entities/qcl/model/useQcl";
import { Category } from "@/entities/category/types/categories";

const fetchQcls = async () => {

    const { token } = useAuth.getState();
    const { setQcls, setLoading } = useQcl.getState();

    await api.get<ApiResponse<Qcl[]>>("/metadata/qcls", {
        headers: { Authorization: "Bearer " + token },
    })
        .then(({ data }) => {
            setQcls(data.data);
        })
        .finally(() => {
            setLoading(false);
        });
}

const handleCreateQcl = async (
    fetching: boolean,
    setFetching: (fetching: boolean) => void,

    name: string,
    description: string,
) => {

    const { token } = useAuth.getState();
    const { qcls, setQcls } = useQcl.getState();
    const { setSelectedQcl } = useImportStore.getState();
    const { setOpen } = useQclModal.getState();

    if (fetching) {
        toast.warning('Ожидайте ответа')
        return;
    }

    if (name == "" || description == '') {
        toast.error('Заполните все поля')
        return;
    }

    setFetching(true);

    const body = {
        name, description,
    };

    await api.post<ApiResponse<Category>>('/metadata/qcls', body,
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        .then(({ data }) => {

            if (data.statusCode != 200) {
                toast.error(data.message);
            }

            toast.success('Успешно создано!')

            const newQcls = qcls;
            newQcls.push(data.data);
            setQcls(newQcls);

            setSelectedQcl(data.data);

            setOpen(false);
        });
}

export {
    handleCreateQcl,
    fetchQcls
}