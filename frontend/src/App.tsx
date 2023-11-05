import { Flex, Heading } from "@chakra-ui/react";
import "./App.css";
import Chat from "./Chat";

function App() {
  return (
    <div className="App">
      <Flex direction="column" height="100vh" bg="gray.100" p={4}>
        <Heading as="h1" textAlign="center" mb={4}>
          Simple Chat App
        </Heading>
        <Chat />
      </Flex>
    </div>
  );
}

export default App;
