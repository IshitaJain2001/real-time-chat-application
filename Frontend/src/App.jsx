import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export default function ChatApp({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setUsers(data.filter((u) => u.username !== user));
      })
      .catch((err) => console.error("Error fetching users:", err));

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive_message");
  }, [user]);

  const selectUser = async (selectedUsername) => {
    setSelectedUser(selectedUsername);
    setMessages([]);

    try {
      const res = await fetch(`http://localhost:3000/chats/${user}/${selectedUsername}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const data = await res.json();
      setMessages(data);

      socket.emit("join_chat", { room: `${user}-${selectedUsername}` });
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedUser) return;

    const chatData = { sender: user, receiver: selectedUser, message };
    socket.emit("send_message", chatData);
    setMessages((prev) => [...prev, chatData]);
    setMessage("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Chat App</h1>
      <h3>Welcome, {user}</h3>

      <h3>Select a User to Chat with:</h3>
      {users.map((u) => (
        <button key={u.username} onClick={() => selectUser(u.username)} style={{ margin: "5px", padding: "10px" }}>
          {u.username}
        </button>
      ))}

      {selectedUser ? (
        <div style={{ marginTop: "20px", border: "1px solid black", padding: "10px", width: "300px" }}>
          <h2>Chat with {selectedUser}</h2>
          <div style={{ minHeight: "100px", border: "1px solid grey", padding: "5px", marginBottom: "10px" }}>
            {messages.map((msg, index) => (
              <p key={index} style={{ textAlign: msg.sender === user ? "right" : "left" }}>
                {msg.message}
              </p>
            ))}
          </div>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message" />
          <button onClick={sendMessage}>Send</button>
        </div>
      ) : (
        <p style={{ marginTop: "20px", fontStyle: "italic" }}>Select a user to start chatting.</p>
      )}
    </div>
  );
}
