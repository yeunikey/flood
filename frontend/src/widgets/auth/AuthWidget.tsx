import { Grow, Typography, TextField, Button, Divider } from "@mui/material";
import { handleCreate, handleLogin } from "./model/authService";
import { useAuth } from "./model/useAuth";

function AuthWidget() {
  const {
    type,
    password,
    setPassword,
    login: email,
    setLogin: setEmail,
  } = useAuth();

  return (
    <Grow in={true}>
      <div className="w-full max-w-sm sm:max-w-lg min-h-[auto] bg-white rounded-3xl sm:rounded-4xl flex justify-center items-center py-10 mx-4 sm:mx-0">
        <div className="w-full px-8 sm:w-80 sm:px-0">
          <Typography variant="h5" textAlign={"center"} fontWeight={500}>
            ГИС-сервис
          </Typography>
          <Typography
            variant="body1"
            color="grey.500"
            marginTop={1}
            textAlign={"center"}
          >
            Заполните поля ниже для того, <br />
            чтобы войти в систему
          </Typography>

          <div className="flex flex-col gap-2 my-12">
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="outlined-basic"
              label="Логин"
              variant="outlined"
              size="medium"
              placeholder="user"
              className="text-sm"
            />
            <TextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="outlined-basic"
              label="Пароль"
              variant="outlined"
              type="password"
              size="small"
              placeholder="••••••••"
              className="text-sm"
            />
          </div>

          <Button
            variant="contained"
            className="w-full"
            disableElevation
            onClick={() => {
              if (type == "LOGIN") {
                handleLogin();
              } else {
                handleCreate();
              }
            }}
          >
            {type == "LOGIN" ? "Войти" : "Зарегистрироваться"}
          </Button>

          <Divider className="py-4">
            <Typography variant="body1" color="textDisabled">
              или
            </Typography>
          </Divider>

          <Button
            variant="text"
            className="w-full !text-gray-500"
            href="https://forms.gle/Maz1gkPVFvcFRpkb8"
            target="_blank"
          >
            Получить доступ
          </Button>
        </div>
      </div>
    </Grow>
  );
}

export default AuthWidget;
