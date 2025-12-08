"use client";

import { customNotification } from "@/utils/notification";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useZustandStore } from "./useZustandStore";

interface SocketContextProps {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  connected: false,
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const [connected, setConnected] = useState(false);

  const { detailUser } = useZustandStore();

  console.log("CONNECTED SOCKET", connected);

  useEffect(() => {
    if (detailUser) {
      const socketIo = io(process.env.NEXT_PUBLIC_CORS_BE);
      setSocket(socketIo);

      socketIo.on("connect", () => {
        setConnected(true);
        socketIo.emit("add_user", detailUser?.code);
      });

      socketIo.on("disconnect", () => {
        socketIo.emit("remove_user", detailUser?.code);
        setConnected(false);
      });

      return () => {
        socketIo.disconnect();
      };
    }
  }, [detailUser]);

  useEffect(() => {
    if (socket) {
      socket.on("NotifikasiGlobal", (data: { message: string }) => {
        customNotification({ type: "Notifikasi", text: data.message });
      });
    }

    return () => {
      if (socket) {
        socket.off("NotifikasiGlobal");
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
