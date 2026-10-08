"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AssistantKind =
  | "app_navigator"
  | "research_search"
  | "formulary_assistant"
  | "practice_builder"
  | "course_matcher";

type GroundingSource = {
  id: string;
  label: string;
  excerpt: string;
  href: string;
  sourceType: string;
};

const ASSISTANTS: Array<{
  kind: AssistantKind;
  name: string;
  description: string;
  prompt: string;
  boundary: string;
}> = [
  {
    kind: "app_navigator",
    name: "App Navigator",
    description: "Find the right part of Haus of Sunflowers for what you want to learn or do.",
    prompt: "What are you trying to find, learn, practice, or work on?",
    boundary: "Recommends only pathways and tools that already exist inside the app.",
  },
  {
    kind: "research_search",
    name: "Research Search Assistant",
    description: "Ask the historical archive a question in ordinary language and follow the records it finds.",
    prompt: "Ask a question about the historical archive…",
    boundary: "Uses the internal archive only and preserves evidence, interpretation, and uncertainty.",
  },
  {
    kind: "formulary_assistant",
    name: "Formulary Assistant",
    description: "Search materia by condition, function, role, temperament, pairing, or formulation behavior.",
    prompt: "Ask about a material, condition, role, pairing, or formulation decision…",
    boundary: "Uses approved Formulary and materia records only. No outside occult correspondence lists.",
  },
  {
    kind: "practice_builder",
    name: "Practice Builder",
    description: "Organize approved self-technologies into a personal nonclinical routine.",
    prompt: "What kind of reflective routine are you trying to organize?",
    boundary: "Nonclinical. It cannot diagnose, provide psychotherapy, or invent practices not in the app.",
  },
  {
    kind: "course_matcher",
    name: "Course Matcher",
    description: "Find a course or lesson based on the educational material intentionally published in Learn.",
    prompt: "What would you like to learn more about?",
    boundary: "Recommends only courses and lessons already published in the app.",
  },
];

export function LearningAssistantWorkbench({ initialKind = "app_navigator" }: { initialKind?: AssistantKind }) {
  const initialIndex = Math.max(0, ASSISTANTS.findIndex((assistant) => assistant.kind === initialKind));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const active = useMemo(() => ASSISTANTS[activeIndex], [activeIndex]);

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    const response = await fetch("/api/learning-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: active.kind, query }),
    });

    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "The assistant could not answer right now.");
      return;
    }

    setAnswer(data.answer || "");
    setSources(data.sources || []);
  }

  function switchAssistant(index: number) {
    setActiveIndex(index);
    setQuery("");
    setAnswer("");
    setSources([]);
    setError("");
  }

  return (
    <div className="assistant-workbench">
      <div className="assistant-picker" aria-label="Learning assistants">
        {ASSISTANTS.map((assistant, index) => (
          <button
            type="button"
            key={assistant.kind}
            className={index === activeIndex ? "assistant-tab active" : "assistant-tab"}
            onClick={() => switchAssistant(index)}
          >
            <strong>{assistant.name}</strong>
            <span>{assistant.description}</span>
          </button>
        ))}
      </div>

      <section className="assistant-panel">
        <div className="eyebrow">Grounded learning assistant</div>
        <h2>{active.name}</h2>
        <p>{active.description}</p>
        <div className="boundary-note"><strong>Boundary:</strong> {active.boundary}</div>

        <form className="assistant-form" onSubmit={ask}>
          <label htmlFor="assistant-question">{active.prompt}</label>
          <textarea
            id="assistant-question"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={4}
            placeholder={active.prompt}
          />
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Searching approved material…" : "Ask assistant"}
          </button>
        </form>

        {error && <p className="alert">{error}</p>}

        {answer && (
          <article className="assistant-answer">
            <div className="eyebrow">Answer</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
          </article>
        )}

        {sources.length > 0 && (
          <section className="assistant-sources">
            <div className="eyebrow">Approved internal sources used</div>
            <div className="source-list">
              {sources.map((source, index) => (
                <Link className="source-row source-row-link" href={source.href} key={source.id + source.sourceType}>
                  <div>
                    <div className="eyebrow">[{index + 1}] {source.sourceType.replaceAll("_", " ")}</div>
                    <h3>{source.label}</h3>
                    <p>{source.excerpt.slice(0, 300)}{source.excerpt.length > 300 ? "…" : ""}</p>
                  </div>
                  <div className="source-open-meta"><span>Open source →</span></div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
