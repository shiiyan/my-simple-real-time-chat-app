import { Box, Heading } from "@chakra-ui/react";
import "./App.css";
import Chat from "./Chat";

function App() {
  return (
    <div className="App">
      <Box p={4} bg="gray.100" minH="100vh">
        <Heading as="h1" textAlign="center" mb={4}>
          Simple Chat App
        </Heading>
        <Chat />
      </Box>
    </div>
  );
}

export default App;
