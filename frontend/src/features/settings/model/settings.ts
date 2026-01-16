import { api, vapi } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";
import { authHeader } from "@/shared/model/utils";
import { ApiResponse, SavedImage, User } from "@/types";
import { toast } from "react-toastify";

const changePassword = async (
    oldPassword: string,
    newPassword: string,
    repeatPassword: string,
) => {

    const { token } = useAuth.getState();

    if (oldPassword == ""
        || newPassword == ""
        || repeatPassword == "") {
        toast.error("Заполните все поля")
        return;
    }

    if (newPassword != repeatPassword) {
        toast.error("Пароли не совпадают")
        return;
    }

    const body = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        repeatPassword: repeatPassword
    }

    await api.post('auth/change-password', body, authHeader(token ?? ''))
        .then((response) => {

            if (response.data.statusCode == 400) {
                toast.error(response.data.message)
                return;
            }

            toast.success("Успешно сохранено!")
        })
}

const changeImage = async (
    file: File | null,
    setFetching: (fetching: boolean) => void
) => {

    const { token, setUser } = useAuth.getState();

    if (file == null) {
        toast.warning("Пожалуйста, выберите изображение");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        setFetching(true);

        const imageRes = await vapi.post<ApiResponse<SavedImage>>(
            "data/images/upload",
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            }
        );

        if (imageRes.data.statusCode === 400) {
            toast.success(imageRes.data.message);
            return;
        }

        const updateRes = await api.post<ApiResponse<User>>(
            "auth/users/update",
            {
                "image": imageRes.data.data.id
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            }
        );

        setUser(updateRes.data.data);
        toast.success("Аватар успешно обновлён!");

    } catch {
        toast.success("Ошибка при загрузке изображения");
    } finally {
        setFetching(false);
    }
};

export {
    changeImage,
    changePassword
}