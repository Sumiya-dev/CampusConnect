import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import { getCurrentUser } from '../auth/user';
import {
  ClassWithDetails,
  TrainingGroupWithDetails,
  ClassDetailsData,
  TrainingGroupDetailsData,
  FacultyDashboardSummary,
  EnrolledStudent,
  FacultyAcademicYear,
  FacultySectionSummary,
  SectionStudentsData,
  SectionStudentItem,
  FacultySessionItem,
  SessionRegisteredStudent,
  FacultySessionDetails,
  ScheduleBucket,
} from '../types/faculty.types';

// ==============================================================================
// HELPERS
// ==============================================================================

export function getYearLabel(year: number): string {
  if (year === 1) return '1st Year';
  if (year === 2) return '2nd Year';
  if (year === 3) return '3rd Year';
  return `${year}th Year`;
}

export function formatSectionCode(deptCode: string, secName: string): string {
  const cleanSec = secName.replace(/^Section\s+/i, '').trim();
  if (cleanSec.includes('-')) return cleanSec;
  const prefix = (deptCode || 'CSE').toUpperCase();
  return `${prefix}-${cleanSec.toUpperCase()}`;
}

export function cleanTrainingName(name: string): string {
  return name.replace(/\s+Training$/i, '').trim();
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function formatTimeRange(start: string, end: string): string {
  // If already formatted like "10:00 AM", return as is
  if (start.includes('AM') || start.includes('PM')) {
    return `${start} – ${end}`;
  }
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}

// ==============================================================================
// STUDENT NAME POOLS
// ==============================================================================

const FIRST_NAMES = [
  'Aarav', 'Diya', 'Rohan', 'Ananya', 'Vikram', 'Sneha', 'Siddharth', 'Pooja',
  'Aditya', 'Tanvi', 'Rahul', 'Neha', 'Karan', 'Priyanka', 'Arjun', 'Meera',
  'Varun', 'Kavya', 'Gaurav', 'Ishita', 'Nikhil', 'Rhea', 'Kunal', 'Shruti',
  'Harsh', 'Divya', 'Ayush', 'Simran', 'Manish', 'Rashi', 'Abhishek', 'Shreya',
  'Pranav', 'Nandini', 'Rajat', 'Tarun', 'Aniket', 'Bhavna', 'Chirag', 'Deepika',
  'Eshan', 'Falguni', 'Himanshu', 'Jhanvi', 'Kartik', 'Lavanya', 'Mayank', 'Natasha',
  'Omkar', 'Palak', 'Rishabh', 'Sakshi', 'Tejas', 'Urvashi', 'Vivek', 'Yash', 'Zoya'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Verma', 'Deshmukh', 'Mehta', 'Rao', 'Iyer', 'Nair',
  'Kulkarni', 'Joshi', 'Gupta', 'Singh', 'Reddy', 'Chopra', 'Malhotra', 'Bose',
  'Pillai', 'Menon', 'Bhat', 'Agarwal', 'Saxena', 'Kapoor', 'Mishra', 'Pandey',
  'Sen', 'Dutta', 'Banerjee', 'Ghosh', 'Chatterjee', 'Das', 'Roy', 'Choudhury',
  'Trivedi', 'Thakur', 'Goswami', 'Rathore', 'Chauhan', 'Nambiar', 'Hegde', 'Shetty',
  'Pawar', 'Shinde', 'Jadhav', 'Kadam', 'More', 'Patil', 'Bhide', 'Gokhale',
  'Apte', 'Kelkar', 'Nadkarni', 'Shenoy', 'Prabhu', 'Kamath', 'Pai', 'Kamat', 'Vaidya'
];

// ==============================================================================
// DETERMINISTIC SEED SCHEDULE SESSIONS
// ==============================================================================

const SEED_SESSIONS: FacultySessionItem[] = [
  // TODAY
  {
    id: 'sess-today-1',
    title: 'Java Training',
    training_name: 'Java',
    year: 4,
    year_label: '4th Year',
    department_code: 'CSE',
    section_code: 'CSE-A',
    session_date: '2026-09-24',
    start_time: '10:00 AM',
    end_time: '11:00 AM',
    time_range: '10:00 AM – 11:00 AM',
    venue: 'Room 204',
    registered_count: 32,
    bucket: 'TODAY',
    status: 'scheduled',
  },
  {
    id: 'sess-today-2',
    title: 'Python Training',
    training_name: 'Python',
    year: 4,
    year_label: '4th Year',
    department_code: 'AIDS',
    section_code: 'AIDS-A',
    session_date: '2026-09-24',
    start_time: '2:00 PM',
    end_time: '3:00 PM',
    time_range: '2:00 PM – 3:00 PM',
    venue: 'Lab 3',
    registered_count: 28,
    bucket: 'TODAY',
    status: 'scheduled',
  },

  // TOMORROW
  {
    id: 'sess-tmrw-1',
    title: 'Aptitude Training',
    training_name: 'Aptitude',
    year: 4,
    year_label: '4th Year',
    department_code: 'AIML',
    section_code: 'AIML-A',
    session_date: '2026-09-25',
    start_time: '11:00 AM',
    end_time: '12:00 PM',
    time_range: '11:00 AM – 12:00 PM',
    venue: 'Room 105',
    registered_count: 30,
    bucket: 'TOMORROW',
    status: 'scheduled',
  },
  {
    id: 'sess-tmrw-2',
    title: 'Coding Training',
    training_name: 'Coding',
    year: 4,
    year_label: '4th Year',
    department_code: 'CSE',
    section_code: 'CSE-B',
    session_date: '2026-09-25',
    start_time: '3:00 PM',
    end_time: '4:00 PM',
    time_range: '3:00 PM – 4:00 PM',
    venue: 'Lab 1',
    registered_count: 26,
    bucket: 'TOMORROW',
    status: 'scheduled',
  },

  // UPCOMING
  {
    id: 'sess-upc-1',
    title: 'Java Advanced Architecture',
    training_name: 'Java',
    year: 4,
    year_label: '4th Year',
    department_code: 'CSE',
    section_code: 'CSE-A',
    session_date: '2026-09-27',
    start_time: '10:00 AM',
    end_time: '11:30 AM',
    time_range: '10:00 AM – 11:30 AM',
    venue: 'Room 204',
    registered_count: 32,
    bucket: 'UPCOMING',
    status: 'scheduled',
  },
  {
    id: 'sess-upc-2',
    title: 'Python Machine Learning Pipelines',
    training_name: 'Python',
    year: 4,
    year_label: '4th Year',
    department_code: 'AIDS',
    section_code: 'AIDS-A',
    session_date: '2026-09-29',
    start_time: '2:00 PM',
    end_time: '3:30 PM',
    time_range: '2:00 PM – 3:30 PM',
    venue: 'Lab 3',
    registered_count: 28,
    bucket: 'UPCOMING',
    status: 'scheduled',
  },
];

/**
 * Returns registered students specifically for a given session
 */
function getRegisteredStudentsForSession(sessionId: string): SessionRegisteredStudent[] {
  const session = SEED_SESSIONS.find((s) => s.id === sessionId);
  if (!session) return [];

  const count = session.registered_count;
  const deptCode = session.department_code;
  const yearPrefix = session.year === 4 ? '24' : '25';
  const isSectionB = session.section_code.endsWith('-B');
  const startRoll = isSectionB ? 61 : 1;

  return Array.from({ length: count }).map((_, i) => {
    const rollNum = startRoll + i;
    const student_id = `${yearPrefix}${deptCode}${String(rollNum).padStart(3, '0')}`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i + (session.year * 3) + startRoll) % LAST_NAMES.length];

    const trainings: { id: string; name: string }[] = [
      { id: `grp-${session.training_name.toLowerCase()}`, name: session.training_name },
    ];
    if (i % 2 === 0 && session.training_name !== 'Aptitude') {
      trainings.push({ id: 'grp-aptitude', name: 'Aptitude' });
    }
    if (i % 3 === 0 && session.training_name !== 'Coding') {
      trainings.push({ id: 'grp-coding', name: 'Coding' });
    }

    return {
      id: `st-${sessionId}-${i + 1}`,
      student_id,
      name: `${firstName} ${lastName}`,
      training_groups: trainings,
    };
  });
}

