import { useEffect } from "react";
import { Container } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
export function NotFoundPage() {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = "Page not found | Eindhoven Together";
  }, []);
  return (
    <Container maxW="4xl" py="16" px="4">
      <EmptyState
        headingAs="h1"
        title="This path leads somewhere else"
        description="We couldn't find that page. Let's get you back to the events."
        action="Back to events"
        onAction={() => navigate("/")}
      />
    </Container>
  );
}
