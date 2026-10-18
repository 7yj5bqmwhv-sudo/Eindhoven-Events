import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Box, Button, Container, Heading, Text } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "./components/ui/provider";
import { Root } from "./components/Root";
import { EventsPage } from "./pages/EventsPage";
import { EventPage } from "./pages/EventPage";
import { AboutPage } from "./pages/AboutPage";
import { NotFoundPage } from "./pages/NotFoundPage";

class AppErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Container maxW="xl" py="20">
        <Box role="alert">
          <Heading size="2xl">Something went wrong</Heading>
          <Text mt="4" color="fg.muted">
            The page could not be displayed. Reload to try again.
          </Text>
          <Button
            mt="6"
            colorPalette="teal"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </Box>
      </Container>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider>
      <AppErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route element={<Root />}>
              <Route index element={<EventsPage />} />
              <Route path="event/:eventId" element={<EventPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppErrorBoundary>
    </Provider>
  </StrictMode>,
);
