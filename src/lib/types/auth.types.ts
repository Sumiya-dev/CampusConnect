import { UserRole, Profile, Student, FacultyMember, PlacementOfficer, Administrator } from './database.types';

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
  student?: Student | null;
  faculty?: FacultyMember | null;
  placement?: PlacementOfficer | null;
  admin?: Administrator | null;
}

export type RoleRedirectMap = Record<UserRole, string>;

export const ROLE_HOME_ROUTES: RoleRedirectMap = {
  student: '/student',
  faculty: '/faculty',
  placement_officer: '/placement',
  administrator: '/admin',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty Member',
  placement_officer: 'Placement Officer',
  administrator: 'Administrator',
};
