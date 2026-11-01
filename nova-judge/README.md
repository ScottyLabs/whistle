# Nova judge tool: frontend

React + TypeScript (Vite) site for judges. Shows projects by subteam, lets judges write private or shared notes, and shows a live summary of shared notes.

## Run

    cd frontend
    npm install
    npm run dev

The site expects the backend at `http://localhost:8000` (see the `API` constant in `src/App.tsx`). Start the backend first.

## Notes

- Sign-in is a placeholder: a judge picks a name and subteam. Real Google sign-in is not built.
- The live summary currently lists shared notes. The AI summary is not built.
- `src/mockProjects.ts` holds the `Project` type. The mock data in it is no longer used.