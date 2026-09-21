"use client";

import { useMemo, useState } from "react";
import styles from "./FormulationLab.module.css";

type Role = "Cleanser" | "Builder" | "Amplifier" | "Director" | "Blocker" | "Returner" | "Stabilizer";
type Mode = "role" | "temperament" | "condition" | "diagnosis";
type Rating = "best" | "workable" | "poor";

type Option = {
  label: string;
  rating: Rating;
  explanation: string;
};

type Drill = {
  id: string;
  mode: Mode;
  condition: string;
  title: string;
  prompt: string;
  temperature?: string;
  movement?: string;
  focusRole?: Role;
  options: Option[];
  teachingNote: string;
};

const DRILLS: Drill[] = [
  {
    id: "cleanse-director",
    mode: "condition",
    condition: "Cleansing",
    title: "Choose the stronger directing cleanser",
    prompt:
      "The formula already contains a cooler cleansing influence. You want the next ingredient to sharpen the clearing movement and actively direct the cleanse. Which is the better fit?",
    temperature: "Cool base → sharper finish",
    movement: "Cleansing + directing",
    focusRole: "Director",
    options: [
      {
        label: "Rosemary",
        rating: "best",
        explanation:
          "Best fit here. In the Haus of Sunflowers framework, rosemary carries the sharper cleansing movement, so it adds direction instead of simply repeating the cooler part of the blend.",
      },
      {
        label: "Hyssop",
        rating: "workable",
        explanation:
          "Hyssop still belongs in cleansing work, but in this specific formula it would repeat the cooler cleansing movement rather than provide the sharper directional job the formula needs.",
      },
    ],
    teachingNote:
      "Do not ask only, “Is this herb used for cleansing?” Ask, “What job does the formula still need?”",
  },
  {
    id: "cleanse-cool",
    mode: "temperament",
    condition: "Cleansing",
    title: "Read the temperament before you build",
    prompt:
      "You are building a cleansing formula that should stay cooler and gentler rather than becoming sharp. Which ingredient is the better fit for that temperament?",
    temperature: "Cool / gentle",
    movement: "Purifying",
    focusRole: "Cleanser",
    options: [
      {
        label: "Hyssop",
        rating: "best",
        explanation:
          "Best fit for this stated temperament. Hyssop gives you the cooler cleansing movement the formula is asking for.",
      },
      {
        label: "Rosemary",
        rating: "workable",
        explanation:
          "Rosemary can cleanse, but it brings a sharper quality. That may be useful in another formula, but it is not the closest match for a deliberately cooler, gentler cleanse.",
      },
    ],
    teachingNote:
      "Temperament changes the answer. A material can be appropriate for the condition and still be less appropriate for the formula you are actually trying to build.",
  },
  {
    id: "opportunity-attraction",
    mode: "condition",
    condition: "Attraction",
    title: "Match the ingredient to the kind of attraction",
    prompt:
      "The goal is to attract opportunities, openings, and favorable movement — not romantic love. Which ingredient is the better fit?",
    temperature: "Active attraction",
    movement: "Drawing opportunity",
    focusRole: "Director",
    options: [
      {
        label: "Orange Peel",
        rating: "best",
        explanation:
          "Best fit for this condition. The desired attraction is opportunity-oriented, so orange peel is better suited to direct the formula toward that type of drawing work.",
      },
      {
        label: "Catnip",
        rating: "workable",
        explanation:
          "Catnip can attract, but it is better suited to love-focused work in this framework. The broad word “attraction” is not specific enough by itself.",
      },
    ],
    teachingNote:
      "Always define what is being attracted. The condition label is only the beginning of formulation.",
  },
  {
    id: "love-attraction",
    mode: "condition",
    condition: "Love",
    title: "Same category, different prescription",
    prompt:
      "This time the goal is specifically romantic love and drawing a person’s attention toward the work. Which ingredient is better suited?",
    temperature: "Focused / persuasive",
    movement: "Love attraction",
    focusRole: "Director",
    options: [
      {
        label: "Catnip",
        rating: "best",
        explanation:
          "Best fit for the stated condition. Within this framework, catnip is better suited to love work and the type of persuasive attraction described here.",
      },
      {
        label: "Orange Peel",
        rating: "workable",
        explanation:
          "Orange peel can support attraction more broadly, but it is not as condition-specific here as catnip for romantic love work.",
      },
    ],
    teachingNote:
      "A material can be useful in more than one kind of work. The question is which one best serves this condition and role.",
  },
  {
    id: "stabilizer-role",
    mode: "role",
    condition: "Framework",
    title: "Identify the missing role",
    prompt:
      "A formula has plenty of movement, but nothing in it is helping the work hold steady, stay grounded, or keep the blend from becoming too aggressive. Which role is missing?",
    movement: "Balance + continuity",
    options: [
      {
        label: "Stabilizer",
        rating: "best",
        explanation:
          "Correct. A stabilizer helps the formula hold together and supports steadiness instead of adding more speed or force.",
      },
      {
        label: "Amplifier",
        rating: "poor",
        explanation:
          "An amplifier would increase what is already happening. In this case, the problem is too much movement, so amplification would push the formula further out of balance.",
      },
      {
        label: "Director",
        rating: "workable",
        explanation:
          "A director helps aim the formula, but the stated problem is not lack of direction. The formula needs steadiness.",
      },
    ],
    teachingNote:
      "Role questions train you to diagnose what the formula needs before reaching for another ingredient.",
  },
  {
    id: "hot-protection-diagnosis",
    mode: "diagnosis",
    condition: "Protection",
    title: "Diagnose the formula before adding more",
    prompt:
      "You are building routine household protection. The current formula already contains three ingredients that all contribute hot, sharp, forceful movement. What is the strongest concern?",
    temperature: "Hot / sharp",
    movement: "Defensive / forceful",
    options: [
      {
        label: "The formula may be too aggressive for the stated goal",
        rating: "best",
        explanation:
          "Best diagnosis. Routine protection and active defensive work are not always the same prescription. The formula may need a steadier or cooling influence instead of another forceful ingredient.",
      },
      {
        label: "The formula needs another amplifier",
        rating: "poor",
        explanation:
          "That would intensify the same movement that is already dominating the formula.",
      },
      {
        label: "Nothing matters as long as every ingredient is protective",
        rating: "poor",
        explanation:
          "That is exactly what formulation training is designed to move beyond. Shared correspondence does not guarantee a balanced formula.",
      },
    ],
    teachingNote:
      "Formulas have temperament. Learn to read the whole blend, not just the individual correspondences.",
  },
];

