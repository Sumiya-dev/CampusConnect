import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/user';
import { getFacultyScheduledSessions } from '@/lib/faculty/queries';
import { ArrowRight } from 'lucide-react';

export default async function FacultyClassesSchedulePage() {
  const user = await getCurrentUser();
  const schedule = await getFacultyScheduledSessions(user?.id);

  const hasAnySessions =
    schedule.today.length > 0 ||
    schedule.tomorrow.length > 0 ||
    schedule.upcoming.length > 0;

  return (
    <div className="max-w-2xl space-y-10">
      {/* Title */}
      <div>
        <h1 className="text-xl font-medium tracking-tight text-[#EDEDED]">
          Classes
        </h1>
      </div>

      {!hasAnySessions ? (
        <div className="py-8 text-sm text-[#9AA1AA]">
          No classes or training sessions currently allocated to your schedule.
        </div>
      ) : (
        <div className="space-y-10">
          {/* TODAY */}
          {schedule.today.length > 0 && (
            <section className="space-y-3">
              <div className="border-b border-[#222222] pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA]">
                  Today
                </span>
              </div>

              <div className="divide-y divide-[#181818]">
                {schedule.today.map((sess) => (
                  <SessionRow key={sess.id} session={sess} />
                ))}
              </div>
            </section>
          )}

          {/* TOMORROW */}
          {schedule.tomorrow.length > 0 && (
            <section className="space-y-3">
              <div className="border-b border-[#222222] pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA]">
                  Tomorrow
                </span>
              </div>

              <div className="divide-y divide-[#181818]">
                {schedule.tomorrow.map((sess) => (
                  <SessionRow key={sess.id} session={sess} />
                ))}
              </div>
            </section>
          )}

          {/* UPCOMING */}
          {schedule.upcoming.length > 0 && (
            <section className="space-y-3">
              <div className="border-b border-[#222222] pb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#9AA1AA]">
                  Upcoming
                </span>
              </div>

              <div className="divide-y divide-[#181818]">
                {schedule.upcoming.map((sess) => (
                  <SessionRow key={sess.id} session={sess} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SessionRow({ session }: { session: any }) {
  return (
    <Link
      href={`/faculty/classes/${session.id}`}
      className="group block py-4 text-left transition-colors hover:text-[#FF6B00]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {/* Time */}
          <div className="text-xs text-[#9AA1AA] font-mono">
            {session.time_range}
          </div>

          {/* Subject / Training Name */}
          <div className="text-base text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
            {session.training_name}
          </div>

          {/* Context: Year · Section */}
          <div className="text-xs text-[#9AA1AA]">
            {session.year_label} · {session.section_code}
          </div>

          {/* Room / Venue */}
          <div className="text-xs text-[#9AA1AA]">
            {session.venue}
          </div>

          {/* Registered count */}
          <div className="text-xs text-[#9AA1AA] pt-0.5">
            {session.registered_count} students registered
          </div>
        </div>

        {/* Right Arrow */}
        <div className="pt-2">
          <ArrowRight className="h-4 w-4 text-[#9AA1AA] group-hover:text-[#FF6B00] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
