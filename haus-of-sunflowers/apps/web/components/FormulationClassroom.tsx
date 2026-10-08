"use client";

import { useMemo, useState } from "react";
import type { ClassroomMaterial } from "@/app/formulation-classroom/page";

type SelectedMaterial = {
  id: string;
  assignedRole: string;
};

const REQUIRED_ROLES = ["Builder", "Blocker", "Stabilizer"];

function includesWord(value: string | null, needle: string) {
  return (value || "").toLowerCase().includes(needle.toLowerCase());
}

export function FormulationClassroom({ materials }: { materials: ClassroomMaterial[] }) {
  const [selected, setSelected] = useState<SelectedMaterial[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [application, setApplication] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  function toggleMaterial(id: string) {
    setSubmitted(false);
    setSelected((current) => {
      if (current.some((item) => item.id === id)) {
        return current.filter((item) => item.id !== id);
      }
      if (current.length >= 4) return current;
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
    const missingRoles = REQUIRED_ROLES.filter((role) => !presentRoles.has(role));

    const roleChecks = selectedRecords.map(({ material, assignedRole }) => ({
      name: material!.common_name,
      assignedRole,
      supported: assignedRole ? includesWord(material!.functional_roles_text, assignedRole) : false,
      sourceRoles: material!.functional_roles_text,
      conditionFit: includesWord(material!.primary_conditions, "protection"),
      temperament: material!.temperament_analysis,
    }));

    const supportedRoles = roleChecks.filter((item) => item.supported).length;
    const protectionFits = roleChecks.filter((item) => item.conditionFit).length;

    return {
      missingRoles,
      roleChecks,
      supportedRoles,
      protectionFits,
      complete:
        selected.length > 0 &&
        selected.length <= 4 &&
        missingRoles.length === 0 &&
        reasoning.trim().length >= 40 &&
        application.trim().length >= 10,
    };
  }, [selected, selectedRecords, reasoning, application]);

  return (
    <div className="formulation-classroom">
      <section className="classroom-assignment">
        <div className="eyebrow">Assignment 01 · Protection</div>
        <h2>Build a protection formula with structure.</h2>
        <p>
          Create a protection formula using <strong>one Builder, one Blocker, and one Stabilizer</strong>.
          You may use no more than four materials. Your job is not simply to choose four things associated
          with protection. Each material must have a reason for being there.
        </p>

        <div className="builder-preview">
          <div className="builder-step active"><span>1</span><strong>Condition</strong><small>Protection</small></div>
          <div className="builder-step"><span>2</span><strong>Roles</strong><small>Builder · Blocker · Stabilizer</small></div>
          <div className="builder-step"><span>3</span><strong>Materials</strong><small>Maximum four</small></div>
          <div className="builder-step"><span>4</span><strong>Reasoning</strong><small>Explain each choice</small></div>
          <div className="builder-step"><span>5</span><strong>Application</strong><small>Choose how it will be used</small></div>
        </div>
      </section>

      <section className="connection-panel">
        <div className="eyebrow">Step 1</div>
        <h2>Select your materials</h2>
        <p>{selected.length}/4 selected</p>
        <div className="classroom-material-grid">
          {materials.map((material) => {
            const active = selected.some((item) => item.id === material.id);
            return (
              <button
                type="button"
                className={active ? "classroom-material active" : "classroom-material"}
                key={material.id}
                onClick={() => toggleMaterial(material.id)}
              >
                <strong>{material.common_name}</strong>
                <span>{material.botanical_name || "Formulary material"}</span>
                <small>{material.primary_conditions || "Conditions not specified"}</small>
              </button>
            );
          })}
        </div>
      </section>

      {selectedRecords.length > 0 && (
        <section className="connection-panel">
          <div className="eyebrow">Step 2</div>
          <h2>Give every material a job</h2>
          <p>Assign the role you believe each material is performing in this specific formula.</p>

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
                    <option value="Builder">Builder</option>
                    <option value="Blocker">Blocker</option>
                    <option value="Stabilizer">Stabilizer</option>
                    <option value="Cleanser">Cleanser</option>
                    <option value="Amplifier">Amplifier</option>
                    <option value="Director">Director</option>
                    <option value="Returner">Returner</option>
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

        <button className="primary-button" type="button" onClick={() => setSubmitted(true)}>
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

          <div className="classroom-feedback-grid">
            {evaluation.roleChecks.map((item) => (
              <article key={item.name}>
                <h3>{item.name}</h3>
                <p>
                  <strong>Your role:</strong> {item.assignedRole || "Not assigned"}<br />
                  <strong>Role supported by this Formulary entry:</strong> {item.supported ? "Yes" : "Not directly"}<br />
                  <strong>Protection named in conditions:</strong> {item.conditionFit ? "Yes" : "Not directly"}
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
            <strong>What this check means:</strong> it compares your choices to the approved Formulary fields already
            in the app. It does not treat a shared correspondence or condition keyword as proof that two materials
            are functionally interchangeable, and it does not import outside occult lore.
          </div>
        </section>
      )}
    </div>
  );
}
