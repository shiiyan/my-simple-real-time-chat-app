import { Box, Button, Flex, Input, Text, VStack } from "@chakra-ui/react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import { generateClientId } from "../utils/generateClientId";

type Message = {
  text: string;
  username: string;
  clientId: string;
  posted: number;
};

const currentClientId = generateClientId();

const Chat: React.FC = () => {
  const [fetchedMessages, setFetchedMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const bottomOfMessages = useRef<HTMLDivElement>(null);

  const currentUsername = jwtDecode<{ username: string }>(
    localStorage.getItem("token") ?? ""
  ).username;

  useEffect(() => {
    bottomOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [fetchedMessages]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    const fetchMessages = async (): Promise<void> => {
      try {
        const response = await axios.get("http://localhost:3000/messages", {
          params: {
            lastFetched: fetchedMessages[fetchedMessages.length - 1]?.posted,
          },
          headers: {
            "X-Client-ID": currentClientId,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          cancelToken: cancelTokenSource.token,
        });
        if (response.status === 200) {
          setFetchedMessages((previousMessages) => {
            return [...previousMessages, ...response.data].sort(
              (a: Message, b: Message) => a.posted - b.posted
            );
          });
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Request canceled", error.message);
        } else {
          console.error("Error fetching messages", error);
        }
      }
    };

    fetchMessages();
    return () => {
      cancelTokenSource.cancel("cleanup fetchMessages");
    };
  }, [fetchedMessages]);

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
            "X-Client-ID": currentClientId,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <>
      <VStack spacing={4} overflowY="auto" flex="1" mb={4}>
        {fetchedMessages.map((message) => {
          const isSentByCurrent = message.username === currentUsername;

          return (
            <Flex
              justifyContent={isSentByCurrent ? "flex-end" : "flex-start"}
              width="100%"
              key={message.posted}
            >
              <Box
                bg={isSentByCurrent ? "blue.100" : "white"}
                p={2}
                rounded="md"
                shadow="base"
              >
                <Text>{message.text}</Text>
              </Box>
            </Flex>
          );
        })}
        <div ref={bottomOfMessages} />
      </VStack>
      <Input
        type="text"
        value={newMessage}
        onChange={handleInputChange}
        placeholder="Type a message..."
        bg="white"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            sendMessage();
          }
        }}
      />
      <Button colorScheme="blue" mt={2} onClick={sendMessage}>
        Send
      </Button>
    </>
  );
};

export default Chat;
