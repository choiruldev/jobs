/**
 * Developer & Designer Proof-of-Work Card Builder
 * Creates shareable micro-portfolio cards highlighting GitHub projects, live demos, and impact metrics.
 */

const PORTFOLIO_STORAGE_KEY = "jsa_portfolio_card_v1";

export const DEFAULT_PORTFOLIO = {
  name: "Budi Santoso",
  headline: "Fullstack Engineer specializing in React, Node.js & Scalable Web Architecture",
  location: "Jakarta, Indonesia (Available for Remote)",
  bio: "Passionate about building fast, accessible web applications and developer tools. Experienced in distributed teams and asynchronous collaboration.",
  skills: ["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Docker", "Tailwind CSS"],
  githubUrl: "https://github.com/budisantoso",
  linkedinUrl: "https://linkedin.com/in/budisantoso",
  projects: [
    {
      title: "Real-Time Collaborative Canvas",
      tech: "React, WebSockets, Canvas API",
      metrics: "5,000+ active sessions, < 25ms state sync",
      liveUrl: "https://demo-canvas.dev",
      repoUrl: "https://github.com/budisantoso/canvas"
    },
    {
      title: "High-Throughput E-Commerce API",
      tech: "Node.js, Redis, PostgreSQL",
      metrics: "Handles 1,200 req/sec with 99.9% uptime",
      liveUrl: "https://api-demo.dev",
      repoUrl: "https://github.com/budisantoso/api"
    }
  ]
};

export function readPortfolioData() {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    return raw ? { ...DEFAULT_PORTFOLIO, ...JSON.parse(raw) } : { ...DEFAULT_PORTFOLIO };
  } catch (err) {
    return { ...DEFAULT_PORTFOLIO };
  }
}

export function writePortfolioData(data) {
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    return false;
  }
}
