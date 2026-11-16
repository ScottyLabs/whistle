# whistle

AI summarization platform for NOVA and TartanHacks submissions.

## Features
- **Automated project summaries.** Converts team submissions into structured project pages organized by subteam, highlighting problems, solutions, key features, and tech stacks.
- **Evidence-backed summaries.** Links project features to relevant presentation slides, source code locations, and demonstration timestamps.
- **AI feature chat.** Allows judges to ask project-specific questions and retrieve relevant evidence from team submissions.
- **Live judging notes.** Supports feature-specific and shared notes during demonstrations, with automatically updated summaries for deliberation.
- **Judge authentication.** Google sign-in with role-based access control and subteam-specific permissions.
- **Fault-tolerant processing.** Handles missing submissions, inaccessible resources, and failed processing without blocking other projects.
- **Self-hosted data.** SQLite-backed storage for projects, summaries, notes, transcripts, and evidence references.

## Architecture
React and TypeScript frontend, FastAPI backend, SQLite database, OpenRouter for AI processing.

## Maintainers
Developed and maintained by [ScottyLabs](https://scottylabs.org/) at Carnegie Mellon University.