// ==============================================================================
// QUERIES FOR SCHEDULED SESSIONS & REGISTERED STUDENTS
// ==============================================================================

/**
 * Fetches all scheduled sessions allocated to the logged-in faculty,
 * grouped chronologically into TODAY, TOMORROW, and UPCOMING.
 */
export async function getFacultyScheduledSessions(facultyUserId?: string): Promise<{
  today: FacultySessionItem[];
  tomorrow: FacultySessionItem[];
  upcoming: FacultySessionItem[];
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase && facultyUserId) {
    try {
      const supabase: any = await createClient();

      const { data: faculty } = await supabase
        .from('faculty_members')
        .select('id')
        .eq('user_id', facultyUserId)
        .single();

      if (faculty) {
        const { data: rawSessions, error } = await supabase
          .from('class_sessions')
          .select(`
            id,
            title,
            training_name,
            session_date,
            start_time,
            end_time,
            venue,
            status,
            section:academic_sections (
              id,
              year,
              section_name,
              program:programs (
                code,
                department:departments (code)
              )
            ),
            registrations:session_registrations (count)
          `)
          .eq('faculty_id', faculty.id)
          .order('session_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (!error && rawSessions && rawSessions.length > 0) {
          const todayDate = new Date().toISOString().slice(0, 10);
          const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

          const today: FacultySessionItem[] = [];
          const tomorrow: FacultySessionItem[] = [];
          const upcoming: FacultySessionItem[] = [];

          for (const s of rawSessions) {
            const sec = s.section;
            const deptCode = sec?.program?.department?.code || sec?.program?.code || 'CSE';
            const secName = sec?.section_name || 'Section A';
            const section_code = formatSectionCode(deptCode, secName);
            const yearNum = sec?.year || 4;

            let bucket: ScheduleBucket = 'UPCOMING';
            if (s.session_date === todayDate) {
              bucket = 'TODAY';
            } else if (s.session_date === tomorrowDate) {
              bucket = 'TOMORROW';
            }

            const regCount = s.registrations?.[0]?.count ?? 0;

            const item: FacultySessionItem = {
              id: s.id,
              title: s.title,
              training_name: s.training_name || 'Training',
              year: yearNum,
              year_label: getYearLabel(yearNum),
              department_code: deptCode,
              section_code,
              session_date: s.session_date,
              start_time: formatTime12h(s.start_time),
              end_time: formatTime12h(s.end_time),
              time_range: formatTimeRange(s.start_time, s.end_time),
              venue: s.venue || 'Room 204',
              registered_count: regCount,
              bucket,
              status: s.status || 'scheduled',
            };

            if (bucket === 'TODAY') today.push(item);
            else if (bucket === 'TOMORROW') tomorrow.push(item);
            else upcoming.push(item);
          }

          return { today, tomorrow, upcoming };
        }
      }
    } catch {
      // Fallback
    }
  }

  // Fallback deterministic seed
  const today = SEED_SESSIONS.filter((s) => s.bucket === 'TODAY');
  const tomorrow = SEED_SESSIONS.filter((s) => s.bucket === 'TOMORROW');
  const upcoming = SEED_SESSIONS.filter((s) => s.bucket === 'UPCOMING');

  return { today, tomorrow, upcoming };
}

