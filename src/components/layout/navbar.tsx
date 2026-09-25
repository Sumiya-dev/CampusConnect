import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

export function Navbar({ activeRole }: { activeRole?: string | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222222] bg-[#000000]">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-[#222222] bg-[#121212] text-[#FF6B00]">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-[#EDEDED]">
              CampusConnect <span className="text-[#FF6B00]">AI</span>
            </span>
            <span className="hidden sm:inline-block ml-2.5 pl-2.5 border-l border-[#222222] text-sm text-[#9AA1AA]">
              Placement Platform
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2.5">
          {activeRole ? (
            <Link href={`/${activeRole === 'placement_officer' ? 'placement' : activeRole}`}>
              <Button size="sm" className="gap-1.5 text-sm">
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
