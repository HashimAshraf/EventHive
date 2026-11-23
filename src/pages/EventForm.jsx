
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/useApp";
import { catColor } from "../data/mockData";

const empty = {
  title: "",
  description: "",
  category: "Tech",
  date: "",
  venue: "",
  capacity: "",
  poster: "",
};

export default function EventForm() {
  const { id } = useParams();
  const { events, user } = useApp();

  const event = events.find(
    (item) => item.id === id && item.organizerId === user.id,
  );

  if (id && !event) {
    return (
      <div className="panel">
        <h1>Event unavailable</h1>
        <Link to="/organizer">Back to dashboard</Link>
      </div>
    );
  }

  return <Editor key={id ?? "new"} event={event} />;
}

function Editor({ event }) {
  const { createEvent, updateEvent, registrations, today } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState(() =>
    event ? { ...event } : empty,
  );
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(
    event?.poster ?? "",
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const upload = useRef(null);

  const change = (field) => (e) =>
    setForm((current) => ({
      ...current,
      [field]: e.target.value,
    }));

  const count = event
    ? registrations.filter((item) => item.eventId === event.id).length
    : 0;

  useEffect(() => {
    if (posterPreview.startsWith("blob:")) {
      return () => URL.revokeObjectURL(posterPreview);
    }
  }, [posterPreview]);

  function readPoster(e) {
    const file = e.target.files[0];

    if (!file) return;

    setError("");

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 512 * 1024
    ) {
      e.target.value = "";
      setError("Choose a JPEG, PNG, or WebP image up to 512 KB.");
      return;
    }

    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  function removeSelectedPoster() {
    setPosterFile(null);
    setPosterPreview(event?.poster ?? "");

    if (upload.current) {
      upload.current.value = "";
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    const {
      title,
      description,
      category,
      date,
      venue,
      capacity,
    } = form;

    const data = {
      title: title.trim(),
      description: description.trim(),
      category,
      date,
      venue: venue.trim(),
      capacity: Number(capacity),
      poster: posterFile,
    };

    if (!data.title || !data.description || !data.venue || !date) {
      setError("Complete all required event details.");
      return;
    }

    if (
      !Number.isInteger(data.capacity) ||
      data.capacity < Math.max(count, 1)
    ) {
      setError(`Capacity must be at least ${Math.max(count, 1)}.`);
      return;
    }

    setSaving(true);

    const problem = event
      ? await updateEvent(event.id, data)
      : await createEvent(data);

    setSaving(false);

    if (problem) {
      setError(problem);
      return;
    }

    navigate("/organizer");
  }

  return (
    <>
      <Link to="/organizer">← Organizer dashboard</Link>

      <form className="form wide-form" onSubmit={submit}>
        <h1>{event ? "Edit event" : "Create event"}</h1>

        <label>
          Event title
          <input
            required
            maxLength="100"
            value={form.title}
            onChange={change("title")}
          />
        </label>

        <label>
          Description
          <textarea
            required
            rows="4"
            maxLength="2000"
            value={form.description}
            onChange={change("description")}
          />
        </label>

        <div className="field-grid">
          <label>
            Category
            <select
              value={form.category}
              onChange={change("category")}
            >
              {Object.keys(catColor).map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Event date
            <input
              type="date"
              required
              min={
                event?.date && event.date < today
                  ? event.date
                  : today
              }
              value={form.date}
              onChange={change("date")}
            />
          </label>

          <label>
            Venue
            <input
              required
              maxLength="120"
              value={form.venue}
              onChange={change("venue")}
            />
          </label>

          <label>
            Capacity
            <input
              type="number"
              required
              min={Math.max(count, 1)}
              step="1"
              value={form.capacity}
              onChange={change("capacity")}
            />
          </label>
        </div>

        <label>
          Poster image{" "}
          <span className="muted">(optional, up to 512 KB)</span>
          <input
            ref={upload}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={readPoster}
          />
        </label>

        {posterPreview && (
          <div className="stack">
            <img
              className="detail-poster"
              src={posterPreview}
              alt="Event poster preview"
            />

            {posterFile && (
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={removeSelectedPoster}
              >
                Remove selected poster
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="row">
          <button className="btn" disabled={saving}>
            {saving
              ? "Saving..."
              : event
                ? "Save changes"
                : "Publish event"}
          </button>

          <Link to="/organizer">Cancel</Link>
        </div>
      </form>
    </>
  );
}
