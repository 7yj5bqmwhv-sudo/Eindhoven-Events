import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  LuArrowLeft,
  LuCalendarDays,
  LuMapPin,
  LuPencil,
  LuTrash2,
  LuUserRound,
} from "react-icons/lu";
import { useEvents } from "../context/useEvents";
import { categoryNames, formatDate, formatTime } from "../utils/display";
import { EventImage } from "../components/EventImage";
import { EventImageCredit, EventSource } from "../components/EventSource";
import { EventFormDialog } from "../components/EventFormDialog";
import { DeleteEventDialog } from "../components/DeleteEventDialog";
import { EmptyState } from "../components/EmptyState";
import { LoadingEvents } from "../components/LoadingEvents";
import { toaster } from "../components/ui/toaster";
export function EventPage() {
  const { eventId } = useParams();
  const {
    events,
    categories,
    users,
    loading,
    error,
    reload,
    updateEvent,
    deleteEvent,
  } = useEvents();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const event = events.find((item) => String(item.id) === eventId);
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.startsWith("/?")
    ? location.state.from
    : "/";
  useEffect(() => {
    document.title = `${event?.title ?? "Event"} | Eindhoven Together`;
  }, [event?.title]);
  async function save(values) {
    try {
      const changes = { ...values };
      if (values.image !== event.image) {
        Object.assign(changes, {
          imageAlt: null, imageFit: null, imageCredit: null,
          imageSourceUrl: null, imageCaption: null,
        });
      }
      if (new Date(values.startTime).getTime() !== new Date(event.startTime).getTime()
        || new Date(values.endTime).getTime() !== new Date(event.endTime).getTime()) {
        changes.scheduleNote = null;
        changes.admissionNote = null;
      }
      const saved = await updateEvent(event.id, changes);
      toaster.create({
        title: "Event updated",
        description: "Your changes have been saved.",
        type: "success",
        closable: true,
      });
      return saved;
    } catch (cause) {
      toaster.create({
        title: "Could not update event",
        description: cause.message,
        type: "error",
        closable: true,
      });
      throw cause;
    }
  }
  async function remove() {
    try {
      await deleteEvent(event.id);
      toaster.create({
        title: "Event deleted",
        description: "The event has been removed.",
        type: "success",
        closable: true,
      });
      navigate(from, { replace: true });
    } catch (cause) {
      toaster.create({
        title: "Could not delete event",
        description: cause.message,
        type: "error",
        closable: true,
      });
      throw cause;
    }
  }
  return (
    <Container
      maxW="7xl"
      py={{ base: "7", md: "10" }}
      px={{ base: "4", md: "8" }}
    >
      <Link asChild mb="7" minH="11" color="teal.fg" fontWeight="600">
        <RouterLink to={from}>
          <LuArrowLeft />
          Back to events
        </RouterLink>
      </Link>
      {loading ? (
        <LoadingEvents />
      ) : error ? (
        <EmptyState
          title="We couldn't load this event"
          headingAs="h1"
          description={error}
          action="Try again"
          onAction={reload}
          isError
        />
      ) : !event ? (
        <EmptyState
          title="Event not found"
          headingAs="h1"
          description="This event may have been removed. Explore the other events to find your next plan."
          action="Explore events"
          onAction={() => navigate("/")}
        />
      ) : (
        <>
          <HStack gap="2" flexWrap="wrap" mb="4">
            {categoryNames(event, categories).map((name, index) => (
              <Badge
                key={event.categoryIds[index]}
                colorPalette="teal"
                borderRadius="full"
                px="3"
                py="1"
                textTransform="capitalize"
              >
                {name}
              </Badge>
            ))}
          </HStack>
          <Heading
            as="h1"
            fontSize={{ base: "3xl", md: "5xl" }}
            lineHeight="1.1"
            letterSpacing="-0.045em"
            mb="7"
            maxW="4xl"
            overflowWrap="anywhere"
          >
            {event.title}
          </Heading>
          <SimpleGrid
            columns={{ base: 1, lg: 3 }}
            gap={{ base: "7", md: "10" }}
          >
            <Stack gridColumn={{ lg: "span 2" }} gap="8" minW="0">
              <EventImage
                src={event.image}
                title={event.title}
                imageAlt={event.imageAlt}
                imageFit={event.imageFit}
                priority
                h={{ base: "64", md: "96" }}
                borderRadius="2xl"
              />
              <EventImageCredit event={event} />
              <Box>
                <Heading as="h2" size="xl" mb="4">
                  A little more about this event
                </Heading>
                <Text
                  color="fg.muted"
                  fontSize="lg"
                  lineHeight="1.8"
                  whiteSpace="pre-wrap"
                  overflowWrap="anywhere"
                >
                  {event.description}
                </Text>
              </Box>
              <EventSource event={event} />
            </Stack>
            <Stack
              gap="6"
              bg="bg.panel"
              p={{ base: "5", md: "7" }}
              borderWidth="1px"
              borderRadius="2xl"
              alignSelf="start"
              minW="0"
            >
              <Heading as="h2" size="xl">
                Your plan, at a glance
              </Heading>
              <HStack align="start" gap="3">
                <Box pt="1" color="teal.fg">
                  <LuCalendarDays size={21} />
                </Box>
                <Stack gap="3">
                  <Box>
                    <Text fontSize="xs" color="fg.muted" fontWeight="600">
                      STARTS
                    </Text>
                    <Text fontWeight="600">
                      {formatDate(event.startTime)} ·{" "}
                      {formatTime(event.startTime)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="fg.muted" fontWeight="600">
                      ENDS
                    </Text>
                    <Text fontWeight="600">
                      {formatDate(event.endTime)} · {formatTime(event.endTime)}
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="fg.muted">
                    Times shown in your local time zone.
                  </Text>
                  {event.scheduleNote && <Text fontSize="sm" color="fg.muted">{event.scheduleNote}</Text>}
                </Stack>
              </HStack>
              <HStack align="start" gap="3">
                <Box pt="1" color="teal.fg">
                  <LuMapPin size={21} />
                </Box>
                <Box minW="0">
                  <Text fontSize="xs" color="fg.muted" fontWeight="600">
                    LOCATION
                  </Text>
                  <Text overflowWrap="anywhere">{event.location}</Text>
                </Box>
              </HStack>
              <HStack align="start" gap="3">
                <Box pt="1" color="teal.fg">
                  <LuUserRound size={21} />
                </Box>
                <Box>
                  <Text fontSize="xs" color="fg.muted" fontWeight="600">
                    ORGANISED BY
                  </Text>
                  <Text>
                    {users.find(
                      (user) => String(user.id) === String(event.createdBy),
                    )?.name ?? "Community organiser"}
                  </Text>
                </Box>
              </HStack>
              {event.admissionNote && (
                <Box bg="bg.subtle" p="4" borderRadius="lg">
                  <Text fontSize="xs" color="fg.muted" fontWeight="600" mb="1">GOOD TO KNOW</Text>
                  <Text fontSize="sm">{event.admissionNote}</Text>
                </Box>
              )}
              <Stack borderTopWidth="1px" pt="5" gap="3">
                <Button colorPalette="teal" onClick={() => setEditing(true)}>
                  <LuPencil />
                  Edit event
                </Button>
                <Button
                  variant="outline"
                  colorPalette="red"
                  onClick={() => setDeleting(true)}
                >
                  <LuTrash2 />
                  Delete event
                </Button>
              </Stack>
            </Stack>
          </SimpleGrid>
          {editing && (
            <EventFormDialog
              key={event.id}
              open
              onOpenChange={({ open }) => setEditing(open)}
              event={event}
              categories={categories}
              users={users}
              onSubmit={save}
            />
          )}
          {deleting && (
            <DeleteEventDialog
              open
              onOpenChange={({ open }) => setDeleting(open)}
              event={event}
              onConfirm={remove}
            />
          )}
        </>
      )}
    </Container>
  );
}
