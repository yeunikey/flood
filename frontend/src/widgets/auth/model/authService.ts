import { useAuth } from "./useAuth";
import { toast } from "react-toastify";
import { api } from "@/shared/model/api/instance";
import { ApiResponse, AuthResponse, User } from "@/types";
import Cookies from "js-cookie";

const handleLogin = async () => {
  const { login: login, password } = useAuth.getState();

  if (login == "" || password == "") {
    toast.error("Заполните все данные");
    return;
  }

  await api
    .post<ApiResponse<{ token: string; user: User }>>("auth/login", {
      login: login,
      password: password,
    })
    .then((response) => {
      if (response.data.statusCode == 400) {
        toast.error(response.data.message);
        return;
      }

      Cookies.set("token", response.data.data.token);

      window.location.href = "/";
    });
};

const handleCreate = async () => {
  const { login, password } = useAuth.getState();

  if (login == "" || password == "") {
    toast.error("Заполните все поля");
    return;
  }

  await api
    .post<ApiResponse<AuthResponse>>("auth/register", {
      login: login,
      password: password,
    })
    .then((response) => {
      if (response.data.statusCode == 400) {
        toast.error(response.data.message);
        return;
      }

      Cookies.set("token", response.data.data.token);

      window.location.href = "/";

      toast.success("Успешное создание!");
    });
};

// const handleCode = async (code: string) => {
//   const { email } = useAuth.getState();

//   if (code == "") {
//     toast.error("Введите код");
//     return;
//   }

//   const body = {
//     email: email,
//     code: code,
//   };

//   await api
//     .post<ApiResponse<AuthResponse>>("/auth/confirm", body)
//     .then((response) => {
//       if (response.data.statusCode == 400) {
//         toast.error(response.data.message);
//         return;
//       }

//       Cookies.set("token", response.data.data.token);

//       window.location.href = "/";

//       toast.success("Успешное создание!");
//     });
// };

export { handleLogin, handleCreate };