/**
 * Returns complete details and ONLY the registered students for a specific allocated session.
 * Unauthorized faculty will receive null (strict security).
 */
export async function getFacultySessionDetails(
  sessionId: string,
  facultyUserId?: string
): Promise<FacultySessionDetails | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase && facultyUserId) {
    try {
      const supabase: any = await createClient();

      const { data: faculty } = await supabase
        .from('faculty_members')
        .select('id')
        .eq('user_id', facultyUserId)
        .single();

      if (faculty) {
        // Query session (RLS ensures faculty can only view their own)
        const { data: s, error: sErr } = await supabase
          .from('class_sessions')
          .select(`
            id,
            title,
            training_name,
            session_date,
            start_time,
            end_time,
            venue,
            status,
            section:academic_sections (
              id,
              year,
              section_name,
              program:programs (
                code,
                department:departments (code)
              )
            )
          `)
          .eq('id', sessionId)
          .eq('faculty_id', faculty.id)
          .single();

        if (!sErr && s) {
          const sec = s.section;
          const deptCode = sec?.program?.department?.code || sec?.program?.code || 'CSE';
          const secName = sec?.section_name || 'Section A';
          const section_code = formatSectionCode(deptCode, secName);
          const yearNum = sec?.year || 4;

          const todayDate = new Date().toISOString().slice(0, 10);
          const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
          let bucket: ScheduleBucket = 'UPCOMING';
          if (s.session_date === todayDate) bucket = 'TODAY';
          else if (s.session_date === tomorrowDate) bucket = 'TOMORROW';

          // Query registered students for this session
          const { data: regRows } = await supabase
            .from('session_registrations')
            .select(`
              id,
              registered_at,
              student:students (
                id,
                student_id,
                profile:profiles (name),
                all_training_enrollments:student_training_enrollments (
                  group:training_groups (id, name)
                )
              )
            `)
            .eq('session_id', s.id);

          const students: SessionRegisteredStudent[] = (regRows || []).map((r: any) => {
            const st = r.student;
            const groups = (st?.all_training_enrollments || [])
              .map((te: any) => ({
                id: te.group?.id,
                name: cleanTrainingName(te.group?.name || ''),
              }))
              .filter((g: any) => Boolean(g.id && g.name));

            return {
              id: st?.id || r.id,
              student_id: st?.student_id || '24CSE001',
              name: st?.profile?.name || 'Student',
              training_groups: groups,
              registered_at: r.registered_at,
            };
          });

          // Distinct dynamic training groups among registered students
          const groupMap = new Map<string, string>();
          for (const st of students) {
            for (const g of st.training_groups) {
              groupMap.set(g.id, g.name);
            }
          }

          const available_training_groups = Array.from(groupMap.entries()).map(([id, name]) => ({
            id,
            name,
          }));

          const sessionItem: FacultySessionItem = {
            id: s.id,
            title: s.title,
            training_name: s.training_name || 'Training',
            year: yearNum,
            year_label: getYearLabel(yearNum),
            department_code: deptCode,
            section_code,
            session_date: s.session_date,
            start_time: formatTime12h(s.start_time),
            end_time: formatTime12h(s.end_time),
            time_range: formatTimeRange(s.start_time, s.end_time),
            venue: s.venue || 'Room 204',
            registered_count: students.length,
            bucket,
            status: s.status || 'scheduled',
          };

          return {
            session: sessionItem,
            students,
            available_training_groups,
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  // Fallback seed data
  const sessionItem = SEED_SESSIONS.find((s) => s.id === sessionId);
  if (!sessionItem) {
    return null;
  }

  const students = getRegisteredStudentsForSession(sessionId);

  const groupMap = new Map<string, string>();
  for (const st of students) {
    for (const g of st.training_groups) {
      groupMap.set(g.id, g.name);
    }
  }

  const available_training_groups = Array.from(groupMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  return {
    session: sessionItem,
    students,
    available_training_groups,
  };
}

// ==============================================================================
// BACKWARDS-COMPATIBLE QUERIES (Used by Faculty Dashboard summary)
// ==============================================================================

export async function getFacultyAssignedClasses(facultyUserId?: string): Promise<ClassWithDetails[]> {
  const schedule = await getFacultyScheduledSessions(facultyUserId);
  const allSessions = [...schedule.today, ...schedule.tomorrow, ...schedule.upcoming];

  return allSessions.map((s) => ({
    id: s.id,
    department_name: s.department_code,
    department_code: s.department_code,
    program_name: `B.Tech ${s.department_code}`,
    program_code: s.department_code,
    academic_year: '2025-2026',
    year: s.year,
    section_name: s.section_code,
    student_count: s.registered_count,
  }));
}

export async function getFacultyAssignedTrainingGroups(facultyUserId?: string): Promise<TrainingGroupWithDetails[]> {
  return [
    {
      id: 'grp-java',
      name: 'Java',
      description: 'Enterprise Java & Spring Boot microservices',
      student_count: 32,
      sections_breakdown: [{ section_id: 'sec-cse-4a', section_name: 'CSE-A', program_code: 'CSE', count: 32 }],
    },
    {
      id: 'grp-python',
      name: 'Python',
      description: 'Data processing and automation frameworks',
      student_count: 28,
      sections_breakdown: [{ section_id: 'sec-aids-4a', section_name: 'AIDS-A', program_code: 'AIDS', count: 28 }],
    },
    {
      id: 'grp-aptitude',
      name: 'Aptitude',
      description: 'Quantitative aptitude & logical reasoning',
      student_count: 30,
      sections_breakdown: [{ section_id: 'sec-aiml-4a', section_name: 'AIML-A', program_code: 'AIML', count: 30 }],
    },
  ];
}

export async function getFacultyDashboardSummary(facultyUserId?: string): Promise<FacultyDashboardSummary> {
  const schedule = await getFacultyScheduledSessions(facultyUserId);
  const user = await getCurrentUser();
  const totalStudents = [...schedule.today, ...schedule.tomorrow, ...schedule.upcoming].reduce(
    (sum, s) => sum + s.registered_count,
    0
  );

  return {
    faculty_name: user?.name || 'Faculty Member',
    department: user?.department || 'Computer Science & Engineering',
    employee_id: user?.identifier || 'FAC-2026-01',
    classes_count: schedule.today.length + schedule.tomorrow.length + schedule.upcoming.length,
    training_groups_count: 3,
    total_students_monitored: totalStudents,
    assigned_classes: await getFacultyAssignedClasses(facultyUserId),
    assigned_training_groups: await getFacultyAssignedTrainingGroups(facultyUserId),
  };
}

// Legacy aliases
export async function getFacultyAcademicYears(facultyUserId?: string): Promise<FacultyAcademicYear[]> {
  return [
    { year: 4, label: '4th Year' },
    { year: 3, label: '3rd Year' },
  ];
}

export async function getFacultySectionsByYear(year: number, facultyUserId?: string): Promise<FacultySectionSummary[]> {
  return [
    { id: 'sec-cse-4a', section_code: 'CSE-A', year },
    { id: 'sec-cse-4b', section_code: 'CSE-B', year },
  ];
}

export async function getFacultySectionStudentsData(
  year: number,
  sectionIdOrCode: string,
  facultyUserId?: string
): Promise<SectionStudentsData | null> {
  const details = await getFacultySessionDetails('sess-today-1', facultyUserId);
  if (!details) return null;

  return {
    section_id: details.session.id,
    section_code: details.session.section_code,
    year: details.session.year,
    students: details.students.map((st) => ({
      id: st.id,
      student_id: st.student_id,
      name: st.name,
      training_groups: st.training_groups,
    })),
    available_training_groups: details.available_training_groups,
  };
}

export async function getFacultyYearCompleteData(
  year: number,
  facultyUserId?: string
) {
  const sections = await getFacultySectionsByYear(year, facultyUserId);
  const data = await getFacultySectionStudentsData(year, sections[0]?.id, facultyUserId);
  return {
    year,
    yearLabel: getYearLabel(year),
    sections,
    sectionsData: data ? { [sections[0].id]: data } : {},
  };
}
