"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type StudentRow = {
  email: string;
  display_name: string | null;
  active: boolean;
  account_status: string;
  created_at: string;
};

export function StudentAccessManager() {
  const supabase = useMemo(() => createClient(), []);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.schema("api").rpc("owner_list_students");
    if (error) {
      setStatus(error.message);
      setStudents([]);
    } else {
      setStudents((data ?? []) as StudentRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function addStudent(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    const { error } = await supabase.schema("api").rpc("owner_add_student", {
      p_email: cleanEmail,
      p_display_name: displayName.trim() || null,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setEmail("");
    setDisplayName("");
    setStatus("Student access added.");
    await refresh();
  }

  async function removeStudent(studentEmail: string) {
    setStatus("");
    const { error } = await supabase.schema("api").rpc("owner_remove_student", {
      p_email: studentEmail,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Student access removed.");
    await refresh();
  }

  return (
    <div className="student-admin-stack">
      <section className="connection-panel">
        <div className="eyebrow">Add a student</div>
        <h2>Student access</h2>
        <p>
          Add the email your student will use to sign in. Students can use the app and formulation tools,
          but they cannot open the Dissertation, Import Center, or owner administration.
        </p>

        <form className="material-browser-tools" onSubmit={addStudent}>
          <label>
            <span>Student name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Student name"
            />
          </label>
          <label>
            <span>Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
            />
          </label>
          <button className="primary-button" type="submit">Add student</button>
        </form>

        {status && <p className="status-message">{status}</p>}
      </section>

      <section className="connection-panel">
        <div className="eyebrow">Student sign-in link</div>
        <h2>/student-access</h2>
        <p>
          After you add a student here, send them the Student Access page from your app.
          The first time they use it, their account is created as a student member automatically.
        </p>
      </section>

      <section className="connection-panel">
        <div className="eyebrow">Current access</div>
        <h2>Students</h2>
        {loading ? (
          <p>Loading students…</p>
        ) : students.length === 0 ? (
          <p>No students have been added yet.</p>
        ) : (
          <div className="source-list">
            {students.map((student) => (
              <article className="source-row" key={student.email}>
                <div>
                  <div className="eyebrow">{student.account_status.replaceAll("_", " ")}</div>
                  <h3>{student.display_name || student.email}</h3>
                  <p>{student.email}</p>
                </div>
                <div className="source-open-meta">
                  <span className="record-pill">{student.active ? "Access on" : "Access off"}</span>
                  {student.active && (
                    <button
                      type="button"
                      className="secondary-cta"
                      onClick={() => void removeStudent(student.email)}
                    >
                      Remove access
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
