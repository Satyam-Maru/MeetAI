import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Room() {
  // const navigate = useNavigate();

  // const url =
  //   import.meta.env.VITE_PLATFORM == "dev"
  //     ? import.meta.env.VITE_LOCALHOST_URL
  //     : import.meta.env.VITE_BACKEND_URL;
  // // Check authentication status on initial load
  // const checkAuthStatus = async () => {
  //   try {
  //     const response = await axios.get(`${url}/api/auth/status`, {
  //       withCredentials: true,
  //     });
  //     if (response.data.user) {
  //       alert(`auth success, username: ${JSON.parse(response.data.user).name}`);
  //     } else {
  //       navigate("/", { replace: true });
  //     }
  //   } catch (error) {
  //     // alert("Auth check failed:", error);
  //     console.log(error);
  //     navigate("/", { replace: true });
  //   }
  // };

  // useEffect(() => {
  //   checkAuthStatus();
  // }, [navigate]);

  // const fetchUser = async () => {
  //   try {
  //     const res = await axios.get(`${url}/api/auth/profile`, {
  //       withCredentials: true,
  //     });
  //     setUser(res.data.user);
  //   } catch {
  //     setUser(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchUser();
  // }, []);

  return (
    <>
      <div>Hello hi</div>
    </>
  );
}

export default Room;
