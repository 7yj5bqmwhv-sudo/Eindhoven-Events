import { useEffect } from "react";
import {
  Badge,
  Box,
  Container,
  Heading,
  Link,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  LuArrowUpRight,
  LuCalendarDays,
  LuHeartHandshake,
  LuMapPin,
} from "react-icons/lu";
export function AboutPage() {
  useEffect(() => {
    document.title = "About | Eindhoven Together";
  }, []);
  return (
    <Container
      maxW="6xl"
      px={{ base: "4", md: "8" }}
      py={{ base: "10", md: "16" }}
    >
      <Stack maxW="3xl" gap="6">
        <Badge
          variant="plain"
          color="teal.fg"
          alignSelf="start"
          px="0"
          letterSpacing="0.12em"
        >
          DISCOVER EINDHOVEN
        </Badge>
        <Heading
          as="h1"
          fontSize={{ base: "4xl", md: "6xl" }}
          lineHeight="1.05"
          letterSpacing="-0.05em"
        >
          A good city starts with its people.
        </Heading>
        <Text color="fg.muted" fontSize="xl" lineHeight="1.8">
          A considered selection of design, light art, theatre and nights out.
          Find a reason to get out into Eindhoven this autumn and winter.
        </Text>
      </Stack>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="6" my="12">
        {[
          {
            title: "Discover your city",
            text: "Explore events by name, or choose the categories that suit your mood.",
            Icon: LuMapPin,
          },
          {
            title: "Go to the source",
            text: "Each researched event links to its organiser. Check the original listing for tickets, accessibility and the latest programme.",
            Icon: LuHeartHandshake,
          },
          {
            title: "Keep the details simple",
            text: "Dates, venues, opening hours and age guidance sit together on each event page, alongside the original image credit.",
            Icon: LuCalendarDays,
          },
        ].map(({ title, text, Icon }) => (
          <Stack
            key={title}
            bg="bg.panel"
            borderWidth="1px"
            borderRadius="2xl"
            p="7"
            gap="4"
          >
            <Box color="teal.fg">
              <Icon size={28} />
            </Box>
            <Heading as="h2" size="xl">
              {title}
            </Heading>
            <Text color="fg.muted" lineHeight="1.7">
              {text}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>
      <Box bg="teal.subtle" borderRadius="2xl" p={{ base: "6", md: "9" }}>
        <Heading as="h2" size="xl" mb="3">
          Real events. A personal project.
        </Heading>
        <Text color="fg.muted" lineHeight="1.8" maxW="3xl">
          This is a React Advanced course project by Yurii Ivanov. The starting
          collection contains 12 real listings researched on 18 October 2026,
          covering the rest of October through 31 December, including the ongoing
          Dutch Design Week. New Year’s Eve continues into 1 January.
        </Text>
        <Text color="fg.muted" lineHeight="1.8" maxW="3xl" mt="4">
          Details come from the official Dutch Design Week, GLOW, Parktheater,
          Effenaar and Winter Market websites. Photographs and promotional artwork
          belong to their credited creators. The GLOW photograph shows the 2025
          edition; it illustrates the festival rather than the forthcoming installations.
        </Text>
        <Text color="fg.muted" lineHeight="1.8" maxW="3xl" mt="4">
          This guide does not sell tickets or represent the organisers. Events
          you add, edit or delete are saved to the connected project database.
          Those changes affect your copy of the guide, not an official listing.
        </Text>
        <Link asChild color="teal.fg" fontWeight="600" mt="5" minH="11">
          <RouterLink to="/">
            Explore the events <LuArrowUpRight />
          </RouterLink>
        </Link>
      </Box>
    </Container>
  );
}
