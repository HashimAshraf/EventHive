
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/useApp";

function FeedbackForm({ eventId, existing }) {
  const { addFeedback } = useApp();

  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setSaving(true);

    const result = await addFeedback(
      eventId,
      Number(rating),
      comment,
    );

    setSaving(false);

    setStatus(
      result ?? "Feedback saved successfully.",
    );
  }

  return (
    <form className="stack" onSubmit={submit}>
      <h3>{existing ? "Edit your feedback" : "Leave feedback"}</h3>

      <label>
        Rating
        <select
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setStatus("");
          }}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} / 5
            </option>
          ))}
        </select>
      </label>

      <label>
        Comment
        <textarea
          rows="3"
          maxLength="1000"
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            setStatus("");
          }}
          placeholder="Share your experience..."
        />
      </label>

      <div className="row">
        <button className="btn" disabled={saving}>
          {saving ? "Saving..." : "Save feedback"}
        </button>

        {status && (
          <span role="status">{status}</span>
        )}
      </div>
    </form>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const app = useApp();

  const event = app.events.find((item) => item.id === id);

  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  if (!event) {
    return (
      <div className="panel stack">
        <h1>Event not found</h1>
        <p className="muted">
          This event may have been removed or is no longer available.
        </p>
        <Link to="/events" className="btn">
          Browse events
        </Link>
      </div>
    );
  }

  const registration = app.registrations.find(
    (item) =>
      item.eventId === id &&
      item.userId === app.user?.id,
  );

  const past = app.isPast(event);
  const left = app.seatsLeft(event);

  const reviews = app.feedback.filter(
    (item) => item.eventId === id,
  );

  const averageRating = reviews.length
    ? (
        reviews.reduce(
          (total, item) => total + Number(item.rating),
          0,
        ) / reviews.length
      ).toFixed(1)
    : null;

  const eventStatus = past
    ? "Ended"
    : left <= 0
      ? "Fully booked"
      : "Upcoming";

  async function handleRegistration(action) {
    setMessage("");
    setProcessing(true);

    const result =
      action === "register"
        ? await app.registerForEvent(id)
        : await app.cancelRegistration(id);

    setProcessing(false);

    setMessage(
      result ??
        (action === "register"
          ? "You are successfully registered."
          : "Your registration has been cancelled."),
    );
  }

  return (
    <div className="stack">
      <Link to="/events">← All events</Link>

      <article className="panel stack">
        <div className="row">
          <span className="badge">{event.category}</span>

          <span
            className={`badge ${
              past || left <= 0 ? "full" : ""
            }`}
          >
            {eventStatus}
          </span>
        </div>

        <h1>{event.title}</h1>

        {event.poster && (
          <img
            className="detail-poster"
            src={event.poster}
            alt={`Poster for ${event.title}`}
          />
        )}

        <div className="stack">
          <h3>Event information</h3>
          <p className="muted">📅 Date: {event.date}</p>
          <p className="muted">📍 Venue: {event.venue}</p>
          <p className="muted">🏛️ Organized by: {event.club}</p>
          <p className="muted">
            👥 Capacity: {event.capacity} attendees
          </p>
          <p className="muted">
            🎟️ Availability:{" "}
            {past
              ? "Event ended"
              : `${left} seats remaining`}
          </p>
        </div>

        <div className="divider" />

        <h3>About this event</h3>
        <p className="description">{event.description}</p>

        {registration && (
          <span className="badge">
            {registration.attended
              ? "Attendance confirmed"
              : "You are registered"}
          </span>
        )}

        {!past && (
          <div className="row">
            {!app.user && (
              <Link
                className="btn"
                to="/login"
                state={{ returnTo: `/events/${id}` }}
              >
                Log in to register
              </Link>
            )}

            {app.user?.role === "student" &&
              (registration ? (
                <button
                  className="btn btn-ghost"
                  disabled={processing}
                  onClick={() =>
                    handleRegistration("cancel")
                  }
                >
                  {processing
                    ? "Processing..."
                    : "Cancel registration"}
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={processing || left <= 0}
                  onClick={() =>
                    handleRegistration("register")
                  }
                >
                  {processing
                    ? "Processing..."
                    : left <= 0
                      ? "Registration full"
                      : "Register now"}
                </button>
              ))}
          </div>
        )}

        {message && (
          <p role="status">{message}</p>
        )}
      </article>

      <section className="panel stack">
        <h2>Event feedback</h2>

        {reviews.length > 0 && (
          <div className="row">
            <strong>⭐ {averageRating} / 5</strong>
            <span className="muted">
              Based on {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        )}

        {app.user?.role === "student" &&
          past &&
          registration?.attended && (
            <FeedbackForm
              key={`${id}-${app.user.id}`}
              eventId={id}
              existing={reviews.find(
                (item) => item.userId === app.user.id,
              )}
            />
          )}

        {reviews.length ? (
          <ul className="list">
            {reviews.map((item) => (
              <li key={item.id}>
                <strong>
                  {item.userName || "Student"}
                </strong>
                {" · "}⭐ {item.rating}/5

                {item.comment && (
                  <p className="description">
                    {item.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No feedback yet. Be the first to share your experience.
          </p>
        )}
      </section>
    </div>
  );
}
