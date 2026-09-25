import { cookies } from 'next/headers';
import { createClient } from '../supabase/server';
import {
  PreparationMaterial,
  InterviewQuestion,
  StudentPreparationProgress,
  PreparationFilterState,
} from '../types/preparation.types';
import {
  SEED_PREPARATION_MATERIALS,
  SEED_INTERVIEW_QUESTIONS,
} from './data';

export async function getPreparationMaterials(
  filters?: PreparationFilterState,
  studentUserId?: string
): Promise<PreparationMaterial[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  let materials: PreparationMaterial[] = [];
  const progressMap: Record<string, StudentPreparationProgress> = {};

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      let query = supabase
        .from('preparation_materials')
        .select(`
          *,
          company:companies (*)
        `)
        .order('created_at', { ascending: true });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.companyId && filters.companyId !== 'all') {
        query = query.eq('company_id', filters.companyId);
      }

      if (filters?.difficulty && filters.difficulty !== 'all') {
        query = query.eq('difficulty', filters.difficulty);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        materials = data as unknown as PreparationMaterial[];

        // Fetch student progress if studentUserId provided
        if (studentUserId) {
          const { data: student } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', studentUserId)
            .maybeSingle();

          if (student) {
            const { data: progressRows } = await supabase
              .from('student_preparation_progress')
              .select('*')
              .eq('student_id', student.id);

            if (progressRows) {
              for (const p of progressRows) {
                progressMap[p.material_id] = p;
              }
            }
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  // Fallback / local demo mode
  if (materials.length === 0) {
    materials = [...SEED_PREPARATION_MATERIALS];
    const cookieStore = await cookies();
    const demoProgressCookie = cookieStore.get('campusconnect_demo_prep_progress')?.value;
    if (demoProgressCookie) {
      try {
        const parsed = JSON.parse(demoProgressCookie);
        if (Array.isArray(parsed)) {
          for (const p of parsed) {
            if (
              !studentUserId ||
              p.student_id === studentUserId ||
              p.student_id === 'demo-user-id' ||
              p.student_id === 'demo-student-id'
            ) {
              progressMap[p.material_id] = p;
            }
          }
        }
      } catch {
        // Ignore parse error
      }
    }
  }

  // Attach progress to materials
  let populated = materials.map((m) => ({
    ...m,
    progress: progressMap[m.id] || null,
  }));

  // Apply filters in memory
  if (filters?.category && filters.category !== 'all') {
    populated = populated.filter((m) => m.category === filters.category);
  }

  if (filters?.companyId && filters.companyId !== 'all') {
    populated = populated.filter((m) => m.company_id === filters.companyId);
  }

  if (filters?.jobRole && filters.jobRole !== 'all') {
    const roleTerm = filters.jobRole.toLowerCase().trim();
    populated = populated.filter((m) => m.job_role?.toLowerCase().includes(roleTerm));
  }

  if (filters?.difficulty && filters.difficulty !== 'all') {
    populated = populated.filter((m) => m.difficulty === filters.difficulty);
  }

  if (filters?.status && filters.status !== 'all') {
    populated = populated.filter((m) => {
      const currentStatus = m.progress?.status || 'not_started';
      return currentStatus === filters.status;
    });
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase().trim();
    populated = populated.filter(
      (m) =>
        m.title.toLowerCase().includes(s) ||
        (m.description && m.description.toLowerCase().includes(s)) ||
        (m.sub_category && m.sub_category.toLowerCase().includes(s)) ||
        (m.job_role && m.job_role.toLowerCase().includes(s)) ||
        (m.company?.company_name && m.company.company_name.toLowerCase().includes(s))
    );
  }

  return populated;
}

export async function getPreparationMaterialById(
  id: string,
  studentUserId?: string
): Promise<PreparationMaterial | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      const { data: material, error } = await supabase
        .from('preparation_materials')
        .select(`
          *,
          company:companies (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && material) {
        // Fetch questions tied to this material
        const { data: questions } = await supabase
          .from('interview_questions')
          .select(`
            *,
            company:companies (*)
          `)
          .or(`material_id.eq.${id},category.eq.${material.category}`)
          .limit(10);

        let progress: StudentPreparationProgress | null = null;
        if (studentUserId) {
          const { data: student } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', studentUserId)
            .maybeSingle();

          if (student) {
            const { data: p } = await supabase
              .from('student_preparation_progress')
              .select('*')
              .eq('student_id', student.id)
              .eq('material_id', id)
              .maybeSingle();
            if (p) progress = p;
          }
        }

        return {
          ...material,
          questions: questions || [],
          progress,
        };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback lookup
  const materials = await getPreparationMaterials(undefined, studentUserId);
  let found = materials.find((m) => m.id === id);
  
  // If not found in materials (e.g. partial DB data prevented full fallback), check SEED directly
  if (!found) {
    const seedFound = SEED_PREPARATION_MATERIALS.find((m) => m.id === id);
    if (seedFound) found = seedFound;
  }
  
  if (!found) return null;

  const relevantQuestions = SEED_INTERVIEW_QUESTIONS.filter(
    (q) => q.material_id === id || q.category === found.category
  );

  return {
    ...found,
    questions: relevantQuestions,
  };
}

export async function getInterviewQuestions(filters?: {
  category?: string;
  companyId?: string;
  technicalType?: 'theory' | 'coding';
}): Promise<InterviewQuestion[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isLiveSupabase = supabaseUrl && !supabaseUrl.includes('placeholder');

  if (isLiveSupabase) {
    try {
      const supabase: any = await createClient();
      let query = supabase
        .from('interview_questions')
        .select(`
          *,
          company:companies (*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.companyId && filters.companyId !== 'all') {
        query = query.eq('company_id', filters.companyId);
      }
      
      if (filters?.technicalType) {
        query = query.eq('technical_type', filters.technicalType);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as unknown as InterviewQuestion[];
      }
    } catch {
      // Fallback
    }
  }

  let questions = [...SEED_INTERVIEW_QUESTIONS];
  if (filters?.category && filters.category !== 'all') {
    questions = questions.filter((q) => q.category === filters.category);
  }
  if (filters?.companyId && filters.companyId !== 'all') {
    questions = questions.filter((q) => q.company_id === filters.companyId);
  }
  if (filters?.technicalType) {
    // In fallback seed data, we distinguish coding by presence of sample_code
    if (filters.technicalType === 'coding') {
      questions = questions.filter((q) => q.sample_code != null);
    } else {
      questions = questions.filter((q) => q.sample_code == null);
    }
  }

  return questions;
}

