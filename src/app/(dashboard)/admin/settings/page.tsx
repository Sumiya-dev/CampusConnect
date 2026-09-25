import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Database, Key, CheckCircle2, Lock } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <PageContainer
      title="System Architecture & Security Settings"
      description="Inspect active database configurations, RLS security policies, auth callback domains, and session controls."
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'System Settings' },
      ]}
      badgeText="System Governance"
    >
      <div className="space-y-6">
        {/* Security & RLS Status */}
        <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-[#EDEDED]">Row Level Security (RLS) Isolation</h2>
            </div>
            <Badge variant="success" className="text-sm">
              Enforced on All Tables
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Table: profiles</span>
              <div className="text-base font-medium text-[#EDEDED]">RLS Active: Users can update self; Admins full access</div>
              <span className="text-sm text-emerald-400">Strict Foreign Key: auth.users(id)</span>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Table: student_profiles</span>
              <div className="text-base font-medium text-[#EDEDED]">RLS Active: Student/Faculty/TPO read; Student/Admin write</div>
              <span className="text-sm text-emerald-400">Auto-created via trigger</span>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Table: companies</span>
              <div className="text-base font-medium text-[#EDEDED]">RLS Active: Public read; TPO/Admin write</div>
              <span className="text-sm text-emerald-400">Corporate Master</span>
            </div>

            <div className="p-3 rounded bg-[#121212] border border-[#222222] space-y-1">
              <span className="text-sm uppercase font-semibold text-[#9AA1AA]">Table: placement_drives</span>
              <div className="text-base font-medium text-[#EDEDED]">RLS Active: Authenticated read; TPO/Admin manage</div>
              <span className="text-sm text-emerald-400">Drive Records</span>
            </div>
          </div>
        </div>

        {/* Runtime Environment Info */}
        <div className="p-5 rounded-md border border-[#222222] bg-[#0A0A0A] space-y-3">
          <div className="flex items-center gap-2 border-b border-[#222222] pb-3">
            <Database className="h-4 w-4 text-[#FF6B00]" />
            <h2 className="text-base font-semibold text-[#EDEDED]">Environment & Framework Runtime</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="space-y-0.5">
              <span className="text-sm text-[#9AA1AA] uppercase font-semibold">Framework</span>
              <div className="text-[#EDEDED] font-mono">Next.js 16 (App Router)</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-sm text-[#9AA1AA] uppercase font-semibold">Database & Auth</span>
              <div className="text-[#EDEDED] font-mono">Supabase PostgreSQL + GoTrue</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-sm text-[#9AA1AA] uppercase font-semibold">Edge Middleware</span>
              <div className="text-[#EDEDED] font-mono">Active (Role Protected)</div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
