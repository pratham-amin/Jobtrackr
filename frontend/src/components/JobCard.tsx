interface JobProps {
  company: string;
  role: string;
  status: string;
}

export default function JobCard({ company, role, status }: JobProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
      <h3 className="font-bold text-lg">{role}</h3>
      <p className="text-gray-700">{company}</p>
      <span className="text-sm text-blue-600">{status}</span>
    </div>
  );
}
