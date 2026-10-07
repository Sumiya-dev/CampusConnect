'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building, MapPin, Briefcase, GraduationCap, ArrowUpRight, Send } from 'lucide-react';
import { AlumniProfile } from '@/lib/types/alumni.types';
import { Button } from '@/components/ui/button';
import { RequestGuidanceModal } from './request-guidance-modal';

interface AlumniCardProps {
  profile: AlumniProfile;
  isStudent?: boolean;
  baseHref?: string;
}

export function AlumniCard({ profile, isStudent = true, baseHref = '/student/alumni' }: AlumniCardProps) {
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);

  const displayName = profile.user?.name || 'Alumni Graduate';
  const displayDepartment = profile.department || profile.user?.department || 'Engineering';
  const displayGradYear = profile.graduation_year ? `Class of ${profile.graduation_year}` : null;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg p-5 flex flex-col justify-between hover:border-[#333333] transition-all duration-150 group">
        <div className="space-y-4">
          {/* Top Row: Avatar + Name + Department / Grad Year */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-sm font-semibold text-[#FF6B00] shrink-0 overflow-hidden">
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
              <div>
                <h3 className="text-sm font-semibold text-[#EDEDED] group-hover:text-[#FF6B00] transition-colors">
                  {displayName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#9AA1AA] mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 text-[#717784]" />
                    {displayDepartment}
                  </span>
                  {displayGradYear && (
                    <>
                      <span className="text-[#333333]">•</span>
                      <span className="font-mono text-[11px] text-[#FF6B00]">
                        {displayGradYear}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-[#161616] text-[#9AA1AA] border border-[#222222]">
              Alumni
            </span>
          </div>

          {/* Current Career */}
          <div className="space-y-1.5 pt-1 text-xs">
            {(profile.job_role || profile.current_company) && (
              <div className="flex items-center gap-2 text-[#EDEDED]">
                <Briefcase className="h-3.5 w-3.5 text-[#FF6B00] shrink-0" />
                <span className="font-medium">
                  {profile.job_role || 'Professional'}
                  {profile.current_company && (
                    <span className="text-[#9AA1AA]"> at {profile.current_company}</span>
                  )}
                </span>
              </div>
            )}

            {profile.location && (
              <div className="flex items-center gap-2 text-xs text-[#9AA1AA]">
                <MapPin className="h-3.5 w-3.5 text-[#717784] shrink-0" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {/* Bio Preview */}
          {profile.bio && (
            <p className="text-xs text-[#9AA1AA] line-clamp-2 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[11px] rounded bg-[#121212] border border-[#222222] text-[#9AA1AA]"
                >
                  {skill}
                </span>
              ))}
              {profile.skills.length > 4 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#121212] text-[#717784]">
                  +{profile.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#1C1C1C]">
          <Link
            href={`${baseHref}/${profile.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#EDEDED] bg-[#121212] hover:bg-[#1a1a1a] border border-[#262626] rounded-md transition-colors"
          >
            <span>View Profile</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#717784]" />
          </Link>

          {isStudent && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsGuidanceOpen(true)}
              className="text-xs gap-1.5 border-[#FF6B00]/40 text-[#FF6B00] hover:bg-[#FF6B00]/10"
            >
              <Send className="h-3 w-3" />
              <span>Guidance</span>
            </Button>
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
    </>
  );
}
