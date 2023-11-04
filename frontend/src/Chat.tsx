import axios from "axios";
import { useEffect, useState } from "react";

type Message = {
  message: string;
};

const Chat: React.FC = () => {
  const [fetchedMessages, setFetchedMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");

  useEffect(() => {
    const fetchMessages = async () => {
      console.log("useEffect");
      try {
        const response = await axios.get("http://localhost:3000/messages", {
          headers: {
            "X-Client-ID": "3e00193e-c52d-4340-b040-7b1be9a1ef77",
          },
        });
        if (response.status === 200) {
          setFetchedMessages((previousMessages) => [
            ...previousMessages,
            ...response.data,
          ]);
        }

        fetchMessages();
      } catch (error) {
        console.error("Error fetching messages", error);
      }
    };

    fetchMessages();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = async () => {
    try {
      await axios.post(
        "http://localhost:3000/messages",
        {
          message: newMessage,
        },
        {
          headers: {
            "X-Client-ID": "3e00193e-c52d-4340-b040-7b1be9a1ef77",
          },
        }
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <div>
      <ul>
        {fetchedMessages.map((message, index) => (
          <li key={index}>{message.message}</li>
        ))}
      </ul>
      <input type="text" value={newMessage} onChange={handleInputChange} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
