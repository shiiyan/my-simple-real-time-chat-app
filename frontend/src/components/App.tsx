import { Flex, Heading } from "@chakra-ui/react";
import Chat from "./Chat";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./Login";
import { ReactElement } from "react";

function isAuthenticated(): boolean {
  return !!localStorage.getItem("token");
}

const ProtectedRoute: React.FC<{ children: ReactElement }> = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Flex direction="column" height="100vh" bg="gray.100" p={4}>
        <Heading as="h1" textAlign="center" mb={4}>
          Simple Chat App
        </Heading>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to="/chat" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Flex>
    </BrowserRouter>
  );
}

export default App;
