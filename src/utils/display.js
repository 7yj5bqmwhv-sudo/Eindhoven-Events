export function categoryNames(event, categories) {
  return (event.categoryIds ?? []).map(
    (id) =>
      categories.find((category) => String(category.id) === String(id))?.name ??
      "Unlisted category",
  );
}
export function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}
export function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}
export function filterEvents(events, query, selectedCategories) {
  const normalized = query.trim().toLocaleLowerCase();
  return events.filter(
    (event) =>
      event.title.toLocaleLowerCase().includes(normalized) &&
      (!selectedCategories.length ||
        event.categoryIds.some((id) =>
          selectedCategories.includes(String(id)),
        )),
  );
}
