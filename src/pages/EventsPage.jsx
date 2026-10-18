import { useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { LuSearch, LuX } from "react-icons/lu";
import { useEvents } from "../context/useEvents";
import { EventCard } from "../components/EventCard";
import { EventsHero } from "../components/EventsHero";
import { LoadingEvents } from "../components/LoadingEvents";
import { EmptyState } from "../components/EmptyState";
import { filterEvents } from "../utils/display";
export function EventsPage() {
  const { events, categories, loading, error, reload } = useEvents();
  const { onAdd } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const selected = params.getAll("category");
  const filtered = filterEvents(events, query, selected);
  useEffect(() => {
    document.title = "Explore events | Eindhoven Together";
  }, []);
  function changeSearch(value) {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  }
  function toggleCategory(id) {
    const next = new URLSearchParams(params);
    next.delete("category");
    const ids = selected.includes(String(id))
      ? selected.filter((item) => item !== String(id))
      : [...selected, String(id)];
    ids.forEach((item) => next.append("category", item));
    setParams(next, { replace: true });
  }
  return (
    <Container maxW="7xl" px={{ base: "4", md: "8" }}>
      <EventsHero event={!loading && !error ? events.find((event) => event.featured) ?? events[0] : null} />
      <Stack id="explore" scrollMarginTop="40" gap="6" pt="2">
        <Flex justify="space-between" align="end" wrap="wrap" gap="3">
          <Box>
            <Heading
              as="h2"
              size={{ base: "xl", md: "2xl" }}
              fontWeight="600"
              letterSpacing="-0.035em"
            >
              What’s on in Eindhoven
            </Heading>
          </Box>
          <Text color="fg.muted" fontSize="sm">
            Times shown in your local time zone
          </Text>
        </Flex>
        <Box
          borderRadius="xl"
          p={{ base: "4", md: "5" }}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Box position="relative" maxW="xl">
            <Box
              position="absolute"
              left="4"
              top="4"
              pointerEvents="none"
              color="fg.muted"
            >
              <LuSearch />
            </Box>
            <Input
              aria-label="Search events by name"
              placeholder="Find an event by name"
              value={query}
              onChange={(event) => changeSearch(event.target.value)}
              ps="11"
              pe="11"
              h="12"
              bg="bg.subtle"
              borderRadius="xl"
            />
            {query && (
              <Button
                position="absolute"
                right="1"
                top="1"
                size="sm"
                variant="ghost"
                aria-label="Clear search"
                onClick={() => changeSearch("")}
              >
                <LuX />
              </Button>
            )}
          </Box>
          <HStack
            gap="2"
            mt="4"
            flexWrap="wrap"
            role="group"
            aria-label="Filter by categories"
          >
            <Text fontSize="sm" color="fg.muted" mr="1">
              Categories
            </Text>
            {categories.map((category) => (
              <Checkbox.Root
                key={category.id}
                checked={selected.includes(String(category.id))}
                onCheckedChange={() => toggleCategory(category.id)}
                colorPalette="teal"
                borderWidth="1px"
                borderColor={selected.includes(String(category.id)) ? "teal.fg" : "border"}
                borderRadius="full"
                cursor="pointer"
                _hover={{ borderColor: "teal.fg" }}
                px="3"
                py="2"
                minH="11"
                bg={
                  selected.includes(String(category.id))
                    ? "teal.subtle"
                    : "transparent"
                }
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control borderRadius="full">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label textTransform="capitalize" fontSize="sm">
                  {category.name}
                </Checkbox.Label>
              </Checkbox.Root>
            ))}
            {selected.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.delete("category");
                  setParams(next, { replace: true });
                }}
              >
                Clear filters
              </Button>
            )}
          </HStack>
        </Box>
        <Flex justify="space-between" gap="3" wrap="wrap">
          <Text role="status" aria-live="polite" fontSize="sm" fontWeight="600">
            {loading
              ? "Loading events…"
              : `${filtered.length} ${filtered.length === 1 ? "event" : "events"} to explore`}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            Check the organiser’s page for the latest details.
          </Text>
        </Flex>
        {loading ? (
          <LoadingEvents />
        ) : error ? (
          <EmptyState
            title="We couldn't load the events"
            description={error}
            action="Try again"
            onAction={reload}
            isError
          />
        ) : !events.length ? (
          <EmptyState
            title="A fresh start"
            description="There are no events yet. Create the first one and bring people together."
            action="Add an event"
            onAction={onAdd}
          />
        ) : !filtered.length ? (
          <EmptyState
            title="No events found"
            description="Try a different name or clear your filters to see more events."
            action="Reset search and filters"
            onAction={() => setParams({})}
          />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} categories={categories} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
