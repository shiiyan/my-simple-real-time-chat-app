import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";

const currentClientId = "3e00193e-c52d-4340-b040-7b1be9a1ef77";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/login",
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
      localStorage.setItem("token", response.data.token);
    } catch {
      console.error("Login failed");
    }
  };

  return (
    <Flex height="100%" alignItems="center" justifyContent="center">
      <Box bg="white" p={6} rounded="md" w="100%" maxW={400}>
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
          bg="blue.100"
          onClick={handleLogin}
        >
          Login
        </Button>
      </Box>
    </Flex>
  );
}

export default Login;
