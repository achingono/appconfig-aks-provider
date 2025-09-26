# Documentation Guidelines

Purpose
- Keep docs concise, task-focused, and aligned with the codebase.
- Treat docs as code: versioned, reviewed, and updated alongside changes.

Structure
- `docs/README.md` is the entry point.
- Topic files:
  - `overview.md` – What this project is and how to run it quickly.
  - `core-technologies.md` – The main stacks and libraries.
  - `architecture.md` – How components interact and key design choices.
  - `development.md` – Day-to-day developer workflow and conventions.

Authoring Standards
- Use Markdown, prefer short paragraphs and lists.
- Use inline code quotes for filenames, CLI flags, env vars, and keys.
- Link to source files with relative paths when helpful.
- Include code snippets only when they are necessary and safe from drift.

Change Management
- When modifying Helm values, deployments, or scripts, update the relevant doc sections.
- Add a brief “What changed and why” note in PR descriptions.
- Keep breaking changes called out in the overview or a CHANGELOG if introduced.

Verification
- After edits, test the quick start flow.
- Validate URLs, hostnames, and commands.
- Ensure examples reflect the default values in `helm/values.yaml` and `deploy.sh`.
