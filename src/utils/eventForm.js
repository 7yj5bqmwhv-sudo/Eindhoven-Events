import { isUploadedImage } from "./imageUpload";

export function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createEventDraft(event) {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    image: event?.image ?? "",
    location: event?.location ?? "",
    startTime: toLocalInput(event?.startTime),
    endTime: toLocalInput(event?.endTime),
    createdBy: event?.createdBy == null ? "" : String(event.createdBy),
    categoryIds: (event?.categoryIds ?? []).map(String),
  };
}

function validLocalTime(value) {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
    toLocalInput(value) === value
  );
}

export function validateEventForm(values, categories = [], users = []) {
  const errors = {};
  for (const [name, label] of [
    ["title", "title"],
    ["description", "description"],
    ["location", "location"],
  ]) {
    if (!String(values[name] ?? "").trim())
      errors[name] = `Enter an event ${label}.`;
  }
  try {
    const image = new URL(String(values.image ?? "").trim());
    if (!["http:", "https:"].includes(image.protocol) && !isUploadedImage(values.image.trim()))
      throw new Error("protocol");
  } catch {
    errors.image =
      "Choose a picture or enter a complete image URL beginning with https:// or http://.";
  }
  if (!validLocalTime(values.startTime ?? ""))
    errors.startTime = "Choose a valid start date and time.";
  if (!validLocalTime(values.endTime ?? ""))
    errors.endTime = "Choose a valid end date and time.";
  if (
    !errors.startTime &&
    !errors.endTime &&
    new Date(values.endTime) <= new Date(values.startTime)
  ) {
    errors.endTime = "The end must be after the start.";
  }
  if (!users.some((user) => String(user.id) === String(values.createdBy))) {
    errors.createdBy = "Choose an organiser from the list.";
  }
  const selected = Array.isArray(values.categoryIds) ? values.categoryIds : [];
  if (
    !selected.length ||
    selected.some(
      (id) =>
        !categories.some((category) => String(category.id) === String(id)),
    )
  ) {
    errors.categoryIds = "Choose at least one of the available categories.";
  }
  return errors;
}

export function buildEventPayload(values, categories, users) {
  const errors = validateEventForm(values, categories, users);
  if (Object.keys(errors).length) {
    throw new Error("Please complete the highlighted event details.");
  }
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    image: values.image.trim(),
    location: values.location.trim(),
    startTime: new Date(values.startTime).toISOString(),
    endTime: new Date(values.endTime).toISOString(),
    createdBy: users.find(
      (user) => String(user.id) === String(values.createdBy),
    ).id,
    categoryIds: [...new Set(values.categoryIds.map(String))].map(
      (id) => categories.find((category) => String(category.id) === id).id,
    ),
  };
}
