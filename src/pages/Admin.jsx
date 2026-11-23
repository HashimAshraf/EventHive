
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/useApp";

export default function Admin() {
  const {
    users,
    events,
    registrations,
    approveOrganizer,
    removeUser,
    deleteEvent,
  } = useApp();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  const pending = users.filter(
    (user) => user.role === "organizer" && !user.approved,
  );

  const students = users.filter(
    (user) => user.role === "student",
  ).length;

  const organizers = users.filter(
    (user) => user.role === "organizer" && user.approved,
  ).length;

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((user) =>
      [user.name, user.email, user.role, user.club]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [users, userSearch]);

  const filteredEvents = useMemo(() => {
    const query = eventSearch.trim().toLowerCase();

    return events.filter((event) =>
      [event.title, event.club, event.venue]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [events, eventSearch]);

  async function handleApprove(user) {
    setError("");
    setSuccess("");

    const result = await approveOrganizer(user.id);

    if (result) {
      setError(result);
    } else {
      setSuccess(`${user.name} has been approved as an organizer.`);
    }
  }

  async function handleRemoveUser(user) {
    if (
      !window.confirm(
        `Remove ${user.name} and their associated records?`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const result = await removeUser(user.id);

    if (result) {
      setError(result);
    } else {
      setSuccess(`${user.name} has been removed.`);
    }
  }

  async function handleDeleteEvent(event) {
    if (
      !window.confirm(
        `Remove "${event.title}" and its registrations?`,
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    const result = await deleteEvent(event.id);

    if (result) {
      setError(result);
    } else {
      setSuccess(`${event.title} has been removed.`);
    }
  }

  return (
    <div className="stack">
      <header className="hero">
        <h1>Admin panel</h1>
        <p>
          Review organizer requests and manage campus content.
        </p>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="panel" role="status">
          {success}
        </p>
      )}

      <section className="grid">
        <article className="panel stack">
          <span className="muted">Total users</span>
          <h2>{users.length}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Students</span>
          <h2>{students}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Approved organizers</span>
          <h2>{organizers}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Pending approvals</span>
          <h2>{pending.length}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Total events</span>
          <h2>{events.length}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Registrations</span>
          <h2>{registrations.length}</h2>
        </article>
      </section>

      <section className="stack">
        <h2>
          Organizer approvals{" "}
          <span className="badge">
            {pending.length} pending
          </span>
        </h2>

        {pending.length ? (
          pending.map((user) => (
            <article className="panel split" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <p className="muted">
                  {user.club} · {user.email}
                </p>
                <span className="badge">
                  Awaiting approval
                </span>
              </div>

              <button
                className="btn btn-sm"
                onClick={() => handleApprove(user)}
              >
                Approve organizer
              </button>
            </article>
          ))
        ) : (
          <p className="panel muted">
            No organizer requests waiting for review.
          </p>
        )}
      </section>

      <section className="stack">
        <div className="split">
          <h2>Manage users</h2>
          <span className="muted">
            {filteredUsers.length} users
          </span>
        </div>

        <input
          type="search"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search users by name, email, role or club..."
          aria-label="Search users"
        />

        {filteredUsers.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>

                    <td className="role">
                      {user.role}
                      {!user.approved && " (pending)"}
                    </td>

                    <td>
                      {user.role === "admin" ? (
                        "—"
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          aria-label={`Remove ${user.name}`}
                          onClick={() => handleRemoveUser(user)}
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel muted">
            No users match your search.
          </p>
        )}
      </section>

      <section className="stack">
        <div className="split">
          <h2>Manage events</h2>
          <span className="muted">
            {filteredEvents.length} events
          </span>
        </div>

        <input
          type="search"
          value={eventSearch}
          onChange={(e) => setEventSearch(e.target.value)}
          placeholder="Search events by title, club or venue..."
          aria-label="Search events"
        />

        {filteredEvents.length ? (
          filteredEvents.map((event) => (
            <article className="panel split" key={event.id}>
              <div>
                <strong>
                  <Link to={`/events/${event.id}`}>
                    {event.title}
                  </Link>
                </strong>

                <p className="muted">
                  {event.club} · {event.date}
                </p>

                <p className="muted">
                  {
                    registrations.filter(
                      (item) => item.eventId === event.id,
                    ).length
                  }{" "}
                  registrations
                </p>
              </div>

              <button
                className="btn btn-danger btn-sm"
                aria-label={`Remove ${event.title}`}
                onClick={() => handleDeleteEvent(event)}
              >
                Remove event
              </button>
            </article>
          ))
        ) : (
          <p className="panel muted">
            No events match your search.
          </p>
        )}
      </section>
    </div>
  );
}
