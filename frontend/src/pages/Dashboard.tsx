import JobCard from "../components/JobCard";

export default function Dashboard() {
  const jobs = [
    { company: "Microsoft", role: "Frontend Developer", status: "Applied" },
    { company: "Google", role: "UI Engineer", status: "Interview" },
    { company: "Amazon", role: "React Developer", status: "Offer" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Applications</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job, index) => (
          <JobCard key={index} {...job} />
        ))}
      </div>
    </div>
  );
}
