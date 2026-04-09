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
      <div className="flex min-h-[auto] w-full max-w-sm justify-center rounded-3xl bg-white px-4 py-8 shadow-lg sm:max-w-lg sm:rounded-4xl sm:px-8 sm:py-10">
        <div className="w-full sm:w-80">
          <Typography
            variant="h5"
            textAlign={"center"}
            fontWeight={500}
            sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" } }}
          >
            ГИС-сервис
          </Typography>
          <Typography
            variant="body1"
            color="grey.500"
            marginTop={1}
            textAlign={"center"}
            sx={{ fontSize: { xs: "0.95rem", sm: "1rem" } }}
          >
            Заполните поля ниже для того, <br />
            чтобы войти в систему
          </Typography>

          <div className="my-8 flex flex-col gap-3 sm:my-12">
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
              size="medium"
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
