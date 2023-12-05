import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateClientId } from "../utils/generateClientId";

const currentClientId = generateClientId();

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "https://my-simple-chat-app-cf090e53a84f.herokuapp.com/login",
        {
          username,
          password,
        },
        {
          headers: {
            "X-Client-ID": currentClientId,
          },
        }
      );

      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        navigate("/chat");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
      console.error("Login failed", error);
    }
  };

  return (
    <Flex height="100%" alignItems="center" justifyContent="center">
      <Box bg="white" p={6} rounded="md" w="100%" maxW={400}>
        {error && (
          <Text color="red.500" mb={4}>
            {error}
          </Text>
        )}
        <FormControl id="username" isRequired>
          <FormLabel>Username</FormLabel>
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          ></Input>
        </FormControl>
        <FormControl id="password" mt={4} isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></Input>
        </FormControl>
        <Button
          width="100%"
          mt={4}
          type="submit"
          colorScheme="blue"
          onClick={handleLogin}
        >
          Login
        </Button>
      </Box>
    </Flex>
  );
}

export default Login;
