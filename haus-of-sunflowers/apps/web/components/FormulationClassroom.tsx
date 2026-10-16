"use client";

import { useMemo, useState } from "react";

type ClassroomMaterial = {
  id: string;
  common_name: string;
  botanical_name: string | null;
  primary_conditions: string | null;
  functional_roles_text: string | null;
  temperament_analysis: string | null;
  pairings_summary: string | null;
  correspondences_summary: string | null;
  formulation_behavior: string | null;
};

type SelectedMaterial = {
  id: string;
  assignedRole: string;
};

type ConditionKey =
  | "cleansing"
  | "protection"
  | "blessing"
  | "prosperity"
  | "opportunity"
  | "luck"
  | "mutual_love"
  | "self_love"
  | "peace"
  | "courage"
  | "boundaries"
  | "justice"
  | "removal"
  | "home";

type ConditionConfig = {
  label: string;
  description: string;
  requiredRoles: string[];
  keywords: string[];
};

const CONDITIONS: Record<ConditionKey, ConditionConfig> = {
  cleansing: {
    label: "Cleansing",
    description: "Clear, wash away, or reset unwanted influence without targeting another person.",
    requiredRoles: ["Cleanser", "Director", "Stabilizer"],
    keywords: ["cleans", "purif", "wash", "uncross"],
  },
  protection: {
    label: "Protection",
    description: "Build protection, shielding, and defensive stability.",
    requiredRoles: ["Builder", "Blocker", "Stabilizer"],
    keywords: ["protect", "ward", "defen"],
  },
  blessing: {
    label: "Blessing",
    description: "Support favorable, restorative, and beneficial conditions.",
    requiredRoles: ["Builder", "Amplifier", "Stabilizer"],
    keywords: ["bless", "favor", "grace"],
  },
  prosperity: {
    label: "Prosperity & Money",
    description: "Support financial stability, prosperity, and responsible material growth.",
    requiredRoles: ["Builder", "Director", "Stabilizer"],
    keywords: ["money", "prosper", "wealth", "financial"],
  },
  opportunity: {
    label: "Opportunity & Road Opening",
    description: "Support openings, movement, access, and favorable opportunities.",
    requiredRoles: ["Director", "Builder", "Stabilizer"],
    keywords: ["road", "opportun", "open", "success"],
  },
  luck: {
    label: "Luck & Favor",
    description: "Support favorable circumstances without manipulating a specific person.",
    requiredRoles: ["Amplifier", "Director", "Stabilizer"],
    keywords: ["luck", "favor", "success"],
  },
  mutual_love: {
    label: "Mutual Love & Relationship Support",
    description: "Support mutual, consensual affection and healthy relationship conditions.",
    requiredRoles: ["Builder", "Director", "Stabilizer"],
    keywords: ["love", "romance", "relationship", "affection"],
  },
  self_love: {
    label: "Self-Love & Confidence",
    description: "Strengthen self-regard, confidence, and care directed toward yourself.",
    requiredRoles: ["Builder", "Amplifier", "Stabilizer"],
    keywords: ["self", "love", "confidence", "esteem"],
  },
  peace: {
    label: "Peace & Calm",
    description: "Support peace, steadiness, de-escalation, and calm conditions.",
    requiredRoles: ["Stabilizer", "Builder", "Cleanser"],
    keywords: ["peace", "calm", "harmony", "sooth"],
  },
  courage: {
    label: "Courage & Confidence",
    description: "Support courage, confidence, resolve, and personal strength.",
    requiredRoles: ["Builder", "Amplifier", "Stabilizer"],
    keywords: ["courage", "confidence", "strength", "bravery"],
  },
  boundaries: {
    label: "Boundaries",
    description: "Strengthen personal limits, separation, and protection of your own space.",
    requiredRoles: ["Blocker", "Builder", "Stabilizer"],
    keywords: ["boundar", "protect", "separat"],
  },
  justice: {
    label: "Justice & Accountability",
    description: "Support fairness, truth, accountability, and lawful resolution rather than retaliation.",
    requiredRoles: ["Director", "Blocker", "Stabilizer"],
    keywords: ["justice", "court", "legal", "truth", "account"],
  },
  removal: {
    label: "Removal & Banishment",
    description: "Remove an unwanted influence from your own life or space without directing harm at another person.",
    requiredRoles: ["Blocker", "Director", "Cleanser"],
    keywords: ["banish", "remove", "separat", "clear"],
  },
  home: {
    label: "Home Blessing & Household Stability",
    description: "Support peace, blessing, protection, and stability in the home.",
    requiredRoles: ["Builder", "Cleanser", "Stabilizer"],
    keywords: ["home", "house", "bless", "protect", "peace"],
  },
};

const ROLE_OPTIONS = [
  "Builder",
  "Blocker",
  "Stabilizer",
  "Cleanser",
  "Amplifier",
  "Director",
  "Returner",
];

