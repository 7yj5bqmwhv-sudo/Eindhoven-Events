import { Badge, Box, HStack, Link, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { LuArrowUpRight, LuCalendarDays, LuMapPin } from "react-icons/lu";
import { EventImage } from "./EventImage";
import { categoryNames, formatDate, formatTime } from "../utils/display";
export function EventCard({ event, categories }) {
  const location = useLocation();
  const start = new Date(event.startTime);
  const validDate = !Number.isNaN(start.getTime());
  return (
    <Link
      asChild
      className="event-card"
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      minW="0"
      h="full"
      color="inherit"
      textDecoration="none"
      borderRadius="xl"
      bg="bg.panel"
      borderWidth="1px"
      overflow="hidden"
      borderColor="border.subtle"
      _hover={{ textDecoration: "none", shadow: "sm", borderColor: "border.muted" }}
      _focusVisible={{
        outline: "3px solid",
        outlineColor: "teal.focusRing",
        outlineOffset: "4px",
      }}
    >
      <RouterLink
        to={`/event/${encodeURIComponent(event.id)}`}
        state={{ from: location.pathname + location.search }}
        aria-label={`View ${event.title}`}
      >
        <EventImage
          src={event.image}
          title={event.title}
          imageAlt={event.imageAlt}
          imageFit="cover"
          aspectRatio={16 / 9}
          flexShrink="0"
        />
        <Stack p={{ base: 5, md: 6 }} gap="4" flex="1">
          <HStack gap="2" flexWrap="wrap">
            {categoryNames(event, categories).map((name, index) => (
              <Badge
                key={event.categoryIds[index]}
                colorPalette="gray"
                variant="subtle"
                borderRadius="full"
                px="2.5"
                fontWeight="500"
                color="fg.muted"
                bg="bg.subtle"
                textTransform="capitalize"
              >
                {name}
              </Badge>
            ))}
          </HStack>
          <Box>
            <HStack align="start" gap="3">
              <Stack
                aria-hidden="true"
                flexShrink="0"
                minW="12"
                align="center"
                gap="0"
                borderRadius="lg"
                bg="teal.subtle"
                color="teal.fg"
                py="1.5"
              >
                <Text fontSize="xs" fontWeight="700" letterSpacing="0.05em">
                  {validDate ? new Intl.DateTimeFormat("en-GB", { month: "short" }).format(start).toUpperCase() : "DATE"}
                </Text>
                <Text fontSize="xl" fontWeight="600" lineHeight="1.15">
                  {validDate ? start.getDate() : "–"}
                </Text>
              </Stack>
              <Text
                as="h3"
                fontSize="xl"
                fontWeight="600"
                lineHeight="1.25"
                letterSpacing="-0.025em"
                overflowWrap="anywhere"
                flex="1"
              >
                {event.title}
              </Text>
              <Box flexShrink="0" pt="1" color="fg.muted">
                <LuArrowUpRight size={18} aria-hidden="true" />
              </Box>
            </HStack>
            <Text
              color="fg.muted"
              fontSize="sm"
              mt="4"
              lineHeight="1.6"
              overflowWrap="anywhere"
            >
              {event.description}
            </Text>
          </Box>
          <Stack
            gap="2"
            fontSize="xs"
            color="fg.muted"
            borderTopWidth="1px"
            borderColor="border.subtle"
            pt="4"
            mt="auto"
          >
            <HStack align="start">
              <Box pt="0.5" flexShrink="0">
                <LuCalendarDays size={16} aria-hidden="true" />
              </Box>
              <Box>
                <Text>
                  Starts {formatDate(event.startTime)} ·{" "}
                  {formatTime(event.startTime)}
                </Text>
                <Text>
                  Ends {formatDate(event.endTime)} · {formatTime(event.endTime)}
                </Text>
                {event.scheduleNote && <Text mt="1">{event.scheduleNote}</Text>}
              </Box>
            </HStack>
            <HStack align="start">
              <Box pt="0.5" flexShrink="0">
                <LuMapPin size={16} aria-hidden="true" />
              </Box>
              <Text overflowWrap="anywhere">{event.location}</Text>
            </HStack>
          </Stack>
        </Stack>
      </RouterLink>
    </Link>
  );
}
