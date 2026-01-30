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
      <div className="w-72">
        <Typography variant="h4" textAlign={"center"} fontWeight={500}>
          Паводки
        </Typography>
        <Typography
          variant="body1"
          color="grey.700"
          marginTop={1}
          textAlign={"center"}
        >
          Войдите в систему
        </Typography>

        <div className="flex flex-col gap-2 my-8">
          <TextField
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id="outlined-basic"
            label="Логин"
            variant="outlined"
            size="small"
          />
          <TextField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="outlined-basic"
            label="Пароль"
            variant="outlined"
            type="password"
            size="small"
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
    </Grow>
  );
}

export default AuthWidget;
