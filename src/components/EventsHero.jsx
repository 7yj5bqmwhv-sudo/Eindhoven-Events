import { Box, Flex, Heading, HStack, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { LuArrowUpRight, LuCalendarDays, LuMapPin } from "react-icons/lu";
import { EventImage } from "./EventImage";
import { formatDate } from "../utils/display";

export function EventsHero({ event }) {
  const location = useLocation();
  return (
    <Stack gap={{ base: 6, md: 8 }} pt={{ base: 8, md: 12 }} pb={{ base: 8, md: 12 }}>
      <Flex gap="5" justify="space-between" align="end" flexWrap="wrap">
        <Box maxW="3xl">
          <Text color="teal.fg" fontSize="sm" fontWeight="600" mb="3">
            Eindhoven city guide
          </Text>
          <Heading as="h1" fontSize={{ base: "4xl", md: "5xl" }} fontWeight="600" lineHeight="1.08" letterSpacing="-0.045em">
            Your city. Your next plan.
          </Heading>
        </Box>
        <Stack gap="1" pb="1">
          <Text fontSize="sm" fontWeight="600">October – December 2026</Text>
          <Text color="fg.muted" fontSize="sm">A season of things to look forward to.</Text>
        </Stack>
      </Flex>
      {event && (
        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          borderRadius="2xl"
          overflow="hidden"
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Box minW="0" bg="bg.subtle">
            <EventImage
              src={event.image}
              title={event.title}
              imageAlt={event.imageAlt}
              imageFit={event.imageFit}
              priority
              h={{ base: "56", md: "80" }}
            />
            {(event.imageCaption || event.imageCredit) && (
              <Text fontSize="xs" color="fg.muted" px="4" py="2">
                {event.imageCaption || `Image: ${event.imageCredit}.`}
              </Text>
            )}
          </Box>
          <Stack p={{ base: 6, md: 8, lg: 10 }} gap="4" justify="center" align="start" minW="0">
            <Text fontSize="xs" fontWeight="600" color="teal.fg" letterSpacing="0.06em" textTransform="uppercase">
              In the spotlight
            </Text>
            <Heading as="h2" fontSize={{ base: "2xl", lg: "3xl" }} fontWeight="600" lineHeight="1.16" overflowWrap="anywhere">
              {event.title}
            </Heading>
            <Stack gap="2" color="fg.muted" fontSize="sm">
              <HStack align="start" gap="2">
                <Box pt="0.5" flexShrink="0"><LuCalendarDays aria-hidden="true" /></Box>
                <Text>
                  {formatDate(event.startTime)}
                  {formatDate(event.startTime) !== formatDate(event.endTime) && ` – ${formatDate(event.endTime)}`}
                </Text>
              </HStack>
              <HStack align="start" gap="2">
                <Box pt="0.5" flexShrink="0"><LuMapPin aria-hidden="true" /></Box>
                <Text overflowWrap="anywhere">{event.location}</Text>
              </HStack>
              {event.scheduleNote && <Text>{event.scheduleNote}</Text>}
            </Stack>
            <Link asChild color="teal.fg" fontWeight="600" minH="11" mt="1">
              <RouterLink
                to={`/event/${encodeURIComponent(event.id)}`}
                state={{ from: location.pathname + location.search }}
                aria-label={`Explore featured event ${event.title}`}
              >
                Explore this event <LuArrowUpRight aria-hidden="true" />
              </RouterLink>
            </Link>
          </Stack>
        </SimpleGrid>
      )}
    </Stack>
  );
}
