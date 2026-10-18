import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
export function EmptyState({
  title,
  description,
  action,
  onAction,
  isError = false,
  headingAs = "h2",
}) {
  return (
    <Stack
      role={isError ? "alert" : undefined}
      align="center"
      textAlign="center"
      py="16"
      px="5"
      borderWidth="1px"
      borderRadius="2xl"
      bg="bg.panel"
      gap="4"
    >
      <Box color="teal.fg">
        <LuSearch size={32} />
      </Box>
      <Heading as={headingAs} size="xl">
        {title}
      </Heading>
      <Text color="fg.muted" maxW="lg">
        {description}
      </Text>
      {action && (
        <Button colorPalette="teal" variant="outline" onClick={onAction}>
          {action}
        </Button>
      )}
    </Stack>
  );
}
