import { useState } from "react";
import { Box, Flex, Image, Text } from "@chakra-ui/react";
import { LuImage } from "react-icons/lu";
import { imageLocalMap } from "../utils/imageAssets";
export function EventImage({ src, title, imageAlt, imageFit = "cover", priority = false, ...props }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) {
    return (
      <Flex
        w="full"
        minW="0"
        bg="bg.muted"
        align="center"
        justify="center"
        direction="column"
        gap="3"
        role="img"
        aria-label={`${title}, image unavailable`}
        {...props}
      >
        <LuImage size={32} />
        <Text fontSize="sm">Image unavailable</Text>
      </Flex>
    );
  }
  return (
    <Box position="relative" w="full" minW="0" overflow="hidden" {...props}>
      <Image
        src={imageLocalMap[src] ?? src}
        alt={imageAlt || title}
        position="absolute"
        inset="0"
        display="block"
        w="full"
        h="full"
        objectFit={imageFit === "contain" ? "contain" : "cover"}
        bg={imageFit === "contain" ? "white" : undefined}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onError={() => setFailedSrc(src)}
      />
    </Box>
  );
}
