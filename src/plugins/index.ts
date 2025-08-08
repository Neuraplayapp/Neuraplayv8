import { MarkdownPlugin } from './MarkdownPlugin';
import { AutoAgentPlugin } from './AutoAgentPlugin';
import { RewriterPlugin } from './RewriterPlugin';
import { SimulationPlugin } from './SimulationPlugin';
import { GoalTreePlugin } from './GoalTreePlugin';
import { ProblemResolverPlugin } from './ProblemResolverPlugin';
import { ParallelThoughtPlugin } from './ParallelThoughtPlugin';
import { CognitiveMapPlugin } from './CognitiveMapPlugin';
import { HypothesisTesterPlugin } from './HypothesisTesterPlugin';
import type { CanvasPlugin } from './PluginInterface';

export const pluginRegistry: CanvasPlugin[] = [
  MarkdownPlugin,
  AutoAgentPlugin,
  RewriterPlugin,
  SimulationPlugin,
  GoalTreePlugin,
  ProblemResolverPlugin,
  ParallelThoughtPlugin,
  CognitiveMapPlugin,
  HypothesisTesterPlugin,
];

