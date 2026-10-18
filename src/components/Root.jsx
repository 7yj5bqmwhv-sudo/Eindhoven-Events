import { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Link,
  SkipNavLink,
  Text,
} from "@chakra-ui/react";
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { EventsProvider } from "../context/EventsProvider";
import { useEvents } from "../context/useEvents";
import { Navigation } from "./Navigation";
import { EventFormDialog } from "./EventFormDialog";
import { Toaster, toaster } from "./ui/toaster";

function AppLayout() {
  const { categories, users, loading, error, createEvent } = useEvents();
  const [createOpen, setCreateOpen] = useState(false);
  const mainRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const canAdd =
    !loading && !error && categories.length > 0 && users.length > 0;
  const onAdd = () => {
    if (canAdd) setCreateOpen(true);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  const handleCreate = async (values) => {
    try {
      const saved = await createEvent(values);
      toaster.create({
        title: "Event created",
        description: "Your event is ready to discover.",
        type: "success",
        closable: true,
      });
      navigate(`/event/${encodeURIComponent(saved.id)}`);
    } catch (saveError) {
      toaster.create({
        title: "Could not create event",
        description: saveError.message,
        type: "error",
        closable: true,
      });
      throw saveError;
    }
  };

  return (
    <Flex minH="100dvh" direction="column" colorPalette="teal">
      <SkipNavLink href="#main-content" zIndex="skipNav">
        Skip to content
      </SkipNavLink>
      <Navigation onAdd={onAdd} canAdd={canAdd} />
      <Box
        as="main"
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        flex="1"
        minW="0"
        outline="none"
      >
        <Outlet context={{ onAdd }} />
      </Box>
      <Box as="footer" borderTopWidth="1px" borderColor="border" mt="12">
        <Container maxW="7xl" px={{ base: 5, md: 8 }} py="7">
          <Flex
            gap="4"
            justify="space-between"
            flexWrap="wrap"
            color="fg.muted"
            fontSize="sm"
          >
            <Text>Good things happen together.</Text>
            <Link asChild color="fg.muted">
              <RouterLink to="/about">About this project</RouterLink>
            </Link>
          </Flex>
        </Container>
      </Box>
      {createOpen && (
        <EventFormDialog
          open
          key="new"
          onOpenChange={({ open }) => setCreateOpen(open)}
          categories={categories}
          users={users}
          onSubmit={handleCreate}
        />
      )}
      <Toaster />
    </Flex>
  );
}

export function Root() {
  return (
    <EventsProvider>
      <AppLayout />
    </EventsProvider>
  );
}
