import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEventRecord,
  deleteEventRecord,
  loadEventData,
  updateEventRecord,
} from "../api/events";
import { EventsContext } from "./EventsContext";

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const activeLoad = useRef(null);
  const mutationVersion = useRef(0);

  const reload = useCallback(async function loadLatestData() {
    activeLoad.current?.abort();
    const controller = new AbortController();
    const versionWhenRequested = mutationVersion.current;
    activeLoad.current = controller;
    setLoading(true);
    setError(null);

    try {
      const data = await loadEventData({ signal: controller.signal });
      if (!controller.signal.aborted) {
        // A read started before a successful edit may contain the old event.
        if (versionWhenRequested !== mutationVersion.current)
          return loadLatestData();
        setEvents(data.events);
        setCategories(data.categories);
        setUsers(data.users);
      }
    } catch (loadError) {
      if (!controller.signal.aborted) setError(loadError.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    return () => activeLoad.current?.abort();
  }, [reload]);

  const createEvent = useCallback(async (values) => {
    const savedEvent = await createEventRecord(values);
    mutationVersion.current += 1;
    setEvents((currentEvents) => [...currentEvents, savedEvent]);
    return savedEvent;
  }, []);

  const updateEvent = useCallback(async (id, changes) => {
    const savedEvent = await updateEventRecord(id, changes);
    mutationVersion.current += 1;
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        String(event.id) === String(id) ? savedEvent : event,
      ),
    );
    return savedEvent;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await deleteEventRecord(id);
    mutationVersion.current += 1;
    setEvents((currentEvents) =>
      currentEvents.filter((event) => String(event.id) !== String(id)),
    );
  }, []);

  return (
    <EventsContext.Provider
      value={{
        events,
        categories,
        users,
        loading,
        error,
        reload,
        createEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}
