import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export default function ChatApp({ user }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:3000/users", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUsers(data.filter((u) => u.username !== user)))
      .catch((err) => console.error("Error fetching users:", err));

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handleMessage);

    return () => {
      socket.off("receive_message", handleMessage);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectUser = async (selectedUsername) => {
    setSelectedUser(selectedUsername);
    setMessages([]);
    const chatRoom = [user, selectedUsername].sort().join("-");
    setRoom(chatRoom);

    try {
      const res = await fetch(`http://localhost:3000/chats/${user}/${selectedUsername}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      setMessages(data);
      socket.emit("join_chat", { room: chatRoom });
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedUser || !room) return;
    const chatData = { sender: user, receiver: selectedUser, message, room };
    socket.emit("send_message", chatData);
    setMessages((prev) => [...prev, chatData]);
    setMessage("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", display: "flex", gap: "20px" }}>
      <div style={{ width: "200px", borderRight: "1px solid #ddd", paddingRight: "10px" }}>
        <h2>Users</h2>
        <div style={{ display: "grid", gap: "10px" }}>
          {users.length > 0 ? (
            users.map((u) => (
              <button
                key={u.username}
                onClick={() => selectUser(u.username)}
                style={{
                  padding: "10px",
                  backgroundColor: selectedUser === u.username ? "#007bff" : "#f8f9fa",
                  color: selectedUser === u.username ? "white" : "black",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {u.username}
              </button>
            ))
          ) : (
            <p>No users found</p>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {selectedUser ? (
          <div style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "10px", maxWidth: "400px" }}>
            <h2>Chat with {selectedUser}</h2>
            <div
              style={{
                height: "250px",
                border: "1px solid grey",
                padding: "10px",
                overflowY: "auto",
                marginBottom: "10px",
                background: "#f8f9fa",
                borderRadius: "5px",
              }}
            >
              {messages.length === 0 ? (
                <p style={{ textAlign: "center", color: "gray" }}>Start Messaging..</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} style={{ textAlign: msg.sender === user ? "right" : "left", margin: "5px 0" }}>
                    <span
                      style={{
                        backgroundColor: msg.sender === user ? "#007bff" : "#f1f1f1",
                        color: msg.sender === user ? "white" : "black",
                        padding: "8px",
                        borderRadius: "10px",
                        display: "inline-block",
                        maxWidth: "70%",
                      }}
                    >
                      <strong>{msg.sender}:</strong> {msg.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef}></div>
            </div>
            <div style={{ display: "flex" }}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1, padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: "8px 12px",
                  marginLeft: "5px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontStyle: "italic" }}>Select a user to start chatting.</p>
        )}
      </div>
    </div>
  );
}
