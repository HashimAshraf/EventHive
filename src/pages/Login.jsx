
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/useApp";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(address, secret) {
    setError("");
    setLoading(true);

    const result = await login(address, secret);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const home = {
      organizer: "/organizer",
      admin: "/admin",
      student: "/events",
    };

    const role = result.user.role;
    const returnTo = state?.returnTo;

    const canReturn =
      returnTo &&
      (returnTo.startsWith("/events/") ||
        (role === "student" && returnTo === "/my-events") ||
        (role === "organizer" &&
          (returnTo === "/organizer" ||
            returnTo.startsWith("/organizer/"))) ||
        (role === "admin" && returnTo === "/admin"));

    navigate(canReturn ? returnTo : home[role], {
      replace: true,
    });
  }

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        signIn(email, password);
      }}
    >
      <h1>Log in</h1>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button className="btn" disabled={loading}>
        {loading ? "Logging in..." : "Log in"}
      </button>

      <p className="muted">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  );
}
