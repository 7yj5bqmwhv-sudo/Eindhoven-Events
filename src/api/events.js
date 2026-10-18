const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

function isId(value) {
  return (
    (typeof value === "string" && value.trim() !== "") ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function hasId(record) {
  return (
    record &&
    typeof record === "object" &&
    !Array.isArray(record) &&
    isId(record.id)
  );
}

function isEvent(record) {
  return (
    hasId(record) &&
    ["title", "description", "image", "location", "startTime", "endTime"].every(
      (field) => typeof record[field] === "string",
    ) &&
    isId(record.createdBy) &&
    Array.isArray(record.categoryIds) &&
    record.categoryIds.every(isId)
  );
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("The event service is unavailable. Please try again.");
  }

  if (!response.ok) {
    if (response.status === 404 && path.startsWith("/events/")) {
      throw new Error(
        "This event could not be found. It may have been deleted.",
      );
    }
    throw new Error(
      `The request could not be completed (${response.status}). Please try again.`,
    );
  }

  // JSON Server may return an empty response after a successful deletion.
  if (method === "DELETE" || response.status === 204) return undefined;

  try {
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "The event service returned an unreadable response. Please try again.",
    );
  }
}

function checkCollection(records, name, isValid) {
  if (!Array.isArray(records) || !records.every(isValid)) {
    throw new Error(
      `The event service returned invalid ${name}. Please try again.`,
    );
  }
  return records;
}

function checkSavedEvent(record, expectedId) {
  if (
    !isEvent(record) ||
    (expectedId !== undefined && String(record.id) !== String(expectedId))
  ) {
    throw new Error(
      "The event service did not confirm the saved event. Reload the list before trying again.",
    );
  }
  return record;
}

export async function loadEventData({ signal } = {}) {
  const [events, categories, users] = await Promise.all([
    request("/events", { signal }),
    request("/categories", { signal }),
    request("/users", { signal }),
  ]);

  return {
    events: checkCollection(events, "events", isEvent),
    categories: checkCollection(
      categories,
      "categories",
      (record) => hasId(record) && typeof record.name === "string",
    ),
    users: checkCollection(
      users,
      "users",
      (record) =>
        hasId(record) &&
        typeof record.name === "string" &&
        typeof record.image === "string",
    ),
  };
}

export async function createEventRecord(values) {
  return checkSavedEvent(
    await request("/events", { method: "POST", body: values }),
  );
}

export async function updateEventRecord(id, changes) {
  return checkSavedEvent(
    await request(`/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    }),
    id,
  );
}

export async function deleteEventRecord(id) {
  await request(`/events/${encodeURIComponent(id)}`, { method: "DELETE" });
}
