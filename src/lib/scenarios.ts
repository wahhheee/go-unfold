export type ScenarioFrame = {
  title: string;
  note: string;
  lanes: { label: string; value: string }[];
};
export type Scenario = { id: string; label: string; frames: ScenarioFrame[] };