const BLOCKED_PATTERNS = [
  /\b(dominate|domination|control|control them|make them|force|compel|coerce)\b/i,
  /\b(obsess|obsession|make .* obsessed|can't stop thinking)\b/i,
  /\b(revenge|retaliat|punish|hurt|harm|injure|destroy)\b/i,
  /\b(curse|crossing|hex|jinx|enemy work)\b/i,
  /\b(bind .* to me|keep .* from leaving|stop .* from leaving)\b/i,
  /\b(break up|separate .* couple|ruin .* relationship)\b/i,
  /\b(stalk|spy|track .* without|surveil)\b/i,
  /\b(steal|fraud|blackmail|extort|illegal)\b/i,
];

function includesWord(value: string | null, needle: string) {
  return (value || "").toLowerCase().includes(needle.toLowerCase());
}

function conditionMatches(value: string | null, keywords: string[]) {
  const haystack = (value || "").toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function ethicalIssue(goal: string) {
  const clean = goal.trim();
  if (!clean) return "";
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(clean))) {
    return "This classroom will not evaluate a goal aimed at overriding consent, controlling a specific person, retaliation, deliberate harm, deception, or illegal activity. Reframe the goal toward your own protection, boundaries, healing, opportunity, accountability, or another self-directed outcome.";
  }
  return "";
}

