import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { LuArrowUpRight } from "react-icons/lu";
import { safeExternalUrl } from "../utils/externalLinks";
import { formatDate } from "../utils/display";

export function EventSource({ event }) {
  const source = safeExternalUrl(event.sourceUrl);
  if (!source) return null;
  return (
    <Box borderTopWidth="1px" borderColor="border.subtle" pt="6">
      <Heading as="h2" size="md" mb="3">From the organiser</Heading>
      <Stack gap="2" align="start">
        <Link href={source} target="_blank" rel="noopener noreferrer" color="teal.fg" fontWeight="600" minH="11">
          View official event <LuArrowUpRight aria-hidden="true" />
        </Link>
        <Text fontSize="sm" color="fg.muted">
          {event.sourceName || "Official event listing"}
          {event.sourceCheckedAt ? ` · Researched ${formatDate(`${event.sourceCheckedAt}T12:00:00Z`)}` : ""}
        </Text>
        <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
          Check the organiser’s page for current times, tickets and availability.
          Changes made in this app do not change the organiser’s listing.
        </Text>
      </Stack>
    </Box>
  );
}

export function EventImageCredit({ event }) {
  if (!event.imageCredit) return null;
  const source = safeExternalUrl(event.imageSourceUrl);
  return (
    <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
      {event.imageCaption || `Image: ${event.imageCredit}.`}{" "}
      {source && <Link href={source} target="_blank" rel="noopener noreferrer" textDecoration="underline">Image source</Link>}
    </Text>
  );
}
