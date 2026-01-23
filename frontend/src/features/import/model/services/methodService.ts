import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { ApiResponse } from "@/types";
import { toast } from "react-toastify";
import { useImportStore } from "../useImportStore";
import { useMethodModal } from "../modal/useMethodModal";
import { useMethods } from "@/entities/method/model/useMethod";
import MethodType from "@/entities/method/types/method_type";

const fetchMethods = async () => {

    const { token } = useAuth.getState();
    const { setMethods, setLoading } = useMethods.getState();

    await api.get<ApiResponse<MethodType[]>>("/metadata/methods", {
        headers: { Authorization: "Bearer " + token },
    })
        .then(({ data }) => {
            setMethods(data.data)
        })
        .finally(() => {
            setLoading(false);
        });
}

const handleCreateMethod = async (
    fetching: boolean,
    setFetching: (fetching: boolean) => void,

    name: string,
    description: string,
) => {

    const { token } = useAuth.getState();
    const { methods, setMethods } = useMethods.getState();
    const { setSelectedMethod } = useImportStore.getState();

    const { setOpen } = useMethodModal.getState();

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

    await api.post<ApiResponse<MethodType>>('/metadata/methods', body,
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

            const newMethods = methods;
            newMethods.push(data.data);
            setMethods(newMethods);

            setSelectedMethod(data.data);

            setOpen(false);
        });
}

export {
    handleCreateMethod,
    fetchMethods
}