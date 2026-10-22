import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      <h1 className="font-bold text-lg">JobTrackr</h1>
      <div className="space-x-4 space-between">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
      </div>
    </nav>
  );
}
