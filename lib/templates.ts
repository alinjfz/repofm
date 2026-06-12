export type HostTemplateId = "explainer-roaster" | "hype-skeptic" | "investor-engineer";

export type HostTemplate = {
  id: HostTemplateId;
  name: string;
  hostA: string;
  hostB: string;
  description: string;
  systemPersona: string;
  voices: {
    alex: string;
    sam: string;
  };
};

export const hostTemplates: HostTemplate[] = [
  {
    id: "explainer-roaster",
    name: "Explainer + Roaster",
    hostA: "Alex",
    hostB: "Sam",
    description: "Clear architecture walkthrough meets affectionate codebase heckling.",
    systemPersona:
      "Alex explains the repository clearly and generously. Sam is witty, skeptical, and roasts names, patterns, and tech choices without being cruel.",
    voices: {
      alex: "21m00Tcm4TlvDq8ikWAM",
      sam: "pNInz6obpgDQGcFmaJgB"
    }
  },
  {
    id: "hype-skeptic",
    name: "Hype vs Skeptic",
    hostA: "Maya",
    hostB: "Rowan",
    description: "One host sees the vision; the other stress-tests every assumption.",
    systemPersona:
      "Maya is energetic and future-facing. Rowan asks sharp practical questions about maintenance, adoption, and tradeoffs.",
    voices: {
      alex: "EXAVITQu4vr4xnSDxMaL",
      sam: "ErXwobaYiN019PkySvjV"
    }
  },
  {
    id: "investor-engineer",
    name: "Investor vs Engineer",
    hostA: "Iris",
    hostB: "Noah",
    description: "Market narrative on one side, implementation reality on the other.",
    systemPersona:
      "Iris frames why the project matters and where the opportunity is. Noah explains the implementation details and calls out what is hard.",
    voices: {
      alex: "TxGEqnHWrfWFTfGW9XjX",
      sam: "VR6AewLTigWG4xSOukaG"
    }
  }
];

export const defaultTemplate = hostTemplates[0];

export const demoEpisodes = [
  {
    repo: "expressjs/express",
    template: "Explainer + Roaster",
    summary: "The tiny web framework that became a Node.js cultural landmark.",
    href: "/episode/demo-express"
  },
  {
    repo: "vercel/next.js",
    template: "Hype vs Skeptic",
    summary: "A tour through the framework that keeps trying to become the whole restaurant.",
    href: "/episode/demo-next"
  },
  {
    repo: "supabase/supabase",
    template: "Investor vs Engineer",
    summary: "Open-source Firebase energy, Postgres roots, and a lot of moving pieces.",
    href: "/episode/demo-supabase"
  }
];

export function getTemplate(id: string | null | undefined) {
  return hostTemplates.find((template) => template.id === id) ?? defaultTemplate;
}
