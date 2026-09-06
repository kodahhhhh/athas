export type { GitDiff, GitDiffLine, GitHunk } from "@athas/editor-core";

export interface GitFile {
  path: string;
  status: "modified" | "added" | "deleted" | "untracked" | "renamed";
  staged: boolean;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: GitFile[];
}

export interface GitCommit {
  hash: string;
  message: string;
  description?: string;
  author: string;
  email?: string;
  date: string;
}

export interface GitDiffStat {
  file_path: string;
  staged: boolean;
  additions: number;
  deletions: number;
}

export interface GitRemote {
  name: string;
  url: string;
}

export interface GitStash {
  index: number;
  message: string;
  date: string;
}

export interface GitTag {
  name: string;
  commit: string;
  message?: string;
  date: string;
  is_annotated: boolean;
}

export interface GitWorktree {
  path: string;
  branch?: string;
  head: string;
  is_bare: boolean;
  is_detached: boolean;
  locked_reason?: string;
  prunable_reason?: string;
  is_current: boolean;
}

export interface GitBlame {
  file_path: string;
  lines: GitBlameLine[];
}

export interface GitBlameLine {
  line_number: number;
  total_lines: number;
  commit_hash: string;
  author: string;
  email: string;
  time: number;
  commit: string;
}
