import {
  Box,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
export function LoadingEvents() {
  return (
    <Box role="status" aria-label="Loading events" aria-busy="true">
      <Text mb="4" color="fg.muted">
        Loading events…
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
        {["first", "second", "third"].map((id) => (
          <Stack
            key={id}
            borderWidth="1px"
            borderRadius="xl"
            borderColor="border.subtle"
            overflow="hidden"
            bg="bg.panel"
            aria-hidden="true"
          >
            <Skeleton w="full" aspectRatio={16 / 9} />
            <Stack p={{ base: 5, md: 6 }} gap="5">
              <Skeleton h="5" w="24" />
              <Skeleton h="7" />
              <SkeletonText noOfLines={3} />
              <Skeleton h="12" />
            </Stack>
          </Stack>
        ))}
      </SimpleGrid>
    </Box>
  );
}
