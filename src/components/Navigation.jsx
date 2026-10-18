import {
  Box,
  Button,
  Container,
  Flex,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { NavLink, Link as RouterLink } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LuArrowUpRight,
  LuMoon,
  LuPlus,
  LuSun,
} from "react-icons/lu";

function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Dark" : "Light";
  const next = isDark ? "light" : "dark";
  const nextLabel = isDark ? "Light" : "Dark";
  const Icon = isDark ? LuMoon : LuSun;
  return (
    <Button
      variant="ghost"
      size="sm"
      minH="11"
      borderRadius="full"
      color="fg.muted"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${label}. Switch to ${nextLabel} mode`}
    >
      <Icon aria-hidden="true" />
      {label}
    </Button>
  );
}

export function Navigation({ onAdd, canAdd }) {
  return (
    <Box
      as="header"
      className="app-navigation"
      position="sticky"
      top="0"
      zIndex="sticky"
      bg="bg.material"
      boxShadow="0 1px 0 var(--chakra-colors-border-subtle)"
    >
      <Container maxW="7xl" px={{ base: 4, md: 8 }} py="3">
        <Flex align="center" justify="space-between" gap={{ base: 2, md: 5 }} flexWrap="wrap">
          <Link
            asChild
            textDecoration="none"
            color="fg"
            _hover={{ textDecoration: "none" }}
          >
            <RouterLink to="/" aria-label="Eindhoven Together home">
              <Flex align="center" gap="2.5">
                <Flex
                  align="center"
                  justify="center"
                  boxSize="9"
                  bg="teal.solid"
                  color="teal.contrast"
                  borderRadius="lg"
                >
                  <LuArrowUpRight size={23} aria-hidden="true" />
                </Flex>
                <Stack gap="0">
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    lineHeight="1.1"
                    letterSpacing="-0.04em"
                  >
                    eindhoven
                  </Text>
                  <Text
                    fontSize="xs"
                    fontWeight="500"
                    color="fg.muted"
                    letterSpacing="0.04em"
                    mt="0.5"
                  >
                    together
                  </Text>
                </Stack>
              </Flex>
            </RouterLink>
          </Link>
          <Box order={{ base: 1, md: 3 }}>
            <ThemeButton />
          </Box>
          <Flex
            as="nav"
            aria-label="Main navigation"
            order={{ base: 2, md: 2 }}
            align="center"
            justify={{ base: "space-between", md: "center" }}
            width={{ base: "full", md: "auto" }}
            gap={{ base: 1, md: 2 }}
            ms={{ md: "auto" }}
          >
            <Link
              asChild
              minH="11"
              px="4"
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              color="fg.muted"
              _currentPage={{
                color: "teal.fg",
                bg: "teal.subtle",
                textDecoration: "none",
              }}
              _hover={{ textDecoration: "none", bg: "bg.subtle" }}
            >
              <NavLink to="/" end>
                Events
              </NavLink>
            </Link>
            <Link
              asChild
              minH="11"
              px="4"
              borderRadius="full"
              fontSize="sm"
              fontWeight="600"
              color="fg.muted"
              _currentPage={{
                color: "teal.fg",
                bg: "teal.subtle",
                textDecoration: "none",
              }}
              _hover={{ textDecoration: "none", bg: "bg.subtle" }}
            >
              <NavLink to="/about">About</NavLink>
            </Link>
            <Button
              colorPalette="teal"
              borderRadius="full"
              onClick={onAdd}
              disabled={!canAdd}
              minH="11"
              px={{ base: 4, md: 5 }}
              ms={{ md: 2 }}
            >
              <LuPlus aria-hidden="true" />
              Add event
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
