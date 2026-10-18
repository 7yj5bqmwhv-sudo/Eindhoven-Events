import { useEffect, useId, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  Fieldset,
  Input,
  NativeSelect,
  Portal,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import {
  buildEventPayload,
  createEventDraft,
  validateEventForm,
} from "../utils/eventForm";
import {
  IMAGE_FILE_ACCEPT,
  isUploadedImage,
  prepareImageUpload,
} from "../utils/imageUpload";
import { EventImage } from "./EventImage";

function TextField({
  name,
  label,
  values,
  errors,
  update,
  multiline,
  ...props
}) {
  const Control = multiline ? Textarea : Input;
  return (
    <Field.Root required invalid={Boolean(errors[name])} minW="0">
      <Field.Label>
        {label}
        <Field.RequiredIndicator />
      </Field.Label>
      <Control
        required
        name={name}
        value={values[name]}
        onChange={(e) => update(name, e.target.value)}
        bg="bg"
        minH="11"
        fontSize="md"
        minW="0"
        {...props}
      />
      <Field.ErrorText>{errors[name]}</Field.ErrorText>
    </Field.Root>
  );
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  categories = [],
  users = [],
  onSubmit,
}) {
  const [values, setValues] = useState(() => createEventDraft(event));
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [pending, setPending] = useState(false);
  const [imageDrafts, setImageDrafts] = useState(() =>
    isUploadedImage(event?.image)
      ? { url: "", upload: event.image }
      : { url: event?.image ?? "", upload: "" },
  );
  const [imageMode, setImageMode] = useState(() =>
    imageDrafts.upload ? "upload" : "url",
  );
  const [processingImage, setProcessingImage] = useState(false);
  const [imageFailure, setImageFailure] = useState("");
  const submitting = useRef(false);
  const activeUpload = useRef(null);
  const processingImageRef = useRef(false);
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const formId = useId();

  useEffect(() => () => {
    activeUpload.current?.abort();
    activeUpload.current = null;
    processingImageRef.current = false;
  }, []);

  const cancelImageUpload = () => {
    activeUpload.current?.abort();
    activeUpload.current = null;
    processingImageRef.current = false;
    setProcessingImage(false);
  };
  const changeOpen = (details) => {
    if (!submitting.current) {
      if (!details.open) cancelImageUpload();
      onOpenChange(details);
    }
  };
  const update = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFailure("");
  };
  const changeImageMode = (mode) => {
    if (mode === imageMode || submitting.current) return;
    cancelImageUpload();
    setImageMode(mode);
    setImageFailure("");
    update("image", imageDrafts[mode]);
  };
  const changeImageUrl = (_name, value) => {
    setImageDrafts((current) => ({ ...current, url: value }));
    update("image", value);
  };
  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || submitting.current) return;
    activeUpload.current?.abort();
    const controller = new AbortController();
    activeUpload.current = controller;
    processingImageRef.current = true;
    setProcessingImage(true);
    setImageFailure("");
    setErrors((current) => ({ ...current, image: undefined }));
    setFailure("");
    try {
      const image = await prepareImageUpload(file, { signal: controller.signal });
      if (activeUpload.current !== controller || controller.signal.aborted) return;
      setImageDrafts((current) => ({ ...current, upload: image }));
      update("image", image);
    } catch (error) {
      if (activeUpload.current !== controller || controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : "This picture could not be opened. Try another file.";
      setImageFailure(`${message}${imageDrafts.upload ? " Your previous picture has been kept." : ""}`);
    } finally {
      if (activeUpload.current === controller) {
        activeUpload.current = null;
        processingImageRef.current = false;
        setProcessingImage(false);
      }
    }
  };
  const toggleCategory = (id, checked) => {
    const value = String(id);
    update(
      "categoryIds",
      checked
        ? [...new Set([...values.categoryIds, value])]
        : values.categoryIds.filter((item) => item !== value),
    );
  };
  const submit = async (e) => {
    e.preventDefault();
    if (submitting.current || processingImageRef.current) return;
    const nextErrors = validateEventForm(values, categories, users);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstName = Object.keys(nextErrors)[0];
      const control = formRef.current?.elements.namedItem(firstName);
      (control?.focus ? control : control?.[0])?.focus();
      return;
    }
    submitting.current = true;
    setPending(true);
    setFailure("");
    try {
      await onSubmit(buildEventPayload(values, categories, users));
      onOpenChange({ open: false });
    } catch (error) {
      setFailure(
        error instanceof Error
          ? error.message
          : "The event could not be saved. Please try again.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={changeOpen}
      size="lg"
      placement="center"
      scrollBehavior="inside"
      initialFocusEl={() => titleRef.current}
      closeOnEscape={!pending}
      closeOnInteractOutside={false}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={{ base: 3, sm: 6 }}>
          <Dialog.Content
            bg="bg.panel"
            borderRadius="2xl"
            maxH="calc(100dvh - 24px)"
            minW="0"
            colorPalette="teal"
          >
            <Dialog.Header px={{ base: 5, sm: 7 }} pt="6" pb="4" pe="14">
              <Dialog.Title fontSize="2xl">
                {event ? "Edit event" : "Add an event"}
              </Dialog.Title>
              <Dialog.Description color="fg.muted" mt="2">
                {event
                  ? "Update the details and save your changes."
                  : "Make something worth getting together for."}{" "}
                All event details are required. Add a picture using either option below.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body px={{ base: 5, sm: 7 }} pb="6">
              <Box
                as="form"
                id={formId}
                ref={formRef}
                noValidate
                onSubmit={submit}
                aria-busy={pending || processingImage}
              >
                <Fieldset.Root disabled={pending} gap="5" minW="0">
                  <TextField
                    name="title"
                    label="Event title"
                    values={values}
                    errors={errors}
                    update={update}
                    ref={titleRef}
                    autoComplete="off"
                    placeholder="A good name brings people in"
                  />
                  <TextField
                    name="description"
                    label="Description"
                    values={values}
                    errors={errors}
                    update={update}
                    multiline
                    rows={4}
                    resize="vertical"
                    placeholder="What can people look forward to?"
                  />
                  <Fieldset.Root gap="3" minW="0">
                    <Fieldset.Legend fontWeight="medium">Event picture</Fieldset.Legend>
                    <Stack direction={{ base: "column", sm: "row" }} gap="2" role="group" aria-label="Picture source">
                      <Button type="button" variant={imageMode === "url" ? "solid" : "outline"} aria-pressed={imageMode === "url"} onClick={() => changeImageMode("url")} minH="11">Image URL</Button>
                      <Button type="button" variant={imageMode === "upload" ? "solid" : "outline"} aria-pressed={imageMode === "upload"} onClick={() => changeImageMode("upload")} minH="11">Upload from computer</Button>
                    </Stack>
                    {imageMode === "url" ? (
                      <TextField
                        name="image"
                        label="Image URL"
                        values={values}
                        errors={errors}
                        update={changeImageUrl}
                        type="url"
                        placeholder="https://example.com/event.jpg"
                      />
                    ) : (
                      <Stack gap="3" minW="0">
                        {imageDrafts.upload && <EventImage src={imageDrafts.upload} title="Selected event picture" imageAlt="Selected event picture preview" imageFit="contain" h="40" borderRadius="lg" />}
                        <Field.Root required={!imageDrafts.upload} invalid={Boolean(imageFailure || errors.image)} minW="0">
                          <Field.Label>{imageDrafts.upload ? "Replace picture (optional)" : "Choose a picture"}<Field.RequiredIndicator /></Field.Label>
                          <Input type="file" name="image" accept={IMAGE_FILE_ACCEPT} required={!imageDrafts.upload} onChange={uploadImage} bg="bg" minW="0" h="auto" minH="11" py="2" fontSize="md" />
                          <Field.HelperText>JPG, PNG or WebP, up to 10 MB. {imageDrafts.upload ? "Your current picture will be kept unless you choose another." : "Choose one picture from your computer."}</Field.HelperText>
                          <Field.ErrorText role="alert">{imageFailure || errors.image}</Field.ErrorText>
                        </Field.Root>
                        {processingImage && <Text role="status" fontSize="sm" color="fg.muted">Preparing your picture…</Text>}
                      </Stack>
                    )}
                  </Fieldset.Root>
                  <TextField
                    name="location"
                    label="Location"
                    values={values}
                    errors={errors}
                    update={update}
                    placeholder="Venue and address"
                  />
                  <Box>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                      <TextField
                        name="startTime"
                        label="Starts"
                        values={values}
                        errors={errors}
                        update={update}
                        type="datetime-local"
                      />
                      <TextField
                        name="endTime"
                        label="Ends"
                        values={values}
                        errors={errors}
                        update={update}
                        type="datetime-local"
                        min={values.startTime || undefined}
                      />
                    </SimpleGrid>
                    <Text fontSize="sm" color="fg.muted" mt="2">
                      Dates and times use your device’s local time.
                    </Text>
                  </Box>
                  <Field.Root required invalid={Boolean(errors.createdBy)}>
                    <Field.Label>
                      Organiser
                      <Field.RequiredIndicator />
                    </Field.Label>
                    <NativeSelect.Root size="lg" bg="bg" minW="0">
                      <NativeSelect.Field
                        required
                        name="createdBy"
                        value={values.createdBy}
                        onChange={(e) => update("createdBy", e.target.value)}
                      >
                        <chakra.option value="">
                          Choose an organiser
                        </chakra.option>
                        {users.map((user) => (
                          <chakra.option key={user.id} value={String(user.id)}>
                            {user.name}
                          </chakra.option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.ErrorText>{errors.createdBy}</Field.ErrorText>
                  </Field.Root>
                  <Fieldset.Root
                    invalid={Boolean(errors.categoryIds)}
                    gap="3"
                    minW="0"
                  >
                    <Fieldset.Legend fontWeight="medium">
                      Categories (required; choose at least one)
                    </Fieldset.Legend>
                    <Stack direction="row" flexWrap="wrap" gap="3">
                      {categories.map((category) => (
                        <Checkbox.Root
                          key={category.id}
                          name="categoryIds"
                          value={String(category.id)}
                          checked={values.categoryIds.includes(
                            String(category.id),
                          )}
                          onCheckedChange={({ checked }) =>
                            toggleCategory(category.id, checked === true)
                          }
                          disabled={pending}
                          invalid={Boolean(errors.categoryIds)}
                          minH="11"
                          px="3"
                          py="2"
                          borderWidth="1px"
                          borderColor="border"
                          borderRadius="lg"
                          bg="bg"
                        >
                          <Checkbox.HiddenInput
                            required={values.categoryIds.length === 0}
                            aria-describedby={`${formId}-categories-error`}
                          />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Label textTransform="capitalize">
                            {category.name}
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                    <Fieldset.ErrorText id={`${formId}-categories-error`}>
                      {errors.categoryIds}
                    </Fieldset.ErrorText>
                  </Fieldset.Root>
                  {failure && (
                    <Box
                      role="alert"
                      bg="red.subtle"
                      color="red.fg"
                      p="4"
                      borderRadius="lg"
                    >
                      <Text fontWeight="semibold">
                        Could not save your event
                      </Text>
                      <Text mt="1">{failure}</Text>
                    </Box>
                  )}
                </Fieldset.Root>
              </Box>
            </Dialog.Body>
            <Dialog.Footer
              px={{ base: 5, sm: 7 }}
              py="5"
              borderTopWidth="1px"
              borderColor="border"
              gap="3"
              flexWrap="wrap"
            >
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => changeOpen({ open: false })}
                flex={{ base: 1, sm: "initial" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form={formId}
                disabled={processingImage}
                loading={pending}
                loadingText="Saving"
                flex={{ base: 1, sm: "initial" }}
              >
                {event ? "Save changes" : "Create event"}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                aria-label="Close event form"
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
