import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom'

function Room() {

    const navigate = useNavigate();

  // Check authentication status on initial load
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/status`);
      if (response.data.user) {
        alert(`auth success, username: ${JSON.parse(response.data.user).name}`);
      }else{
        navigate('/', {replace:true})
      }
    } catch (error) {
      // alert("Auth check failed:", error);
      console.log(error)
      navigate('/', {replace:true})
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [navigate]);

  return (
    <>
      <div>Hello hi</div>
    </>
  );
}

export default Room;
