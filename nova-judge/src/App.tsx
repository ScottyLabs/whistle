import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useMatch } from "react-router-dom";
import type { Project } from "./mockProjects";

const API = "http://localhost:8000";

type Judge = {
  name: string;
  email: string;
  role: "judge" | "admin";
  subteam: string;
};

type Note = {
  id: number;
  projectId: string;
  feature: string;
  text: string;
  shared: boolean;
  author: string;
  subteam: string;
};

// Every request sends the session cookie so the backend knows who is signed in.
function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, { ...init, credentials: "include" });
}

function ExternalLink({ url, label }: { url: string; label: string }) {
  if (!url.startsWith("https://")) return null;
  return (
    <a className="ext" href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}

function App() {
  const match = useMatch("/project/:id");
  const selectedId = match?.params.id ?? null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading"
  );
  const [judge, setJudge] = useState<Judge | null>(null);
  const [authState, setAuthState] = useState<"checking" | "error" | "ready">(
    "checking"
  );
  const [loginError, setLoginError] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [feature, setFeature] = useState("");
  const [shared, setShared] = useState(false);
  const [featureFilter, setFeatureFilter] = useState("");

  useEffect(() => {
    apiFetch("/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user: Judge | null) => {
        setJudge(user);
        setAuthState("ready");
      })
      .catch(() => setAuthState("error"));
  }, []);

  useEffect(() => {
    if (!judge) {
      setProjects([]);
      return;
    }
    setStatus("loading");
    apiFetch("/projects")
      .then((r) => {
        if (r.status === 401) {
          setJudge(null);
          return null;
        }
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then((data: Project[] | null) => {
        if (!data) return;
        setProjects(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [judge]);

  useEffect(() => {
    setFeatureFilter("");
    setFeature("");
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !judge) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    const fetchNotes = () =>
      apiFetch(`/projects/${selectedId}/notes`)
        .then((r) => {
          if (r.status === 401) {
            setJudge(null);
            return Promise.reject();
          }
          return r.ok ? r.json() : Promise.reject();
        })
        .then((data: Note[]) => {
          if (!cancelled) setNotes(data);
        })
        .catch(() => {});
    fetchNotes();
    const timer = setInterval(fetchNotes, 7000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedId, judge]);

  async function handleGoogle(credential: string | undefined) {
    if (!credential) {
      setLoginError("Google did not send a sign-in token. Try again.");
      return;
    }
    try {
      const r = await apiFetch("/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (r.status === 403) {
        setLoginError(
          "This Google account is not on the judge list. Ask an organizer to add your email."
        );
        return;
      }
      if (!r.ok) throw new Error("login failed");
      setLoginError("");
      setJudge((await r.json()) as Judge);
    } catch {
      setLoginError("Could not sign in. Check that the backend is running.");
    }
  }

  async function signOut() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // the cookie expires on its own; clear the screen either way
    }
    setJudge(null);
  }

  if (authState === "checking") {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }
  if (authState === "error") {
    return (
      <div style={{ padding: 24 }}>
        Could not reach the backend. Check that it is running.
      </div>
    );
  }

  if (!judge) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Judge sign in</h2>
        <p>Sign in with the Google account your organizer added to the judge list.</p>
        <div style={{ marginTop: 12 }}>
          <GoogleLogin
            onSuccess={(res) => handleGoogle(res.credential)}
            onError={() => setLoginError("Google sign-in failed. Try again.")}
          />
        </div>
        {loginError && (
          <p role="alert" style={{ color: "#b42318", marginTop: 12 }}>
            {loginError}
          </p>
        )}
      </div>
    );
  }

  if (status === "loading") {
    return <div style={{ padding: 24 }}>Loading projects...</div>;
  }
  if (status === "error") {
    return (
      <div style={{ padding: 24 }}>
        Could not load projects. Check that the backend is running.
      </div>
    );
  }

  const subteams = [...new Set(projects.map((p) => p.subteam))];

  const selected = projects.find((p) => p.id === selectedId);
  const query = search.trim().toLowerCase();
  const matching = projects.filter((p) =>
    p.teamName.toLowerCase().includes(query)
  );
  const sidebarSubteams = subteams
    .filter((s) => matching.some((p) => p.subteam === s))
    .sort((a, b) =>
      a === judge.subteam ? -1 : b === judge.subteam ? 1 : 0
    );

  const visibleNotes = notes.filter(
    (n) => !featureFilter || n.feature === featureFilter
  );
  const sharedNotes = notes.filter((n) => n.shared);

  async function addNote() {
    if (!selected || !judge || !text.trim()) return;
    try {
      const r = await apiFetch(`/projects/${selected.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, text, shared }),
      });
      if (r.status === 401) {
        setJudge(null);
        return;
      }
      if (!r.ok) throw new Error("save failed");
      const created: Note = await r.json();
      setNotes((prev) => [...prev, created]);
      setText("");
      setFeature("");
      setShared(false);
    } catch {
      alert("Could not save the note. Check that the backend is running.");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        Signed in as <b>{judge.name}</b> (
        {judge.role === "admin" ? "admin" : judge.subteam}){" "}
        <button onClick={signOut}>Sign out</button>
      </div>

      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ minWidth: 220 }}>
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams"
          />
          {sidebarSubteams.map((s) => (
            <div key={s}>
              <h3>
                {s}
                {s === judge.subteam && " (yours)"}
              </h3>
              {matching
                .filter((p) => p.subteam === s)
                .map((p) => (
                  <Link
                    key={p.id}
                    to={`/project/${p.id}`}
                    style={{ marginBottom: 8 }}
                  >
                    {p.teamName}
                  </Link>
                ))}
            </div>
          ))}
          {matching.length === 0 && <p>No teams match.</p>}
        </div>

        <div style={{ flex: 1 }}>
          {selected ? (
            <>
              <h2>{selected.teamName}</h2>
              <div>
                <ExternalLink url={selected.githubLink} label="GitHub repo" />
                <ExternalLink url={selected.slideshowLink} label="Slides" />
              </div>

              {selected.oneLiner ? (
                <>
                  <p>{selected.oneLiner}</p>
                  <p>{selected.whatItDoes}</p>
                </>
              ) : (
                <p>Summary not generated yet.</p>
              )}

              {selected.features.length > 0 && (
                <>
                  <h3>Features</h3>
                  <ul>
                    {selected.features.map((f) => (
                      <li key={f.name}>
                        {f.name}: {f.description}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {selected.gaps.length > 0 && (
                <>
                  <h3>Gaps</h3>
                  <ul>
                    {selected.gaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </>
              )}

              <h3>Notes</h3>
              <select
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
              >
                <option value="">No feature tag</option>
                {selected.features.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
              <br />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a note..."
                rows={3}
                style={{ width: 360, marginTop: 8 }}
              />
              <br />
              <label>
                <input
                  type="checkbox"
                  checked={shared}
                  onChange={(e) => setShared(e.target.checked)}
                />{" "}
                Share with all judges
              </label>
              <br />
              <button onClick={addNote} style={{ marginTop: 8 }}>
                Add note
              </button>

              {selected.features.length > 0 && (
                <p style={{ marginTop: 16 }}>
                  Show notes for:{" "}
                  <select
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                  >
                    <option value="">All features</option>
                    {selected.features.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </p>
              )}

              <ul>
                {visibleNotes.map((n) => (
                  <li key={n.id}>
                    {n.feature && <b>[{n.feature}] </b>}
                    {n.text} ({n.author},{" "}
                    {n.shared ? "shared" : "my subteam only"})
                  </li>
                ))}
              </ul>

              <h3>Live summary</h3>
              {sharedNotes.length === 0 ? (
                <p>No shared notes yet.</p>
              ) : (
                <>
                  <p>
                    Based on {sharedNotes.length} shared note(s). AI summary
                    goes here later.
                  </p>
                  <ul>
                    {sharedNotes.map((n) => (
                      <li key={n.id}>
                        {n.feature && <b>[{n.feature}] </b>}
                        {n.text}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p>Pick a project on the left.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;