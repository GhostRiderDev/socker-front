/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("https://rindoor-backend.onrender.com", {
  autoConnect: false,
});

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const userFromInitialState =
    window.location.port === "5173"
      ? {
          id: "a5da798b-b58b-46cc-af42-927e2d009782",
          isActive: true,
          banned: false,
          name: "carlos Morillo",
          email: "liamssssa@gmail.com",
          phone: "4023215432",
          country: "Argentina",
          province: "Buenos Aires",
          city: "Mercedes",
          address: "Calle 33 626",
          coords: "-34.6496203,-59.43386160000001",
          rating: 5,
          role: "PROFESSIONAL",
        }
      : {
          id: "21e64323-0cc9-447c-bf87-cf33b0b963c9",
          isActive: true,
          banned: false,
          name: "liam Morillo",
          email: "carlos.jmr90@gmail.com",
          phone: "4023215432",
          country: "Argentina",
          province: "Buenos Aires",
          city: "Mercedes",
          address: "Calle 33 626",
          coords: "-34.6496203,-59.43386160000001",
          rating: 5,
          role: "CLIENT",
        };

  const [userFrom, setUserFrom] = useState<any>(userFromInitialState);

  const [userTo, setUserTo] = useState<any>(null);

  useEffect(() => {
    socket.on("connect", () => {
      socket.emit("start", {
        userFrom: userFrom.id,
      });
      setIsConnected(true);
    });

    socket.on(`contacts_${userFrom.id}`, (e) => {
      setContacts(e);
      setUserTo(e[0]);
    });

    socket.connect();
  }, []);

  useEffect(() => {
    if (userTo) {
      socket.emit("joinRoom", {
        userFrom: userFrom.id,
        userTo: userTo.id,
      });

      // quiero un evento general para todos los mensajes
      let messageEvent;
      if (userTo.id > userFrom.id)
        messageEvent = `chat_${userFrom.id}_${userTo.id}`;
      else messageEvent = `chat_${userTo.id}_${userFrom.id}`;

      socket.on(messageEvent, (e) => {
        console.log("********LLEGO MENSAJE********");
        setMessages((messages) => [...messages, e]);
      });

      socket.on("roomMessages", (e) => {
        console.log("*******MENSAJES DE LA SALA*********", e);
        setMessages(e);
      });
      // Aquí es donde te desuscribes de los eventos
      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off(messageEvent);
      };
    }
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
  }, [contacts, userFrom, userTo]);

  const sendMessage = (message: string) => {
    socket.emit("chat", {
      message,
      userFrom: userFrom.id,
      userTo: userTo.id,
    });
  };

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const submit = (e) => {
    e.preventDefault();
    const value = textAreaRef?.current?.value;
    if (value) {
      sendMessage(value);
      textAreaRef.current.value = "";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      submit(e);
    }
  };

  console.log("******MESSAGES********+", messages);

  const converToTime = (dateToConver: string) => {
    const date = new Date(dateToConver);
    const timeString = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    return timeString;
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const messagesByDate = sortedMessages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateKey = date.toISOString().split("T")[0]; // Obtiene la fecha sin la hora
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  return (
    <div className="flex items-center">
      <div className="h-[90vh] bg-slate-400 w-1/4 rounded-md mx-2">
        <h1 className="text-lg m-2 flex items-center space-x-2 text-white font-semibold">
          <span
            className={`${
              isConnected ? "bg-green-800" : "bg-red-800"
            } w-4 h-4 rounded-full inline-block`}
          ></span>
          <p>{userFrom.name}</p>
        </h1>
        <div className="bg-slate-700 p-2 rounded-md mx-2">
          <ul className="space-y-2">
            {contacts.map((user, index) => (
              <li
                key={index}
                className="text-white p-2 rounded-md bg-slate-600"
                onClick={() => setUserTo(user)}
              >
                <p>{user.name}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-1/2 h-screen  relative">
        <div className="h-5/6 overflow-y-auto mt-2 rounded-md bg-slate-700 p-2">
          {Object.entries(messagesByDate).map(([date, messages]) => (
            <div key={date}>
              <h2 className="text-white text-center mb-2">
                {date === new Date().toISOString().split("T")[0] ? "Hoy" : date}
              </h2>
              <ul className="space-y-2">
                {messages.map((message, index) => (
                  <li
                    key={index}
                    className={`text-white  text-wrap w-1/2 py-2 px-3 rounded-lg ${
                      message.from.id === userFrom.id
                        ? "ml-auto bg-sky-400"
                        : "bg-teal-400"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 text-opacity-80">
                      {message.from.name}
                    </p>
                    <p> {message.message}</p>
                    <p className="text-xs font-semibold text-right text-rose-100">
                      {converToTime(message.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex h-1/6 items-center bottom-0 absolute">
          <form className="flex w-[50vw] appearance-none rounded-md bg-gray-800 outline-none focus:outline-none">
            <textarea
              ref={textAreaRef}
              onKeyDown={(e) => handleKeyDown(e)}
              id="minput"
              placeholder="Message"
              className="mb-2 max-h-16 flex-grow appearance-none rounded-md border-none bg-gray-800 text-white placeholder-slate-400 focus:outline-none focus:ring-transparent"
            ></textarea>
            <button
              onClick={(e) => submit(e)}
              className="self-end p-2 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4 bg-gray-800"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
