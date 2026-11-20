import { Link } from "react-router-dom";
import { useApp } from "../context/useApp";
import EventCard from "../components/EventCard";

export default function MyEvents() {
  const { events, registrations, user, isPast } = useApp();

  const mine = registrations.filter((item) => item.userId === user?.id);

  const registeredEvents = mine
    .map((registration) => ({
      event: events.find((event) => event.id === registration.eventId),
      registration,
    }))
    .filter((item) => item.event);

  const upcoming = registeredEvents
    .filter(({ event }) => !isPast(event))
    .sort((a, b) => a.event.date.localeCompare(b.event.date));

  const completed = registeredEvents
    .filter(({ event }) => isPast(event))
    .sort((a, b) => b.event.date.localeCompare(a.event.date));

  const attended = completed.filter(
    ({ registration }) => registration.attended,
  );

  const missed = completed.filter(({ registration }) => !registration.attended);

  return (
    <div className="stack">
      <div className="hero">
        <h1>My events</h1>
        <p>
          Manage your registrations, track your attendance, and revisit events
          you attended.
        </p>
      </div>

      <section className="grid">
        <div className="panel stack">
          <span className="muted">Total registrations</span>
          <h2>{mine.length}</h2>
        </div>

        <div className="panel stack">
          <span className="muted">Upcoming events</span>
          <h2>{upcoming.length}</h2>
        </div>

        <div className="panel stack">
          <span className="muted">Events attended</span>
          <h2>{attended.length}</h2>
        </div>

        <div className="panel stack">
          <span className="muted">Attendance rate</span>
          <h2>
            {completed.length
              ? `${Math.round((attended.length / completed.length) * 100)}%`
              : "—"}
          </h2>
        </div>
      </section>

      <section className="stack">
        <h2>Upcoming registrations</h2>

        {upcoming.length ? (
          <div className="grid">
            {upcoming.map(({ event }) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="panel">
            <h3>No upcoming registrations</h3>
            <p className="muted">
              You haven't registered for any upcoming events yet.
            </p>
            <Link to="/events" className="btn">
              Browse events
            </Link>
          </div>
        )}
      </section>

      <section className="stack">
        <h2>Past events attended</h2>

        {attended.length ? (
          <div className="grid">
            {attended.map(({ event }) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="panel muted">
            No attended events yet. Events will appear here after an organizer
            records your attendance.
          </div>
        )}
      </section>

      {missed.length > 0 && (
        <section className="stack">
          <h2>Other completed registrations</h2>
          <p className="muted">
            These events have ended, but your attendance was not recorded.
          </p>

          <div className="grid">
            {missed.map(({ event }) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
