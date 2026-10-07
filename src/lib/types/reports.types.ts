export interface AnalyticsFilterOptions {
  department?: string;
  program_id?: string;
  year?: string;
  company_id?: string;
  drive_id?: string;
  placement_status?: string;
}

export interface OverviewMetrics {
  totalStudents: number;
  placedStudents: number;
  unplacedStudents: number;
  inProcessStudents: number;
  optedOutStudents: number;
  placementPercentage: number;
  totalCompanies: number;
  totalDrives: number;
  totalApplications: number;
  totalSelections: number;
}

export interface DepartmentPlacementStat {
  department: string;
  totalStudents: number;
  placedStudents: number;
  unplacedStudents: number;
  inProcessStudents: number;
  placementPercentage: number;
  totalApplications: number;
  totalSelections: number;
}

export interface CompanyPlacementStat {
  companyId: string;
  companyName: string;
  industry: string;
  drivesCount: number;
  applicationsCount: number;
  shortlistedCount: number;
  selectionsCount: number;
}

export interface YearPlacementStat {
  year: number;
  yearLabel: string;
  totalStudents: number;
  placedStudents: number;
  unplacedStudents: number;
  placementPercentage: number;
  totalApplications: number;
  totalSelections: number;
}

export interface DrivePerformanceStat {
  driveId: string;
  companyName: string;
  jobRole: string;
  tier: string;
  status: string;
  applicationsCount: number;
  shortlistedCount: number;
  interviewCount: number;
  selectionsCount: number;
  conversionRate: number;
}

export interface StudentPlacementReportRow {
  studentDbId: string;
  studentRollNumber: string;
  name: string;
  email: string;
  department: string;
  year: number;
  cgpa: number;
  placementStatus: string;
  applicationsCount: number;
  placedCompany?: string | null;
  placedRole?: string | null;
}

export interface AnalyticsFilterMetadata {
  departments: { id: string; name: string; code: string }[];
  programs: { id: string; name: string; code: string; department_id: string }[];
  academicYears: { id: string; year_number: number; display_name: string }[];
  companies: { id: string; company_name: string }[];
  drives: { id: string; job_role: string; company_name: string }[];
  placementStatuses: string[];
}

export interface PlacementAnalyticsReportData {
  overview: OverviewMetrics;
  departmentStats: DepartmentPlacementStat[];
  companyStats: CompanyPlacementStat[];
  yearStats: YearPlacementStat[];
  driveStats: DrivePerformanceStat[];
  studentRows: StudentPlacementReportRow[];
  metadata: AnalyticsFilterMetadata;
}
