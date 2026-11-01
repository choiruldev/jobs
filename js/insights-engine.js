/**
 * Advanced Insights & Recruitment Funnel Engine
 * Calculates recruitment conversion metrics and compiles side-by-side offer comparison matrices.
 */

export function calculateApplicationFunnel(applications = []) {
  const counts = {
    total: applications.length,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    accepted: 0,
    rejected: 0
  };

  applications.forEach((app) => {
    const status = (app.status || "").toLowerCase();
    if (status === "saved") counts.saved++;
    else if (status === "applied") counts.applied++;
    else if (status === "interview") counts.interview++;
    else if (status === "offer") counts.offer++;
    else if (status === "accepted") counts.accepted++;
    else if (status === "rejected") counts.rejected++;
    else counts.applied++;
  });

  const activeInPipeline = counts.applied + counts.interview + counts.offer;
  const totalEverApplied = counts.applied + counts.interview + counts.offer + counts.accepted + counts.rejected;

  const interviewRate = totalEverApplied > 0 
    ? Math.round(((counts.interview + counts.offer + counts.accepted) / totalEverApplied) * 100)
    : 0;

  const offerRate = (counts.interview + counts.offer + counts.accepted) > 0
    ? Math.round(((counts.offer + counts.accepted) / (counts.interview + counts.offer + counts.accepted)) * 100)
    : 0;

  const acceptanceRate = totalEverApplied > 0
    ? Math.round((counts.accepted / totalEverApplied) * 100)
    : 0;

  return {
    counts,
    activeInPipeline,
    totalEverApplied,
    rates: {
      interviewRate,
      offerRate,
      acceptanceRate
    }
  };
}

/**
 * Komparasi penawaran kerja (Offer & Accepted)
 */
export function buildOfferComparisonMatrix(items = []) {
  const offerItems = items.filter((item) => {
    const status = item.application?.status;
    return status === "Offer" || status === "Accepted";
  });

  return offerItems.map((item) => {
    const job = item.job || {};
    const app = item.application || {};
    return {
      id: job.id,
      company: job.company,
      title: job.title,
      status: app.status,
      salaryDisplay: typeof job.salary === "object" ? job.salary.display : (job.salary || "Negosiasi"),
      location: job.location,
      notes: app.note || "-",
      updatedAt: app.updatedAt
    };
  });
}
