export interface CanvasObject {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
}

export type RenderProps = {
  object: CanvasObject;
  update: (update: Partial<CanvasObject>) => void;
};

export type PluginAIInput = {
  prompt: string;
  object: CanvasObject;
};

export type PluginAIResult = {
  updatedContent?: string;
};

export type AgentSimInput = {
  state: any;
  prompt?: string;
};

export type AgentSimResult = {
  output: string;
  nextAction?: string;
};

export interface CanvasPlugin {
  id: string;
  label: string;
  icon?: string;
  createObject(): CanvasObject;
  render(props: RenderProps): JSX.Element;
  handleAI?(input: PluginAIInput): PluginAIResult | null;
  autoConnect?: boolean; // for Auto-Agent Graphs
  simulateAgent?: (state: AgentSimInput) => AgentSimResult[];
}

