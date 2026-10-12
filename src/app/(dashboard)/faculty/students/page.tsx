import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, CheckCircle2, AlertCircle, Clock, ShieldCheck, Download } from 'lucide-react';

const mockDepartmentStudents = [
  {
    id: 'STU-2022-CSE-001',
    name: 'Aarav Sharma',
    email: 'aarav.s@univ.edu',
    cgpa: '9.12',
    year: '4th Year (2026)',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Go'],
    placementStatus: 'Placed',
    endorsed: true,
  },
  {
    id: 'STU-2022-CSE-014',
    name: 'Pooja Nair',
    email: 'pooja.n@univ.edu',
    cgpa: '8.85',
    year: '4th Year (2026)',
    skills: ['Python', 'PyTorch', 'Data Science', 'SQL'],
    placementStatus: 'Shortlisted',
    endorsed: true,
  },
  {
    id: 'STU-2022-CSE-042',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@univ.edu',
    cgpa: '7.95',
    year: '4th Year (2026)',
    skills: ['Java', 'Spring Boot', 'Docker'],
    placementStatus: 'Eligible',
    endorsed: false,
  },
  {
    id: 'STU-2022-CSE-077',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@univ.edu',
    cgpa: '8.40',
    year: '4th Year (2026)',
    skills: ['C++', 'Algorithms', 'System Design'],
    placementStatus: 'Eligible',
    endorsed: true,
  },
  {
    id: 'STU-2022-CSE-103',
    name: 'Vikram Mehta',
    email: 'vikram.m@univ.edu',
    cgpa: '6.90',
    year: '4th Year (2026)',
    skills: ['HTML', 'CSS', 'JavaScript'],
    placementStatus: 'Seeking Review',
    endorsed: false,
  },
];

export default function FacultyStudentsPage() {
  return (
    <PageContainer
      title="Department Student Cohort"
      description="View and verify academic records, CGPA endorsements, and placement eligibility for your assigned advisory candidates."
      breadcrumbs={[
        { label: 'Faculty', href: '/faculty' },
        { label: 'Students' },
      ]}
      badgeText="CSE Department"
      actions={
        <Button variant="outline" size="sm" className="text-sm gap-1.5 font-normal">
          <Download className="h-3.5 w-3.5 text-muted" />
          <span>Export Roster CSV</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <Input
              placeholder="Search by student name, roll number, or skill..."
              className="pl-9 text-sm h-10 bg-surface border-border text-foreground placeholder:text-muted"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-sm gap-1.5 h-10 font-normal">
              <Filter className="h-3.5 w-3.5 text-muted" />
              <span>All Statuses</span>
            </Button>
            <Button variant="outline" size="sm" className="text-sm gap-1.5 h-10 font-normal">
              <span>Year: 2026</span>
            </Button>
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="border border-border rounded-md bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-elevated text-muted uppercase tracking-wider text-sm">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student ID & Name</th>
                  <th className="py-3 px-4 font-semibold">CGPA</th>
                  <th className="py-3 px-4 font-semibold">Year & Cohort</th>
                  <th className="py-3 px-4 font-semibold">Skills</th>
                  <th className="py-3 px-4 font-semibold">Placement Status</th>
                  <th className="py-3 px-4 font-semibold">Advisory Endorsement</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {mockDepartmentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-elevated transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{s.name}</div>
                      <div className="text-sm text-muted font-mono">{s.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {s.cgpa}
                    </td>
                    <td className="py-3 px-4 text-muted">
                      {s.year}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {s.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="inline-block px-1.5 py-0.5 rounded bg-elevated border border-border text-sm text-muted"
                          >
                            {skill}
                          </span>
                        ))}
                        {s.skills.length > 3 && (
                          <span className="text-sm text-muted self-center">
                            +{s.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          s.placementStatus === 'Placed'
                            ? 'success'
                            : s.placementStatus === 'Shortlisted'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-sm"
                      >
                        {s.placementStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {s.endorsed ? (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Endorsed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                          <Clock className="h-3 w-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" className="text-sm h-7 px-2 font-normal">
                        {s.endorsed ? 'View Record' : 'Endorse'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-4 rounded-md border border-border bg-surface text-sm text-muted flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-foreground font-medium">Advisory Record Verification Policy</span>
            <p className="mt-0.5">
              Faculty endorsement certifies that the candidate has completed all required department labs, has no active academic conduct infractions, and meets the minimum attendance threshold for placement drive participation.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