const MODE_LABELS: Record<Mode, string> = {
  role: "Role Training",
  temperament: "Temperament",
  condition: "Condition Fit",
  diagnosis: "Formula Diagnosis",
};

export function FormulationLab() {
  const [mode, setMode] = useState<Mode | "all">("all");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const drills = useMemo(
    () => (mode === "all" ? DRILLS : DRILLS.filter((drill) => drill.mode === mode)),
    [mode]
  );

  const drill = drills[index % drills.length];
  const result = selected === null ? null : drill.options[selected];

  function choose(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswered((value) => value + 1);
    if (drill.options[optionIndex].rating === "best") {
      setScore((value) => value + 1);
    }
  }

  function next() {
    setSelected(null);
    setIndex((value) => (value + 1) % drills.length);
  }

  function changeMode(nextMode: Mode | "all") {
    setMode(nextMode);
    setIndex(0);
    setSelected(null);
  }

  const mastery = answered === 0 ? 0 : Math.round((score / answered) * 100);

  return (
    <div className={styles.lab}>
      <div className={styles.toolbar}>
        <div>
          <span className={styles.kicker}>Formulation Lab</span>
          <h2>Train the decision, not just the correspondence.</h2>
        </div>
        <div className={styles.scoreCard}>
          <span>Session mastery</span>
          <strong>{mastery}%</strong>
          <small>{score} best-fit answers · {answered} completed</small>
        </div>
      </div>

      <div className={styles.modeRow} aria-label="Training modes">
        <button className={mode === "all" ? styles.activeMode : ""} onClick={() => changeMode("all")}>Mixed Practice</button>
        {(Object.keys(MODE_LABELS) as Mode[]).map((key) => (
          <button key={key} className={mode === key ? styles.activeMode : ""} onClick={() => changeMode(key)}>
            {MODE_LABELS[key]}
          </button>
        ))}
      </div>

      <section className={styles.exercise}>
        <div className={styles.exerciseMeta}>
          <span>{drill.condition}</span>
          <span>{MODE_LABELS[drill.mode]}</span>
          {drill.focusRole && <span>Focus: {drill.focusRole}</span>}
        </div>

        <h3>{drill.title}</h3>
        <p className={styles.prompt}>{drill.prompt}</p>

        {(drill.temperature || drill.movement) && (
          <div className={styles.formulaReadout}>
            {drill.temperature && <div><span>Temperament</span><strong>{drill.temperature}</strong></div>}
            {drill.movement && <div><span>Movement</span><strong>{drill.movement}</strong></div>}
          </div>
        )}

        <div className={styles.options}>
          {drill.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            const showBest = selected !== null && option.rating === "best";
            return (
              <button
                key={option.label}
                onClick={() => choose(optionIndex)}
                className={`${styles.option} ${isSelected ? styles.selectedOption : ""} ${showBest ? styles.bestOption : ""}`}
              >
                <strong>{option.label}</strong>
                {selected !== null && <span>{option.rating === "best" ? "Best fit" : option.rating === "workable" ? "Workable, but not ideal" : "Poor fit"}</span>}
              </button>
            );
          })}
        </div>

        {result && (
          <div className={styles.feedback}>
            <div className={styles.feedbackHeader}>
              <span>{result.rating === "best" ? "Best fit" : result.rating === "workable" ? "Workable choice" : "Needs revision"}</span>
              <strong>{result.label}</strong>
            </div>
            <p>{result.explanation}</p>
            <div className={styles.teachingNote}><strong>Training note:</strong> {drill.teachingNote}</div>
            <button className={styles.nextButton} onClick={next}>Next drill →</button>
          </div>
        )}
      </section>

      <section className={styles.learningPath}>
        <div>
          <span className={styles.kicker}>What this trains</span>
          <h3>Condition → role → temperament → balance.</h3>
        </div>
        <div className={styles.pathGrid}>
          <article><strong>1. Read the condition</strong><span>Define the actual outcome instead of relying on a broad category.</span></article>
          <article><strong>2. Assign the job</strong><span>Decide whether the formula needs a cleanser, builder, amplifier, director, blocker, returner, or stabilizer.</span></article>
          <article><strong>3. Read temperament</strong><span>Notice whether the formula is becoming cool, hot, gentle, sharp, steady, or forceful.</span></article>
          <article><strong>4. Balance the whole formula</strong><span>Choose the better fit for this recipe instead of assuming every correct correspondence belongs together.</span></article>
        </div>
      </section>
    </div>
  );
}
