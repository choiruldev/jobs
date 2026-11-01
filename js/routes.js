/**
 * Programmatic SEO & Routing Presets
 * Generates structured Schema.org JSON-LD data and handles canonical route configs.
 */

export const SEO_PRESETS = {
  "remote-indonesia": {
    title: "Lowongan Remote dari Indonesia | JobSearch",
    description: "Kumpulan lowongan kerja remote yang bisa dilamar dari Indonesia. Gaji kompetitif dalam IDR dan USD.",
    keywords: ["remote indonesia", "kerja dari rumah", "wfh indonesia", "loker remote"],
    searchParams: { source: "indonesia" }
  },
  "frontend-developer-remote": {
    title: "Lowongan Frontend Developer Remote | JobSearch",
    description: "Cari lowongan remote Frontend Developer (React, Vue, JavaScript, TypeScript) untuk kandidat Indonesia.",
    keywords: ["frontend developer remote", "react remote", "vue remote", "software engineer"],
    searchParams: { q: "Frontend Developer", category: "Teknologi" }
  },
  "data-analyst-remote": {
    title: "Lowongan Data Analyst Remote | JobSearch",
    description: "Lowongan remote Data Analyst, Business Intelligence, dan SQL untuk pencari kerja Indonesia.",
    keywords: ["data analyst remote", "sql remote", "bi analyst", "python data"],
    searchParams: { q: "Data Analyst", category: "Data" }
  },
  "marketing-remote": {
    title: "Lowongan Marketing Remote | JobSearch",
    description: "Lowongan remote Digital Marketing, SEO, Social Media, dan Growth Specialist untuk kandidat Indonesia.",
    keywords: ["digital marketing remote", "seo remote", "growth marketing", "content remote"],
    searchParams: { q: "Marketing", category: "Marketing" }
  },
  "fresh-graduate-remote": {
    title: "Lowongan Remote Fresh Graduate & Entry Level | JobSearch",
    description: "Peluang kerja remote untuk fresh graduate dan junior professional tanpa batasan lokasi.",
    keywords: ["fresh graduate remote", "junior remote", "entry level remote", "internship remote"],
    searchParams: { q: "Junior", exp: "entry" }
  }
};

/**
 * Generate Schema.org JSON-LD untuk JobPosting (Google Search Rich Results)
 */
export function generateJobPostingJsonLd(job) {
  if (!job) return null;

  return {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.descriptionHtml || job.descriptionText || job.description || job.title,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company,
      "value": job.id
    },
    "datePosted": job.postedAt || job.date || new Date().toISOString(),
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company,
      "logo": job.logo || undefined
    },
    "jobLocationType": "TELECOMMUTE",
    "applicantLocationRequirements": {
      "@type": "Country",
      "name": job.remoteTier === "indonesia" ? "Indonesia" : "Worldwide"
    },
    ...(job.salary?.min || job.salary?.max ? {
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": job.salary.currency || "USD",
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary.min || job.salary.max,
          "maxValue": job.salary.max || job.salary.min,
          "unitText": job.salary.period === "monthly" ? "MONTH" : "YEAR"
        }
      }
    } : {})
  };
}

/**
 * Injeksi JSON-LD ke tag <head> dokumen
 */
export function injectJsonLd(data) {
  if (!data || typeof document === "undefined") return;

  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
