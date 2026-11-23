
import { useCallback, useEffect, useState } from "react";
import api from "../api";
import { AppContext } from "./useApp";

const today = new Date().toLocaleDateString("sv-SE");

const emptyDb = {
  users: [],
  events: [],
  registrations: [],
  feedback: [],
};

const getId = (item) =>
  String(item?._id ?? item?.id ?? (typeof item === "string" || typeof item === "number" ? item : ""));

const normalizeUser = (user) => ({
  id: getId(user),
  name: user.name,
  email: user.email,
  role: user.role,
  club: user.club ?? "",
  approved: user.approved,
});

const normalizeEvent = (event) => ({
  id: getId(event),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  venue: event.venue,
  capacity: event.capacity,
  registeredCount: event.registeredCount ?? 0,
  poster: event.poster
    ? event.poster.startsWith("http")
      ? event.poster
      : `http://localhost:5000${event.poster}`
    : "",
  organizerId: getId(event.organizer),
  organizerName:
    typeof event.organizer === "object"
      ? event.organizer?.name ?? ""
      : "",
  club: event.club,
});

const normalizeRegistration = (registration) => ({
  id: getId(registration),
  eventId: getId(registration.event),
  userId: getId(registration.student),
  userName:
    typeof registration.student === "object"
      ? registration.student?.name ?? ""
      : "",
  userEmail:
    typeof registration.student === "object"
      ? registration.student?.email ?? ""
      : "",
  attended: registration.attended,
});

const normalizeFeedback = (feedback) => ({
  id: getId(feedback),
  eventId: getId(feedback.event),
  userId: getId(feedback.student),
  userName:
    typeof feedback.student === "object"
      ? feedback.student?.name ?? ""
      : "",
  rating: feedback.rating,
  comment: feedback.comment,
});

export function AppProvider({ children }) {
  const [db, setDb] = useState(emptyDb);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isPast = (event) => event.date < today;

  const seatsLeft = (event) =>
    Math.max(
      0,
      Number(event.capacity) - Number(event.registeredCount ?? 0),
    );

  const refreshData = useCallback(async (activeUser) => {
  const eventsResponse = await api.get("/events");
  const events = eventsResponse.data.map(normalizeEvent);

  let users = [];
  let registrations = [];

  if (activeUser?.role === "student") {
    const response = await api.get("/registrations/mine");
    registrations = response.data.map(normalizeRegistration);
  }

  if (activeUser?.role === "organizer") {
    const response = await api.get("/registrations/organizer");
    registrations = response.data.map(normalizeRegistration);
  }

  if (activeUser?.role === "admin") {
    const [usersResponse, registrationsResponse] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/registrations"),
    ]);

    users = usersResponse.data.map(normalizeUser);
    registrations = registrationsResponse.data.map(normalizeRegistration);
  }

  const feedbackResponses = await Promise.all(
    events.map((event) =>
      api.get(`/feedback/event/${event.id}`).catch(() => ({
        data: [],
      })),
    ),
  );

  const feedback = feedbackResponses.flatMap((response) =>
    response.data.map(normalizeFeedback),
  );

  setDb({
    users,
    events,
    registrations,
    feedback,
  });
}, []);

useEffect(() => {
  async function restoreSession() {
    const token = localStorage.getItem("cc_token");

    if (!token) {
      try {
        await refreshData(null);
      } catch (error) {
        console.error("Could not load public events:", error);
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    try {
      const response = await api.get("/auth/me");
      const activeUser = normalizeUser(response.data.user);

      setUser(activeUser);
      await refreshData(activeUser);
    } catch {
      localStorage.removeItem("cc_token");
      localStorage.removeItem("cc_user");
      setUser(null);

      try {
        await refreshData(null);
      } catch (error) {
        console.error("Could not load public events:", error);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  restoreSession();
}, [refreshData]);
  async function login(email, password) {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("cc_token", response.data.token);

      const activeUser = normalizeUser(response.data.user);

      localStorage.setItem("cc_user", activeUser.id);
      setUser(activeUser);

      await refreshData(activeUser);

      return { user: activeUser };
    } catch (error) {
      return {
        error:
          error.response?.data?.message ??
          "Could not log in. Please try again.",
      };
    }
  }

  async function signup({ name, email, password, role, club }) {
    try {
      await api.post("/auth/signup", {
        name,
        email,
        password,
        role,
        club,
      });

      if (role === "organizer") {
        return "Account created. Your account is waiting for admin approval.";
      }

      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not create your account. Please try again."
      );
    }
  }

  function logout() {
    localStorage.removeItem("cc_token");
    localStorage.removeItem("cc_user");
    setUser(null);
    setDb((currentDb) => ({
      ...currentDb,
      users: [],
      registrations: [],
    }));

    refreshData(null).catch((error) => {
      console.error("Could not refresh public events:", error);
    });
  }

  async function registerForEvent(eventId) {
    if (user?.role !== "student") {
      return "Log in as a student to register.";
    }

    try {
      await api.post(`/registrations/${eventId}`);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not register for this event."
      );
    }
  }

  async function cancelRegistration(eventId) {
    try {
      await api.delete(`/registrations/${eventId}`);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not cancel this registration."
      );
    }
  }

  async function markAttendance(regId, attended) {
    try {
      await api.patch(`/registrations/${regId}/attendance`, {
        attended,
      });

      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not update attendance."
      );
    }
  }

  async function addFeedback(eventId, rating, comment) {
    try {
      await api.post(`/feedback/event/${eventId}`, {
        rating,
        comment,
      });

      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not save feedback."
      );
    }
  }

  async function createEvent(data) {
    if (user?.role !== "organizer") {
      return "Only organizers can publish events.";
    }

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "poster") {
          if (value instanceof File) {
            formData.append("poster", value);
          }
        } else {
          formData.append(key, value);
        }
      });

      await api.post("/events", formData);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not create the event."
      );
    }
  }

  async function updateEvent(id, data) {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "poster") {
          if (value instanceof File) {
            formData.append("poster", value);
          }
        } else {
          formData.append(key, value);
        }
      });

      await api.put(`/events/${id}`, formData);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not update the event."
      );
    }
  }

  async function deleteEvent(id) {
    try {
      await api.delete(`/events/${id}`);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not delete the event."
      );
    }
  }

  async function approveOrganizer(id) {
    try {
      await api.patch(`/admin/users/${id}/approve`);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not approve this organizer."
      );
    }
  }

  async function removeUser(id) {
    try {
      await api.delete(`/admin/users/${id}`);
      await refreshData(user);
      return null;
    } catch (error) {
      return (
        error.response?.data?.message ??
        "Could not remove this user."
      );
    }
  }

 const value = {
    ...db,
    user,
    authLoading,
    today,
    isPast,
    seatsLeft,
    login,
    signup,
    logout,
    registerForEvent,
    cancelRegistration,
    markAttendance,
    addFeedback,
    createEvent,
    updateEvent,
    deleteEvent,
    approveOrganizer,
    removeUser,
    refreshData: () => refreshData(user),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
