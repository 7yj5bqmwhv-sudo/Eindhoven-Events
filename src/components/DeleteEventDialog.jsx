import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Portal,
  Text,
} from "@chakra-ui/react";

export function DeleteEventDialog({ open, onOpenChange, event, onConfirm }) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const cancelRef = useRef(null);
  const submitting = useRef(false);

  useEffect(() => {
    if (open) setFailure("");
  }, [open]);

  const changeOpen = (details) => {
    if (!submitting.current) onOpenChange(details);
  };
  const confirm = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setFailure("");
    try {
      await onConfirm();
      onOpenChange({ open: false });
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "The event could not be deleted. Please try again.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  return (
    <Dialog.Root
      role="alertdialog"
      open={open}
      onOpenChange={changeOpen}
      placement="center"
      size="sm"
      initialFocusEl={() => cancelRef.current}
      closeOnEscape={!pending}
      closeOnInteractOutside={false}
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="3">
          <Dialog.Content
            bg="bg.panel"
            borderRadius="2xl"
            maxH="calc(100dvh - 24px)"
            minW="0"
            aria-busy={pending}
          >
            <Dialog.Header pe="14">
              <Dialog.Title fontSize="xl">Delete this event?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>
                “{event?.title ?? "This event"}” will be permanently removed.
                This cannot be undone.
              </Dialog.Description>
              {failure && (
                <Box
                  role="alert"
                  bg="red.subtle"
                  color="red.fg"
                  p="4"
                  borderRadius="lg"
                  mt="5"
                >
                  <Text>{failure}</Text>
                </Box>
              )}
            </Dialog.Body>
            <Dialog.Footer flexWrap="wrap" gap="3">
              <Button
                ref={cancelRef}
                variant="outline"
                disabled={pending}
                onClick={() => changeOpen({ open: false })}
                flex={{ base: 1, sm: "initial" }}
              >
                Keep event
              </Button>
              <Button
                colorPalette="red"
                loading={pending}
                loadingText="Deleting"
                onClick={confirm}
                flex={{ base: 1, sm: "initial" }}
              >
                Delete event
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                aria-label="Close delete confirmation"
                size="sm"
                disabled={pending}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