export function FormulationClassroom({ materials }: { materials: ClassroomMaterial[] }) {
  const [condition, setCondition] = useState<ConditionKey>("protection");
  const [goal, setGoal] = useState("");
  const [selected, setSelected] = useState<SelectedMaterial[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [application, setApplication] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const config = CONDITIONS[condition];
  const guardrailMessage = ethicalIssue(goal);

  const selectedRecords = useMemo(
    () =>
      selected
        .map((item) => ({
          ...item,
          material: materials.find((material) => material.id === item.id),
        }))
        .filter((item) => item.material),
    [materials, selected]
  );

  const orderedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => {
      const aFit = conditionMatches(a.primary_conditions, config.keywords) ? 1 : 0;
      const bFit = conditionMatches(b.primary_conditions, config.keywords) ? 1 : 0;
      if (aFit !== bFit) return bFit - aFit;
      return a.common_name.localeCompare(b.common_name);
    });
  }, [materials, config.keywords]);

  function resetAssignment(nextCondition: ConditionKey) {
    setCondition(nextCondition);
    setGoal("");
    setSelected([]);
    setReasoning("");
    setApplication("");
    setSubmitted(false);
  }

  function toggleMaterial(id: string) {
    if (guardrailMessage) return;
    setSubmitted(false);
    setSelected((current) => {
      if (current.some((item) => item.id === id)) {
        return current.filter((item) => item.id !== id);
      }
      if (current.length >= 5) return current;
      return [...current, { id, assignedRole: "" }];
    });
  }

  function assignRole(id: string, role: string) {
    setSubmitted(false);
    setSelected((current) =>
      current.map((item) => (item.id === id ? { ...item, assignedRole: role } : item))
    );
  }

  const evaluation = useMemo(() => {
    const presentRoles = new Set(selected.map((item) => item.assignedRole).filter(Boolean));
    const missingRoles = config.requiredRoles.filter((role) => !presentRoles.has(role));

    const roleChecks = selectedRecords.map(({ material, assignedRole }) => ({
      name: material!.common_name,
      assignedRole,
      supported: assignedRole ? includesWord(material!.functional_roles_text, assignedRole) : false,
      sourceRoles: material!.functional_roles_text,
      conditionFit: conditionMatches(material!.primary_conditions, config.keywords),
      temperament: material!.temperament_analysis,
    }));

    return {
      missingRoles,
      roleChecks,
      complete:
        !guardrailMessage &&
        goal.trim().length >= 12 &&
        selected.length > 0 &&
        selected.length <= 5 &&
        missingRoles.length === 0 &&
        reasoning.trim().length >= 40 &&
        application.trim().length >= 10,
    };
  }, [selected, selectedRecords, reasoning, application, config, goal, guardrailMessage]);

  return (
    <div className="formulation-classroom">
      <section className="classroom-assignment">
        <div className="eyebrow">Condition-based formulation practice</div>
        <h2>Build for the condition, then justify every material.</h2>
        <p>
          Choose a condition, define the goal in your own words, assign functional roles, and explain
          why each material belongs. The classroom checks your work against approved Formulary data.
        </p>

        <label className="classroom-condition-picker">
          <span>Condition</span>
          <select value={condition} onChange={(event) => resetAssignment(event.target.value as ConditionKey)}>
            {(Object.keys(CONDITIONS) as ConditionKey[]).map((key) => (
              <option key={key} value={key}>{CONDITIONS[key].label}</option>
            ))}
          </select>
        </label>

        <div className="classroom-condition-note">
          <strong>{config.label}</strong>
          <span>{config.description}</span>
        </div>

        <label className="classroom-writing-field">
          <span>State the goal of the working in your own words.</span>
          <textarea
            rows={3}
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              setSubmitted(false);
            }}
            placeholder="Example: strengthen the boundaries and protection around my home."
          />
        </label>

        {guardrailMessage && <p className="alert">{guardrailMessage}</p>}

        <div className="builder-preview">
          <div className="builder-step active"><span>1</span><strong>Condition</strong><small>{config.label}</small></div>
          <div className="builder-step"><span>2</span><strong>Roles</strong><small>{config.requiredRoles.join(" · ")}</small></div>
          <div className="builder-step"><span>3</span><strong>Materials</strong><small>Maximum five</small></div>
          <div className="builder-step"><span>4</span><strong>Reasoning</strong><small>Explain each choice</small></div>
          <div className="builder-step"><span>5</span><strong>Application</strong><small>Choose how it will be used</small></div>
        </div>
      </section>

      <section className="connection-panel">
        <div className="eyebrow">Step 1</div>
        <h2>Select your materials</h2>
        <p>
          {selected.length}/5 selected. Materials whose approved conditions most closely match
          <strong> {config.label}</strong> are shown first.
        </p>
        <div className="classroom-material-grid">
          {orderedMaterials.map((material) => {
            const active = selected.some((item) => item.id === material.id);
            const fits = conditionMatches(material.primary_conditions, config.keywords);
            return (
              <button
                type="button"
                disabled={Boolean(guardrailMessage)}
                className={active ? "classroom-material active" : "classroom-material"}
                key={material.id}
                onClick={() => toggleMaterial(material.id)}
              >
                <strong>{material.common_name}</strong>
                <span>{material.botanical_name || "Formulary material"}</span>
                <small>{material.primary_conditions || "Conditions not specified"}</small>
                {fits && <em>Condition match</em>}
              </button>
            );
          })}
        </div>
      </section>

      {selectedRecords.length > 0 && (
        <section className="connection-panel">
          <div className="eyebrow">Step 2</div>
          <h2>Give every material a job</h2>
          <p>
            This condition requires at least: <strong>{config.requiredRoles.join(", ")}</strong>.
            Other roles may be added when they have a clear reason.
          </p>

          <div className="classroom-role-list">
            {selectedRecords.map(({ material, assignedRole }) => (
              <article className="classroom-role-card" key={material!.id}>
                <div>
                  <h3>{material!.common_name}</h3>
                  <p><strong>Formulary roles:</strong> {material!.functional_roles_text || "Not specified in the Formulary entry."}</p>
                  <p><strong>Temperament:</strong> {material!.temperament_analysis || "Not specified in the Formulary entry."}</p>
                </div>
                <label>
                  <span>Your assigned role</span>
                  <select value={assignedRole} onChange={(event) => assignRole(material!.id, event.target.value)}>
                    <option value="">Choose a role</option>
                    {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="connection-panel">
        <div className="eyebrow">Step 3</div>
        <h2>Explain your reasoning</h2>
        <label className="classroom-writing-field">
          <span>Why does each material belong in this formula? What is it doing that the others are not?</span>
          <textarea rows={6} value={reasoning} onChange={(event) => { setReasoning(event.target.value); setSubmitted(false); }} />
        </label>

        <label className="classroom-writing-field">
          <span>How would you apply this formula, and why does that application fit the condition?</span>
          <textarea rows={4} value={application} onChange={(event) => { setApplication(event.target.value); setSubmitted(false); }} />
        </label>

        <button
          className="primary-button"
          type="button"
          disabled={Boolean(guardrailMessage)}
          onClick={() => setSubmitted(true)}
        >
          Evaluate my formulation
        </button>
      </section>

      {submitted && (
        <section className="classroom-feedback">
          <div className="eyebrow">Formulary logic check</div>
          <h2>{evaluation.complete ? "Your structure is complete." : "Your structure needs another pass."}</h2>

          {evaluation.missingRoles.length > 0 && (
            <p className="alert">Missing required role: {evaluation.missingRoles.join(", ")}.</p>
          )}

          {goal.trim().length < 12 && (
            <p className="alert">Describe the goal more clearly before the formula can be evaluated.</p>
          )}

          <div className="classroom-feedback-grid">
            {evaluation.roleChecks.map((item) => (
              <article key={item.name}>
                <h3>{item.name}</h3>
                <p>
                  <strong>Your role:</strong> {item.assignedRole || "Not assigned"}<br />
                  <strong>Role supported by this Formulary entry:</strong> {item.supported ? "Yes" : "Not directly"}<br />
                  <strong>{config.label} named in conditions:</strong> {item.conditionFit ? "Yes or closely matched" : "Not directly"}
                </p>
                {!item.supported && item.assignedRole && (
                  <p>
                    Reconsider whether you are using this material for a job the Formulary actually gives it,
                    or explain why the context changes its role.
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="boundary-note">
            <strong>What this check means:</strong> it compares your choices to approved Formulary fields already
            in the app. It does not treat a shared correspondence as proof that two materials are interchangeable.
            The classroom also refuses goals built around coercion, domination, retaliation, deliberate harm,
            deception, or illegal activity.
          </div>
        </section>
      )}
    </div>
  );
}
