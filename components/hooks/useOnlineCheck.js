import { useState,useEffect } from "react";

const useOnlineCheck = () => {
  const [isOnline, setIsOnline] = useState(typeof window !== undefined ? navigator.onLine : true);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline); 

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    }
  },[]);

  return isOnline;
};

export default useOnlineCheck;
