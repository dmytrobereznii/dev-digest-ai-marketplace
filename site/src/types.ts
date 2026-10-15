// Shapes written by scripts/build-index.mjs (docs/SITE-SPEC.md → Data).

export type Dependency = { name: string; range: string };

export type Plugin = {
  name: string;
  version: string;
  description: string;
  author: string;
  keywords: string[];
  dependencies: Dependency[];
  dependents: string[];
  compatibility: string;
  /** bodies/ file id */
  readme: string;
  /** bodies/ file id */
  changelog?: string;
  /** Artifact ids */
  artifacts: string[];
  latestTag: string | null;
};

export type ArtifactKind = 'agent' | 'skill';

export type Artifact = {
  /** "<plugin>:<name>" */
  id: string;
  kind: ArtifactKind;
  plugin: string;
  name: string;
  description: string;
  tools?: string[];
  model?: string | null;
  /** bodies/ file id */
  body: string;
};

export type CatalogIndex = {
  generatedAt: string;
  commit: string | null;
  marketplace: { name: string; description: string; owner: string };
  plugins: Plugin[];
  artifacts: Artifact[];
};

export type Release = {
  plugin: string;
  version: string;
  tag: string;
  date: string | null;
  changes: string[];
};

export type Stats = {
  plugins: number;
  agents: number;
  skills: number;
  dependencyEdges: number;
  perPlugin: Record<string, { agents: number; skills: number }>;
};
