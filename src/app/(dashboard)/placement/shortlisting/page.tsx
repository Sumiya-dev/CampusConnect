import Link from 'next/link';

const shortlists = [
  {
    id: 'msft',
    company: 'Microsoft',
    role: 'SDE',
    round: 'Final Technical Round',
    count: 45,
    status: 'Published',
  },
  {
    id: 'tcs',
    company: 'TCS',
    role: 'Digital Software Engineer',
    round: 'Technical Interview Round 1',
    count: 180,
    status: 'Pending Verification',
  },
  {
    id: 'deloitte',
    company: 'Deloitte',
    role: 'Technology Analyst',
    round: 'Online Assessment',
    count: 110,
    status: 'Published',
  },
];

export default function PlacementShortlistingPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEDED]">
            Shortlisting
          </h1>
          <p className="text-sm text-[#9AA1AA] mt-1">
            Review and manage recruiter shortlists.
          </p>
        </div>
        <div>
          <Link
            href="/placement/shortlisting/upload"
            className="inline-flex items-center justify-center text-sm font-medium transition-colors bg-[#FF6B00] text-white hover:bg-[#FF6B00]/90 h-9 px-4 py-2 rounded-md"
          >
            Upload Shortlist
          </Link>
        </div>
      </div>

      <div className="border-t border-[#222222]" />

      {/* Active Shortlists */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[#9AA1AA]">
          Active Shortlists
        </h2>
        <div className="divide-y divide-[#222222]">
          {shortlists.map((sl) => (
            <div
              key={sl.id}
              className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1"
            >
              <div>
                <div className="text-sm font-medium text-[#EDEDED]">
                  {sl.company} — {sl.role}
                </div>
                <div className="text-xs text-[#9AA1AA] mt-0.5">
                  {sl.round} · {sl.count} candidates · {sl.status}
                </div>
              </div>
              <Link
                href={`/placement/shortlisting/${sl.id}`}
                className="text-xs font-medium text-[#FF6B00] hover:text-[#FFA347] transition-colors"
              >
                Manage →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
