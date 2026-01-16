"use client";

import { ApiResponse, User } from "@/types";
import { ReactNode, useEffect, useState } from "react";

import Cookies from "js-cookie";
import Loading from "./el/Loading";
import { api } from "@/shared/model/api/instance";
import { useAuth } from "@/shared/model/auth";

interface AuthProps {
  children?: ReactNode;
}

function Authorize({ children }: AuthProps) {
  const { setToken, setUser } = useAuth();

  const [isLoading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!Cookies.get("token")) {
      setTimeout(() => {
        setLoading(false);
      }, 500);
      return;
    }

    const token = String(Cookies.get("token"));

    await api
      .get<ApiResponse<User>>("auth/profile", {
        headers: {
          Authorization: "Bearer " + token,
        },
      })
      .then((response) => {
        if (response.data.statusCode == 400) {
          setLoading(false);
          Cookies.remove("token");
          return;
        }

        setToken(token);
        setUser(response.data.data);

        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-dvh flex items-center justify-center">
        <Loading></Loading>
      </div>
    );
  }

  return <>{children}</>;
}

export default Authorize;
