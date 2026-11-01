export type Project = {
  id: string;
  teamName: string;
  subteam: string;
  githubLink: string;
  slideshowLink: string;
  oneLiner: string;
  whatItDoes: string;
  features: { name: string; description: string }[];
  gaps: string[];
};

export const projects: Project[] = [
  {
    id: "team-alpha",
    teamName: "Team Alpha",
    subteam: "Healthcare",
    githubLink: "https://github.com/example/alpha",
    slideshowLink: "https://example.com/alpha-slides",
    oneLiner: "An app that tracks medication.",
    whatItDoes: "Reminds patients when to take their pills.",
    features: [{ name: "Login flow", description: "Email sign in" }],
    gaps: ["No info on how data is stored"],
  },
  {
    id: "team-beta",
    teamName: "Team Beta",
    subteam: "Healthcare",
    githubLink: "https://github.com/example/beta",
    slideshowLink: "https://example.com/beta-slides",
    oneLiner: "A symptom checker.",
    whatItDoes: "Asks questions and suggests next steps.",
    features: [{ name: "Chat", description: "Question flow" }],
    gaps: [],
  },
  {
    id: "team-gamma",
    teamName: "Team Gamma",
    subteam: "Education",
    githubLink: "https://github.com/example/gamma",
    slideshowLink: "https://example.com/gamma-slides",
    oneLiner: "A flashcard generator.",
    whatItDoes: "Turns lecture notes into flashcards.",
    features: [{ name: "Upload", description: "PDF upload" }],
    gaps: ["Demo link missing"],
  },
];