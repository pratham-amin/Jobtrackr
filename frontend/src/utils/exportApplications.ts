
type Application = {
  id: number;
  company: string;
  role: string;
  status: string;
  application_date?: string | null;
  job_url?: string | null;
  description?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function exportApplications(applications: Application[]) {
  if (applications.length === 0) {
    alert("No applications available to export.");
    return;
  }

  const headers = [
    "ID",
    "Company",
    "Role",
    "Status",
    "Application Date",
    "Job URL",
    "Description",
    "Notes",
    "Created At",
    "Updated At",
  ];

  const rows = applications.map((app) => [
    app.id,
    app.company,
    app.role,
    app.status,
    app.application_date || "",
    app.job_url || "",
    app.description || "",
    app.notes || "",
    app.created_at || "",
    app.updated_at || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "JobTrackr_Applications.csv";
  link.click();

  URL.revokeObjectURL(url);
}
