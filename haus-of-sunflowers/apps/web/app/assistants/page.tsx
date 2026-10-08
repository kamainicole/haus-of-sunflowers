import { AppShell } from "@/components/AppShell";
import { LearningAssistantWorkbench } from "@/components/LearningAssistantWorkbench";

type AssistantKind =
  | "app_navigator"
  | "research_search"
  | "formulary_assistant"
  | "practice_builder"
  | "course_matcher";

const allowed = new Set<AssistantKind>([
  "app_navigator",
  "research_search",
  "formulary_assistant",
  "practice_builder",
  "course_matcher",
]);

export default async function AssistantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tool?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const requested = params.tool as AssistantKind;
  const initialKind = allowed.has(requested) ? requested : "app_navigator";

  return (
    <AppShell>
      <section className="page-hero compact-hero">
        <div>
          <div className="eyebrow">Learn · Internal knowledge only</div>
          <h1>Learning Assistants</h1>
          <p>
            Ask questions, find the right tool, search the archive, work with the Formulary,
            organize approved practices, or find published lessons without turning the app into
            a generic internet chatbot.
          </p>
        </div>
      </section>

      <LearningAssistantWorkbench initialKind={initialKind} />
    </AppShell>
  );
}
