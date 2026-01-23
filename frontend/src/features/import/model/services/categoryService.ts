import { useCategories } from "@/entities/category/model/useCategories";
import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { ApiResponse, Category } from "@/types";
import { toast } from "react-toastify";

const fetchCategories = async () => {

    const { token } = useAuth.getState();
    const { setCategories, setLoading } = useCategories.getState();

    await api.get<ApiResponse<Category[]>>('/data/category', {
        headers: { Authorization: 'Bearer ' + token }
    })
        .then(({ data }) => {
            setCategories(data.data);
        }).finally(() => {
            setLoading(false);
        });
}

const handleCreateCategory = async (
    fetching: boolean,
    setFetching: (fetching: boolean) => void,

    name: string,
    description: string,

    setName: (name: string) => void,
    setDescription: (description: string) => void,

    setOpen: (open: boolean) => void
) => {

    const { token } = useAuth.getState();
    const { categories, setCategories } = useCategories.getState();

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

    await api.post<ApiResponse<Category>>('/data/category', body,
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

            const newCategories = categories;
            newCategories.push(data.data);
            setCategories(newCategories);

            setOpen(false);
            setFetching(false);

            setName('');
            setDescription('');
        });
}

export {
    fetchCategories,
    handleCreateCategory
}