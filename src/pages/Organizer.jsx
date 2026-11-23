
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/useApp";

export default function Organizer() {
  const app = useApp();
  const [error, setError] = useState("");

  const events = app.events
    .filter((event) => event.organizerId === app.user.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const eventIds = new Set(events.map((event) => event.id));

  const registrations = app.registrations.filter((item) =>
    eventIds.has(item.eventId),
  );

  const totalRegistered = registrations.length;

  const totalAttended = registrations.filter(
    (item) => item.attended,
  ).length;

  const upcomingEvents = events.filter(
    (event) => !app.isPast(event),
  ).length;

  const completedEvents = events.filter(
    (event) => app.isPast(event),
  ).length;

  async function handleDelete(event) {
    if (
      !window.confirm(
        `Delete "${event.title}" and its registrations?`,
      )
    ) {
      return;
    }

    const problem = await app.deleteEvent(event.id);
    setError(problem ?? "");
  }

  return (
    <div className="stack">
      <header className="hero">
        <div className="split">
          <div>
            <h1>Organizer dashboard</h1>
            <p>{app.user.club}</p>
          </div>

          <Link className="btn" to="/organizer/new">
            Create event
          </Link>
        </div>
      </header>

      <section className="grid">
        <article className="panel stack">
          <span className="muted">Total events</span>
          <h2>{events.length}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Upcoming events</span>
          <h2>{upcomingEvents}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Total registrations</span>
          <h2>{totalRegistered}</h2>
        </article>

        <article className="panel stack">
          <span className="muted">Attendees recorded</span>
          <h2>{totalAttended}</h2>
        </article>
      </section>

      <section className="stack">
        <div className="split">
          <h2>Your events</h2>
          <span className="muted">
            {completedEvents} completed
          </span>
        </div>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {!events.length && (
          <div className="panel muted">
            <h3>No events created yet</h3>
            <p>
              Create your first event to start accepting registrations.
            </p>
            <Link className="btn" to="/organizer/new">
              Create your first event
            </Link>
          </div>
        )}

        {events.map((event) => {
          const registered = registrations.filter(
            (item) => item.eventId === event.id,
          ).length;

          const attended = registrations.filter(
            (item) =>
              item.eventId === event.id && item.attended,
          ).length;

          const past = app.isPast(event);
          const left = app.seatsLeft(event);

          const status = past
            ? "Ended"
            : left <= 0
              ? "Full"
              : "Upcoming";

          return (
            <article className="panel stack" key={event.id}>
              <div className="split">
                <div>
                  <h3>
                    <Link to={`/events/${event.id}`}>
                      {event.title}
                    </Link>
                  </h3>

                  <p className="muted">
                    {event.date} · {event.venue}
                  </p>

                  <div className="row">
                    <span
                      className={`badge ${
                        status === "Full" || past ? "full" : ""
                      }`}
                    >
                      {status}
                    </span>

                    <span className="muted">
                      {registered}/{event.capacity} registered
                    </span>
                  </div>

                  <p className="muted">
                    {attended} attendees recorded
                  </p>
                </div>

                <div className="row">
                  <Link
                    className="btn btn-ghost btn-sm"
                    to={`/organizer/${event.id}/attendees`}
                  >
                    Attendees
                  </Link>

                  <Link
                    className="btn btn-ghost btn-sm"
                    to={`/organizer/${event.id}/edit`}
                  >
                    Edit
                  </Link>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(event)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

function csvCell(value) {
  const text = String(value);

  const safe = /^[\s]*[=+\-@]/.test(text)
    ? "'" + text
    : text;

  return '"' + safe.replaceAll('"', '""') + '"';
}

function exportAttendees(eventId, attendees) {
  const rows = [
    ["Name", "Email", "Attendance"],
    ...attendees.map(({ person, attended }) => [
      person.name,
      person.email,
      attended ? "Attended" : "Not marked",
    ]),
  ];

  const blob = new Blob(
    [
      "\uFEFF",
      rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `eventhive-${eventId}-attendees.csv`;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Attendees() {
  const { id } = useParams();
  const app = useApp();
  const [error, setError] = useState("");

  const event = app.events.find(
    (item) =>
      item.id === id && item.organizerId === app.user.id,
  );

  if (!event) {
    return (
      <div className="panel">
        <h1>Event unavailable</h1>
        <Link to="/organizer">Back to dashboard</Link>
      </div>
    );
  }

  const attendees = app.registrations
    .filter((item) => item.eventId === id)
    .map((item) => ({
      ...item,
      person: {
        name: item.userName,
        email: item.userEmail,
      },
    }));

  const attendedCount = attendees.filter(
    (item) => item.attended,
  ).length;

  async function updateAttendance(registrationId, attended) {
    const problem = await app.markAttendance(
      registrationId,
      attended,
    );

    setError(problem ?? "");
  }

  return (
    <div className="stack">
      <Link to="/organizer">← Organizer dashboard</Link>

      <header className="hero split">
        <div>
          <h1>{event.title}</h1>
          <p>
            {attendees.length} registered · {attendedCount} attended
          </p>
        </div>

        <button
          className="btn"
          disabled={!attendees.length}
          onClick={() => exportAttendees(id, attendees)}
        >
          Export CSV
        </button>
      </header>

      <section className="stack">
        <h2>Attendees</h2>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {attendees.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Attendance</th>
                </tr>
              </thead>

              <tbody>
                {attendees.map((item) => (
                  <tr key={item.id}>
                    <td>{item.person.name}</td>
                    <td>{item.person.email}</td>

                    <td>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={item.attended}
                          disabled={event.date > app.today}
                          aria-label={`Mark ${item.person.name} as attended`}
                          onChange={(e) =>
                            updateAttendance(
                              item.id,
                              e.target.checked,
                            )
                          }
                        />
                        Attended
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel muted">
            No registrations yet.
          </p>
        )}

        {event.date > app.today && attendees.length > 0 && (
          <p className="muted">
            Attendance can be marked starting on the event date.
          </p>
        )}
      </section>
    </div>
  );
}
