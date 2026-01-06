import { useAuth } from "./useAuth";
import { toast } from "react-toastify";
import { api } from "@/shared/model/api/instance";
import { ApiResponse, AuthResponse, User } from "@/types";
import Cookies from 'js-cookie';

const handleLogin = async () => {

    const { email, password } = useAuth.getState();

    if (email == "" || password == "") {
        toast.error("Заполните все данные")
        return;
    }

    await api.post<ApiResponse<{ token: string, user: User }>>('/auth/login', {
        email: email,
        password: password
    })
        .then((response) => {

            if (response.data.statusCode == 400) {
                toast.error(response.data.message)
                return;
            }

            Cookies.set('token', response.data.data.token);

            window.location.href = "/"
        })
}

const handleCreate = async () => {

    const { email, password, setModal } = useAuth.getState();

    if (email == "" || password == "") {
        toast.error("Заполните все поля")
        return;
    }

    setModal(true);

    await api.post<ApiResponse<null>>('/auth/register', {
        user: {
            email: email,
            password: password,
        }
    }).then((response) => {

        if (response.data.statusCode == 200) {
            toast.warning("Вам на почту был отправлен код")

        } else {
            toast.error(response.data.message);
        }

    })
}

const handleCode = async (
    code: string,
) => {

    const { email } = useAuth.getState();

    if (code == '') {
        toast.error('Введите код')
        return;
    }

    const body = {
        email: email,
        code: code
    }

    await api.post<ApiResponse<AuthResponse>>('/auth/confirm', body)
        .then((response) => {

            if (response.data.statusCode == 400) {
                toast.error(response.data.message)
                return;
            }

            Cookies.set('token', response.data.data.token);

            window.location.href = "/"

            toast.success("Успешное создание!")
        })

}

export {
    handleLogin,
    handleCreate,
    handleCode
}