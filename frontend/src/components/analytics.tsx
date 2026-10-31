
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Application = {
  id: number;
  company: string;
  role: string;
  status: string;
  application_date?: string | null;
};

type AnalyticsProps = {
  applications: Application[];
};

const COLORS = [
  "#64748b",
  "#3b82f6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
];

function Analytics({ applications }: AnalyticsProps) {

  
  const totalApplications = applications.length;

  const interviewCount = applications.filter(
    (app) => app.status.toLowerCase() === "interview"
  ).length;

  const offerCount = applications.filter(
    (app) => app.status.toLowerCase() === "offer"
  ).length;

  const interviewRate =
    totalApplications > 0
      ? ((interviewCount / totalApplications) * 100).toFixed(1)
      : "0.0";

  const offerRate =
    totalApplications > 0
      ? ((offerCount / totalApplications) * 100).toFixed(1)
      : "0.0";

  const activeCount = applications.filter((app) =>
  ["saved", "applied", "interview"].includes(app.status.toLowerCase())
).length;

const rejectedCount = applications.filter(
  (app) => app.status.toLowerCase() === "rejected"
).length;

const rejectionRate =
  totalApplications > 0
    ? ((rejectedCount / totalApplications) * 100).toFixed(1)
    : "0.0";

  const statuses = ["Saved", "Applied", "Interview", "Offer", "Rejected"];

  const chartData = statuses.map((status) => ({
    name: status,
    value: applications.filter(
      (app) => app.status.toLowerCase() === status.toLowerCase()
    ).length,
  }));


const monthlyData = applications.reduce(
  (acc, app) => {
    if (!app.application_date) return acc;

    const dateString = app.application_date.slice(0, 10);
    const [year, month] = dateString.split("-").map(Number);

    if (!year || !month || month < 1 || month > 12) return acc;

    const key = `${year}-${String(month).padStart(2, "0")}`;
    const existing = acc.find((item) => item.key === key);

    if (existing) {
      existing.applications += 1;
    } else {
      acc.push({
        key,
        month: new Date(year, month - 1, 1).toLocaleString("en-AU", {
          month: "short",
          year: "numeric",
        }),
        applications: 1,
      });
    }

    return acc;
  },
  [] as { key: string; month: string; applications: number }[]
);

monthlyData.sort((a, b) => a.key.localeCompare(b.key));


const stats = [
  { title: "Total Applications", value: totalApplications },
  { title: "Active Applications", value: activeCount },
  { title: "Interview Rate", value: `${interviewRate}%` },
  { title: "Offer Rate", value: `${offerRate}%` },
  { title: "Rejection Rate", value: `${rejectionRate}%` },
];

  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Analytics Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track your job application progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
            <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Applications by Status
        </h3>

        {totalApplications === 0 ? (
          <p className="py-12 text-center text-gray-500 dark:text-gray-400">
            Add applications to see your analytics.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                    data={chartData.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={{ fill: "#94a3b8" }}
                >
                {chartData
                  .filter((item) => item.value > 0)
                  .map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[statuses.indexOf(entry.name)]}
                    />
                  ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#ffffff",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend
                wrapperStyle={{ color: "#cbd5e1" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Application Trends
          </h3>

          {monthlyData.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              Add application dates to view your trends.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis allowDecimals={false} stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1e293b",
                                border: "1px solid #475569",
                                borderRadius: "8px",
                                color: "#ffffff",
                              }}
                            />
                <Bar
                  dataKey="applications"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
    </section>
  );
}



export default Analytics;
