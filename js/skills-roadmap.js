/**
 * Interactive Tech Skills Roadmap & Market Value Engine
 * Maps technology skills progression to market compensation premiums for Indonesian engineers.
 */

export const SKILL_TRACKS = {
  frontend: {
    id: "frontend",
    title: "Frontend Engineering",
    icon: "code",
    baseSalaryIdr: 12000000,
    steps: [
      { id: "fe_basics", name: "Fondasi Web", skills: ["Semantic HTML5", "Modern CSS / Flexbox / Grid", "JavaScript (ES6+)"], premiumPercent: 0 },
      { id: "fe_react", name: "Komponen Modern", skills: ["React.js", "State Management (Zustand/Redux)", "Tailwind CSS"], premiumPercent: 20 },
      { id: "fe_ts", name: "Type Safety & Production", skills: ["TypeScript", "Next.js / SSR", "REST API & GraphQL"], premiumPercent: 35 },
      { id: "fe_perf", name: "Skala & Arsitektur", skills: ["Web Vitals Optimization", "Testing (Jest/Playwright)", "CI/CD & Micro-frontends"], premiumPercent: 55 }
    ]
  },
  backend: {
    id: "backend",
    title: "Backend & Distributed Systems",
    icon: "database",
    baseSalaryIdr: 14000000,
    steps: [
      { id: "be_basics", name: "Fondasi Server", skills: ["RESTful APIs", "Relational DB (PostgreSQL)", "Git & Linux CLI"], premiumPercent: 0 },
      { id: "be_go_node", name: "High-Concurrency Language", skills: ["Golang / Node.js", "Redis Caching", "Docker Containerization"], premiumPercent: 25 },
      { id: "be_dist", name: "Sistem Terdistribusi", skills: ["gRPC & Protocol Buffers", "Message Queues (Kafka/RabbitMQ)", "Database Sharding"], premiumPercent: 45 },
      { id: "be_lead", name: "Arsitektur Skala Besar", skills: ["Event-Driven Architecture", "Observability (OpenTelemetry)", "High-Availability 99.99%"], premiumPercent: 70 }
    ]
  },
  devops: {
    id: "devops",
    title: "DevOps & Cloud Infrastructure",
    icon: "cloud",
    baseSalaryIdr: 16000000,
    steps: [
      { id: "ops_basics", name: "Fondasi Sistem", skills: ["Linux Administration", "Bash Scripting", "Networking (TCP/DNS/SSL)"], premiumPercent: 0 },
      { id: "ops_cicd", name: "Otomasi & Kontainer", skills: ["Docker & Compose", "CI/CD (GitHub Actions/GitLab)", "AWS / GCP Core"], premiumPercent: 30 },
      { id: "ops_k8s", name: "Orkestrasi Cloud", skills: ["Kubernetes (K8s)", "Infrastructure as Code (Terraform)", "Helm Charts"], premiumPercent: 55 },
      { id: "ops_sec", name: "DevSecOps & Reliabilitas", skills: ["Site Reliability Engineering (SRE)", "Prometheus & Grafana", "Zero-Trust Security"], premiumPercent: 80 }
    ]
  },
  data_ai: {
    id: "data_ai",
    title: "Data & AI Engineering",
    icon: "psychology",
    baseSalaryIdr: 15000000,
    steps: [
      { id: "data_basics", name: "Analisis & Query", skills: ["Advanced SQL", "Python for Data", "ETL Pipelines"], premiumPercent: 0 },
      { id: "data_eng", name: "Data Warehouse & Lakes", skills: ["dbt", "Apache Airflow", "Snowflake / BigQuery"], premiumPercent: 30 },
      { id: "ai_rag", name: "GenAI & LLM Ops", skills: ["Vector Databases (pgvector/Pinecone)", "RAG Systems", "LangChain / LlamaIndex"], premiumPercent: 60 },
      { id: "ai_prod", name: "Model Deployment", skills: ["MLflow", "Triton Inference Server", "Fine-Tuning Open Source LLMs"], premiumPercent: 90 }
    ]
  }
};

const MASTERED_SKILLS_KEY = "jsa_mastered_skills_v1";

export function readMasteredSkills() {
  try {
    const raw = localStorage.getItem(MASTERED_SKILLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function writeMasteredSkills(skills) {
  try {
    localStorage.setItem(MASTERED_SKILLS_KEY, JSON.stringify(skills));
    return true;
  } catch (err) {
    return false;
  }
}

export function calculateEstimatedMarketRate(trackId, masteredSkills = []) {
  const track = SKILL_TRACKS[trackId] || SKILL_TRACKS.frontend;
  let totalPremiumPercent = 0;
  let totalSkillsInTrack = 0;
  let masteredCount = 0;

  track.steps.forEach(step => {
    step.skills.forEach(skill => {
      totalSkillsInTrack++;
      if (masteredSkills.includes(skill)) {
        masteredCount++;
        totalPremiumPercent += (step.premiumPercent / step.skills.length);
      }
    });
  });

  const estimatedSalary = Math.round(track.baseSalaryIdr * (1 + (totalPremiumPercent / 100)));
  const progressPercent = totalSkillsInTrack > 0 ? Math.round((masteredCount / totalSkillsInTrack) * 100) : 0;

  return {
    track,
    masteredCount,
    totalSkillsInTrack,
    progressPercent,
    estimatedSalary,
    estimatedForeignUsd: Math.round(estimatedSalary / 16200)
  };
}
