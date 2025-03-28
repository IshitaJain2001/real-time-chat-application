import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

const socket = io('http://localhost:3000');

function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('userList', (users) => {
      setUserList(users);
    });

    return () => {
      socket.off('message');
      socket.off('userList');
    };
  }, []);

  const sendMessage = () => {
    if (newMessage && selectedUser) {
      const recipientSocketId = userList.find(user => user === selectedUser).socketId;

      const messageData = { recipientSocketId, message: newMessage, sender: username };
      socket.emit('sendMessageToUser', messageData);
      setNewMessage('');
    } else {
      alert('Please type a message and select a user');
    }
  };

  const setUserName = () => {
    if (username) {
      setIsUsernameSet(true);
      socket.emit('setUsername', username);
    } else {
      alert('Please enter a valid username');
    }
  };

  return (
    <div>
      {!isUsernameSet ? (
        <div>
          <h2>Enter your username:</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <button onClick={setUserName}>Set Username</button>
        </div>
      ) : (
        <div>
          <h1>Private Real-Time Chat</h1>
          <div>
            <h3>Select a User to Chat with:</h3>
            <ul>
              {userList.map((user, index) => (
                <li key={index} onClick={() => setSelectedUser(user)}>
                  {user}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message"
            />
            <button onClick={sendMessage}>Send</button>
          </div>

          <div>
            <h2>Messages</h2>
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.user}: </strong>{msg.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
