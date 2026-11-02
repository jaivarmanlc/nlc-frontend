import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import GalleryGroup from "../components/Gallery";

export default function GalleryPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/gallery")
      .then(({ data }) => setGroups(data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c9a227]">
          NLC Township
        </p>
        <h2 className="mt-2 text-3xl font-semibold">Block-wise Hall Gallery</h2>
        <p className="mt-2 text-[#f6f3ea]/70 max-w-2xl">
          Browse interiors, stage setups, dining arrangements, and event
          decorations for each community hall. Click any image to view full-size.
        </p>
        <Link
          to="/book"
          className="mt-4 inline-block rounded-md bg-[#c9a227] px-5 py-2 text-sm font-semibold text-[#06201c] hover:bg-[#e0b83a] transition-colors"
        >
          Book a hall →
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <p className="glass-card rounded-2xl p-6 text-[#f6f3ea]/50">
          Loading gallery…
        </p>
      )}

      {/* Gallery groups, one per hall */}
      {groups.map((group) => (
        <div key={group.hall_id} className="glass-card rounded-2xl p-5 md:p-6">
          <GalleryGroup group={group} />
        </div>
      ))}

      {!loading && groups.length === 0 && (
        <p className="glass-card rounded-2xl p-6 text-[#f6f3ea]/50">
          No gallery images available yet.
        </p>
      )}
    </div>
  );
}
