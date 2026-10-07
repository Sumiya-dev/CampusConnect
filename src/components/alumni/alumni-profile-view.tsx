'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  GraduationCap,
  Briefcase,
  MapPin,
  ExternalLink,
  Send,
  BookOpen,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { AlumniExperience, AlumniProfile } from '@/lib/types/alumni.types';
import { Button } from '@/components/ui/button';
import { RequestGuidanceModal } from './request-guidance-modal';
import { AlumniNavigation } from './alumni-navigation';

interface AlumniProfileViewProps {
  profile: AlumniProfile;
  experiences: AlumniExperience[];
  isStudent?: boolean;
  baseHref?: string;
}

export function AlumniProfileView({
  profile,
  experiences,
  isStudent = true,
  baseHref = '/student/alumni',
}: AlumniProfileViewProps) {
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);

  const displayName = profile.user?.name || 'Alumni Graduate';
  const displayDepartment = profile.department || profile.user?.department || 'Engineering';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Sub-Navigation & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AlumniNavigation baseHref={baseHref} isStudentOrAlumni={isStudent} />
        <Link
          href={baseHref}
          className="inline-flex items-center gap-1.5 text-xs text-[#9AA1AA] hover:text-[#EDEDED] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Alumni Directory</span>
        </Link>
      </div>

      {/* Profile Header Hero */}
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-xl font-bold text-[#FF6B00] shrink-0 overflow-hidden">
              {profile.user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.user.avatar_url}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-[#EDEDED]">{displayName}</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/30">
                  Verified Alumni
                </span>
              </div>

              {(profile.job_role || profile.current_company) && (
                <p className="text-sm text-[#EDEDED] font-medium flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-[#FF6B00]" />
                  <span>
                    {profile.job_role}
                    {profile.current_company && ` at ${profile.current_company}`}
                  </span>
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-[#9AA1AA] pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-[#717784]" />
                  {displayDepartment}
                </span>
                {profile.graduation_year && (
                  <>
                    <span className="text-[#333333]">•</span>
                    <span className="font-mono text-[#FF6B00]">Class of {profile.graduation_year}</span>
                  </>
                )}
                {profile.location && (
                  <>
                    <span className="text-[#333333]">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#717784]" />
                      {profile.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 self-start md:self-center">
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9AA1AA] hover:text-[#EDEDED] bg-[#121212] border border-[#222222] rounded-md transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3 text-[#717784]" />
              </a>
            )}

            {isStudent && (
              <Button
                onClick={() => setIsGuidanceOpen(true)}
                size="sm"
                className="gap-1.5 text-xs font-semibold bg-[#FF6B00] text-black hover:bg-[#E05E00]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Request Guidance</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Sections: Left (About & Experiences), Right (Career, Education, Skills) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ABOUT */}
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00]">
              About
            </span>
            <p className="text-xs text-[#9AA1AA] leading-relaxed whitespace-pre-line">
              {profile.bio || 'No personal bio has been provided by this alumni member.'}
            </p>
          </div>

          {/* EXPERIENCES */}
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00]">
                Alumni Experiences ({experiences.length})
              </span>
            </div>

            {experiences.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#222222] rounded-md space-y-1">
                <BookOpen className="h-6 w-6 text-[#717784] mx-auto" />
                <p className="text-xs text-[#9AA1AA]">
                  No experiences shared yet by this alumni.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-[#121212] border border-[#222222] rounded-md space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#1C1C1C] text-[#FF6B00] border border-[#2A2A2A]">
                          {exp.type}
                        </span>
                        <h4 className="text-sm font-semibold text-[#EDEDED] mt-1.5">
                          {exp.title}
                        </h4>
                        {(exp.company || exp.job_role) && (
                          <p className="text-xs text-[#9AA1AA] mt-0.5">
                            {[exp.job_role, exp.company].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-[#717784] font-mono shrink-0">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                      {exp.content}
                    </p>

                    {exp.selection_process && (
                      <div className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-xs space-y-1">
                        <span className="font-semibold text-[#EDEDED] text-[11px] block">
                          Selection Process
                        </span>
                        <p className="text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                          {exp.selection_process}
                        </p>
                      </div>
                    )}

                    {exp.preparation_tips && (
                      <div className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-xs space-y-1">
                        <span className="font-semibold text-[#EDEDED] text-[11px] block">
                          Preparation Advice
                        </span>
                        <p className="text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                          {exp.preparation_tips}
                        </p>
                      </div>
                    )}

                    {exp.advice_for_juniors && (
                      <div className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-xs space-y-1">
                        <span className="font-semibold text-[#EDEDED] text-[11px] block text-[#FF6B00]">
                          Advice for Juniors
                        </span>
                        <p className="text-[#9AA1AA] leading-relaxed whitespace-pre-line">
                          {exp.advice_for_juniors}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* CURRENT CAREER */}
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00]">
              Current Career
            </span>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-[#717784] uppercase font-mono block">
                  Current Company
                </span>
                <span className="text-[#EDEDED] font-medium">
                  {profile.current_company || 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#717784] uppercase font-mono block">
                  Designation / Role
                </span>
                <span className="text-[#EDEDED] font-medium">
                  {profile.job_role || 'Not Specified'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#717784] uppercase font-mono block">
                  Work Location
                </span>
                <span className="text-[#EDEDED] font-medium">
                  {profile.location || 'Not Specified'}
                </span>
              </div>
            </div>
          </div>

          {/* EDUCATION */}
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00]">
              Education
            </span>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-[#717784] uppercase font-mono block">
                  Degree
                </span>
                <span className="text-[#EDEDED] font-medium">{profile.degree || 'B.Tech'}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#717784] uppercase font-mono block">
                  Department
                </span>
                <span className="text-[#EDEDED] font-medium">{displayDepartment}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#717784] uppercase font-mono block">
                  Graduation Year
                </span>
                <span className="text-[#EDEDED] font-medium font-mono">
                  {profile.graduation_year ? `Batch of ${profile.graduation_year}` : 'Not Specified'}
                </span>
              </div>
            </div>
          </div>

          {/* SKILLS */}
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00]">
              Skills & Expertise
            </span>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded bg-[#121212] border border-[#222222] text-[#9AA1AA]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#717784]">No skills listed.</p>
            )}
          </div>

          {/* GUIDANCE CARD */}
          {isStudent && (
            <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/20 rounded-lg p-5 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF6B00]">
                Career Guidance
              </span>
              <p className="text-xs text-[#9AA1AA] leading-relaxed">
                Connect directly with {displayName} to request placement guidance, resume review, or mock interview pointers.
              </p>
              <Button
                onClick={() => setIsGuidanceOpen(true)}
                size="sm"
                className="w-full gap-1.5 text-xs font-semibold bg-[#FF6B00] text-black hover:bg-[#E05E00]"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Request Guidance</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <RequestGuidanceModal
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
        alumniId={profile.id}
        alumniName={displayName}
        alumniCompany={profile.current_company}
        alumniRole={profile.job_role}
      />
    </div>
  );
}
