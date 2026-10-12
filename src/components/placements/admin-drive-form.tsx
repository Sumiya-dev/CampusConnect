'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlacementDrive } from '@/lib/types/database.types';
import { DriveActionState } from '@/lib/types/drive.types';
import { createPlacementDriveAction, updatePlacementDriveAction } from '@/lib/placements/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Building,
  Briefcase,
  DollarSign,
  Calendar,
  GraduationCap,
  MapPin,
  FileText,
  ListChecks,
} from 'lucide-react';

interface AdminDriveFormProps {
  mode: 'create' | 'edit';
  initialDrive?: PlacementDrive;
  metadata: {
    departments: string[];
    programs: string[];
    years: number[];
    companies: { id: string; company_name: string; industry: string | null; location: string | null }[];
  };
  basePath: '/admin/placements' | '/placement/drives';
}

export function AdminDriveForm({
  mode,
  initialDrive,
  metadata,
  basePath,
}: AdminDriveFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [companyId, setCompanyId] = useState(initialDrive?.company_id || (metadata.companies[0]?.id || ''));
  const [jobRole, setJobRole] = useState(initialDrive?.job_role || '');
  const [packageDetails, setPackageDetails] = useState(initialDrive?.package_details || '');
  const [tier, setTier] = useState(initialDrive?.tier || 'Core Recruiter');
  const [location, setLocation] = useState(initialDrive?.location || '');
  const [description, setDescription] = useState(initialDrive?.description || '');
  const [minCgpa, setMinCgpa] = useState(initialDrive?.min_cgpa?.toString() || '6.50');
  const [maxBacklogs, setMaxBacklogs] = useState(initialDrive?.max_backlogs?.toString() || '0');
  const [graduationYear, setGraduationYear] = useState(initialDrive?.graduation_year?.toString() || '2026');

  // Multi-selects
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    initialDrive?.eligible_departments || metadata.departments.slice(0, 3)
  );
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(
    initialDrive?.eligible_programs || metadata.programs.slice(0, 2)
  );
  const [selectedYears, setSelectedYears] = useState<number[]>(
    initialDrive?.eligible_years || [3, 4]
  );

  // Formatting dates for datetime-local
  const toDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    } catch {
      return '';
    }
  };

  const [deadline, setDeadline] = useState(toDatetimeLocal(initialDrive?.registration_deadline));
  const [driveDate, setDriveDate] = useState(toDatetimeLocal(initialDrive?.drive_date));
  const [driveTime, setDriveTime] = useState(initialDrive?.drive_time || '09:30 AM');
  const [venue, setVenue] = useState(initialDrive?.venue || 'Campus Auditorium / Virtual MS Teams');
  const [vacancies, setVacancies] = useState(initialDrive?.vacancies || '');
  const [bondPeriod, setBondPeriod] = useState(initialDrive?.bond_period || 'None');
  const [status, setStatus] = useState(initialDrive?.status || 'open');
  const [isPublished, setIsPublished] = useState(initialDrive?.is_published !== false);

  // Arrays as strings for inputs
  const [skillsStr, setSkillsStr] = useState(initialDrive?.required_skills?.join(', ') || 'Data Structures, TypeScript, Problem Solving');
  const [stagesStr, setStagesStr] = useState(initialDrive?.recruitment_stages?.join(', ') || 'Online Assessment, Technical Interview, HR Interview');
  const [instructionsStr, setInstructionsStr] = useState(
    initialDrive?.instructions?.join('\n') || 'Please report in formal business attire.\nKeep university ID card and original academic transcripts ready.'
  );
  const [documentsStr, setDocumentsStr] = useState(
    initialDrive?.required_documents?.join(', ') || 'Updated Resume (2 copies), College ID Card, Government Photo ID'
  );

  const [state, setState] = useState<DriveActionState | null>(null);

  const toggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== dept));
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  const toggleProgram = (prog: string) => {
    if (selectedPrograms.includes(prog)) {
      setSelectedPrograms(selectedPrograms.filter((p) => p !== prog));
    } else {
      setSelectedPrograms([...selectedPrograms, prog]);
    }
  };

  const toggleYear = (yr: number) => {
    if (selectedYears.includes(yr)) {
      setSelectedYears(selectedYears.filter((y) => y !== yr));
    } else {
      setSelectedYears([...selectedYears, yr]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState(null);

    const formData = new FormData();
    formData.append('company_id', companyId);
    formData.append('job_role', jobRole);
    formData.append('package_details', packageDetails);
    formData.append('tier', tier);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('min_cgpa', minCgpa);
    formData.append('max_backlogs', maxBacklogs);
    if (graduationYear) formData.append('graduation_year', graduationYear);

    selectedDepts.forEach((d) => formData.append('eligible_departments', d));
    selectedPrograms.forEach((p) => formData.append('eligible_programs', p));
    selectedYears.forEach((y) => formData.append('eligible_years', y.toString()));

    formData.append('required_skills', skillsStr);
    formData.append('recruitment_stages', stagesStr);
    formData.append('instructions', instructionsStr);
    formData.append('required_documents', documentsStr);

    formData.append('registration_deadline', deadline);
    if (driveDate) formData.append('drive_date', driveDate);
    formData.append('drive_time', driveTime);
    formData.append('venue', venue);
    formData.append('vacancies', vacancies);
    formData.append('bond_period', bondPeriod);
    formData.append('status', status);
    formData.append('is_published', isPublished ? 'true' : 'false');

    startTransition(async () => {
      let res: DriveActionState;
      if (mode === 'create') {
        res = await createPlacementDriveAction(null, formData);
      } else if (initialDrive) {
        res = await updatePlacementDriveAction(initialDrive.id, null, formData);
      } else {
        return;
      }

      setState(res);

      if (res.success && res.driveId) {
        setTimeout(() => {
          router.push(`${basePath}/${res.driveId}`);
        }, 500);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Back Link */}
      <div>
        <Link
          href={initialDrive ? `${basePath}/${initialDrive.id}` : basePath}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {initialDrive ? initialDrive.job_role : 'Placement Drives Directory'}</span>
        </Link>
      </div>

      {/* Status Banners */}
      {state?.error && (
        <div className="p-3.5 rounded-md border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Validation or submission error</div>
            <div>{state.error}</div>
          </div>
        </div>
      )}

      {state?.success && (
        <div className="p-3.5 rounded-md border border-green-500/30 bg-green-500/10 text-xs text-green-500 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Success</div>
            <div>{state.message} Redirecting...</div>
          </div>
        </div>
      )}

      {/* SECTION 1: CORPORATE RECRUITER & ROLE INFORMATION */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Building className="h-4 w-4 text-accent" />
            Corporate Recruiter & Role Information
          </h3>
          <div className="border-b border-border my-2" />
          <p className="text-xs text-muted">
            Specify the hiring partner organization, designation, compensation tier, and workplace details.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Company Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Recruiting Partner Company <span className="text-accent">*</span>
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-md text-foreground text-xs h-10 px-3 focus:outline-none focus:border-accent"
            >
              <option value="">Select an active company...</option>
              {metadata.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} {c.location ? `(${c.location})` : ''}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.company_id && (
              <div className="text-xs text-red-500">{state.fieldErrors.company_id}</div>
            )}
          </div>

          {/* Job Role & Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Job Role / Designation <span className="text-accent">*</span>
              </label>
              <Input
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Software Development Engineer - I"
                required
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
              {state?.fieldErrors?.job_role && (
                <div className="text-xs text-red-500">{state.fieldErrors.job_role}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Package / CTC (Compensation) <span className="text-accent">*</span>
              </label>
              <Input
                value={packageDetails}
                onChange={(e) => setPackageDetails(e.target.value)}
                placeholder="e.g. ₹14.5 LPA (₹12.0 LPA Fixed + Bonus)"
                required
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
              {state?.fieldErrors?.package_details && (
                <div className="text-xs text-red-500">{state.fieldErrors.package_details}</div>
              )}
            </div>
          </div>

          {/* Tier & Work Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Recruitment Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-surface border border-border rounded-md text-foreground text-xs h-10 px-3 focus:outline-none focus:border-accent"
              >
                <option value="Super Dream (20+ LPA)">Super Dream (20+ LPA)</option>
                <option value="Dream (10–20 LPA)">Dream (10–20 LPA)</option>
                <option value="Core Recruiter">Core Recruiter</option>
                <option value="Mass Recruiter">Mass Recruiter</option>
                <option value="Emerging Startup">Emerging Startup</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Job Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru / Hyderabad / Remote"
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Role Overview & Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline candidate responsibilities, expectations, team description, and day-to-day workflow..."
              className="w-full rounded-md bg-surface border border-border p-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ELIGIBILITY & ACADEMIC RESTRICTIONS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-accent" />
            Academic Eligibility & Cohort Guardrails
          </h3>
          <div className="border-b border-border my-2" />
          <p className="text-xs text-muted">
            Define quantitative GPA cutoffs, active backlog restrictions, and authorized departments or degree programs.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* CGPA, Backlogs, Graduation Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Minimum CGPA Required</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                placeholder="6.50"
                required
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
              {state?.fieldErrors?.min_cgpa && (
                <div className="text-xs text-red-500">{state.fieldErrors.min_cgpa}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Max Active Backlogs Allowed</label>
              <Input
                type="number"
                min="0"
                max="10"
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(e.target.value)}
                placeholder="0"
                required
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Graduation Year (Batch)</label>
              <Input
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2026"
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>
          </div>

          {/* Academic Year Selection (1st, 2nd, 3rd, 4th Year) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Eligible Academic Standing / Years <span className="text-accent">*</span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {metadata.years.map((y) => {
                const checked = selectedYears.includes(y);
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => toggleYear(y)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                      checked
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-surface text-muted hover:text-foreground'
                    }`}
                  >
                    Year {y}
                  </button>
                );
              })}
            </div>
            {state?.fieldErrors?.eligible_years && (
              <div className="text-xs text-red-500">{state.fieldErrors.eligible_years}</div>
            )}
          </div>

          {/* Eligible Departments */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Eligible Departments <span className="text-accent">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {metadata.departments.map((dept) => {
                const isSelected = selectedDepts.includes(dept);
                return (
                  <label
                    key={dept}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'border-accent/60 bg-accent/5 text-foreground'
                        : 'border-border bg-surface text-muted hover:text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDept(dept)}
                      className="accent-accent"
                    />
                    <span>{dept}</span>
                  </label>
                );
              })}
            </div>
            {state?.fieldErrors?.eligible_departments && (
              <div className="text-xs text-red-500">{state.fieldErrors.eligible_departments}</div>
            )}
          </div>

          {/* Eligible Programs */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Eligible Degree Programs / Specializations
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {metadata.programs.map((prog) => {
                const isSelected = selectedPrograms.includes(prog);
                return (
                  <label
                    key={prog}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'border-accent/60 bg-accent/5 text-foreground'
                        : 'border-border bg-surface text-muted hover:text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProgram(prog)}
                      className="accent-accent"
                    />
                    <span>{prog}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Required Technical Competencies & Skills (Comma-separated)
            </label>
            <Input
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. Python, SQL, REST APIs, Distributed Systems"
              className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: DRIVE SCHEDULE & LOGISTICS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            Drive Schedule, Venue & Logistics
          </h3>
          <div className="border-b border-border my-2" />
          <p className="text-xs text-muted">
            Specify application cutoff deadline, assessment dates, interview stages, and test venue.
          </p>
        </div>

        <div className="space-y-4 pt-1">
          {/* Registration Deadline & Drive Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">
                Application Cutoff Deadline <span className="text-accent">*</span>
              </label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
              {state?.fieldErrors?.registration_deadline && (
                <div className="text-xs text-red-500">{state.fieldErrors.registration_deadline}</div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Recruitment Drive Date</label>
              <Input
                type="datetime-local"
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
              {state?.fieldErrors?.drive_date && (
                <div className="text-xs text-red-500">{state.fieldErrors.drive_date}</div>
              )}
            </div>
          </div>

          {/* Time & Venue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Time / Slot</label>
              <Input
                value={driveTime}
                onChange={(e) => setDriveTime(e.target.value)}
                placeholder="e.g. 09:00 AM – 05:00 PM"
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Venue / Platform</label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Main Auditorium / Lab 3 / Online Webex"
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>
          </div>

          {/* Recruitment Stages */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">
              Recruitment Evaluation Stages (Comma-separated)
            </label>
            <Input
              value={stagesStr}
              onChange={(e) => setStagesStr(e.target.value)}
              placeholder="e.g. Online Test, Technical Interview 1, Technical Interview 2, HR Round"
              className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Candidate Instructions (One per line)</label>
            <textarea
              rows={3}
              value={instructionsStr}
              onChange={(e) => setInstructionsStr(e.target.value)}
              placeholder="Enter special candidate instructions..."
              className="w-full rounded-md bg-surface border border-border p-2.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Required Documents */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Required Documents (Comma-separated)</label>
            <Input
              value={documentsStr}
              onChange={(e) => setDocumentsStr(e.target.value)}
              placeholder="e.g. 2 Hard Copies of Resume, College ID, 10th/12th Marksheets"
              className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
            />
          </div>

          {/* Vacancies & Bond Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Estimated Vacancies</label>
              <Input
                value={vacancies}
                onChange={(e) => setVacancies(e.target.value)}
                placeholder="e.g. 15 Openings"
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">Service Agreement / Bond</label>
              <Input
                value={bondPeriod}
                onChange={(e) => setBondPeriod(e.target.value)}
                placeholder="e.g. None / 1 Year"
                className="bg-surface border-border text-foreground text-xs h-10 focus:border-accent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: GOVERNANCE & STATUS CONFIGURATION */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-accent" />
            Governance, Publishing & Status
          </h3>
          <div className="border-b border-border my-2" />
          <p className="text-xs text-muted">
            Control student portal visibility and operational lifecycle phase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          {/* Drive Status Radio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Drive Operational Phase</label>
            <div className="space-y-2">
              {[
                { value: 'open', label: 'Applications Open' },
                { value: 'in_progress', label: 'In Progress (Active Hiring)' },
                { value: 'completed', label: 'Completed (Concluded)' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'archived', label: 'Archived' },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    value={item.value}
                    checked={status === item.value}
                    onChange={() => setStatus(item.value as any)}
                    className="accent-accent"
                  />
                  <span className={status === item.value ? 'text-foreground font-medium' : 'text-muted'}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Visibility Checkbox */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted">Student Portal Visibility</label>
            <label className="flex items-start gap-2.5 p-3 rounded border border-border bg-surface cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-accent mt-0.5"
              />
              <div className="text-xs">
                <div className="font-semibold text-foreground">Publish Drive Immediately</div>
                <div className="text-muted mt-0.5">
                  When enabled, eligible students will see this campaign in their placement dashboard. When disabled, the drive remains in draft mode.
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isPending}
          className="text-xs h-10 px-5 gap-1.5 font-medium"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <span>{mode === 'create' ? 'Schedule & Create Drive' : 'Save Drive Changes'}</span>
        </Button>

        <Link href={initialDrive ? `${basePath}/${initialDrive.id}` : basePath}>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="text-xs h-10 px-4 border-border text-muted hover:text-foreground"
          >
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