export async function getInterviewQuestionsForTopic(
  topic: any, // TopicDefinition
  technicalType: 'theory' | 'coding'
): Promise<InterviewQuestion[]> {
  // 1. Get all technical materials
  const allMaterials = await getPreparationMaterials({ category: 'Technical' });
  
  // 2. Filter materials that match the topic
  const { matchesTopic } = await import('./topics');
  const matchedMaterialIds = allMaterials
    .filter((m) => matchesTopic(topic, m.sub_category, m.title))
    .map((m) => m.id);

  // 3. Get questions matching the technicalType
  const allQuestions = await getInterviewQuestions({ 
    category: 'Technical', 
    technicalType 
  });

  // 4. Filter questions belonging to matched materials, or (for fallback data) matching the category roughly
  return allQuestions.filter(
    (q) => 
      (q.material_id && matchedMaterialIds.includes(q.material_id)) || 
      (!q.material_id && q.category === 'Technical')
  );
}

export async function getStudentPreparationStats(studentUserId: string) {
  const materials = await getPreparationMaterials(undefined, studentUserId);
  const total = materials.length;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const m of materials) {
    if (m.progress?.status === 'completed') {
      completed++;
    } else if (m.progress?.status === 'in_progress') {
      inProgress++;
    } else {
      notStarted++;
    }
  }

  return {
    total,
    completed,
    inProgress,
    notStarted,
    percentCompleted: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
