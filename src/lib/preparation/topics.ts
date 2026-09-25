export interface TopicDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'Technical' | 'Aptitude' | 'HR';
  aliases?: string[];
}

export const TECHNICAL_CONCEPTS_TOPICS: TopicDefinition[] = [
  {
    id: 'data-structures',
    slug: 'data-structures',
    title: 'Data Structures',
    description: 'Theoretical concepts behind arrays, lists, trees, and graphs.',
    category: 'Technical',
    aliases: ['ds', 'data structures'],
  },
  {
    id: 'algorithms',
    slug: 'algorithms',
    title: 'Algorithms',
    description: 'Time/space complexity, and algorithmic approaches.',
    category: 'Technical',
    aliases: ['algo', 'algorithms'],
  },
  {
    id: 'oop',
    slug: 'oop',
    title: 'Object-Oriented Programming',
    description: 'Core programming languages, syntax idioms, and object-oriented design principles.',
    category: 'Technical',
    aliases: ['programming', 'oop', 'object oriented programming'],
  },
  {
    id: 'dbms',
    slug: 'dbms',
    title: 'Database Concepts',
    description: 'Relational databases, normalization, SQL queries, and transaction management.',
    category: 'Technical',
    aliases: ['database management systems', 'sql', 'databases', 'dbms'],
  },
  {
    id: 'os',
    slug: 'operating-systems',
    title: 'Operating Systems Concepts',
    description: 'Processes, threads, memory management, and concurrency.',
    category: 'Technical',
    aliases: ['os', 'operating systems'],
  },
  {
    id: 'networks',
    slug: 'computer-networks',
    title: 'Computer Networks',
    description: 'OSI model, TCP/IP, routing, and networking protocols.',
    category: 'Technical',
    aliases: ['cn', 'networks', 'computer networks'],
  },
  {
    id: 'system-design',
    slug: 'system-design',
    title: 'System Design',
    description: 'Distributed systems, scalability, and architectural patterns.',
    category: 'Technical',
    aliases: ['design', 'architecture', 'system design'],
  },
];

export const TECHNICAL_LANGUAGES_TOPICS: TopicDefinition[] = [
  {
    id: 'python',
    slug: 'python',
    title: 'Python',
    description: 'Python programming language features and syntax.',
    category: 'Technical',
    aliases: ['python'],
  },
  {
    id: 'java',
    slug: 'java',
    title: 'Java',
    description: 'Java programming language and ecosystem.',
    category: 'Technical',
    aliases: ['java'],
  },
  {
    id: 'c',
    slug: 'c',
    title: 'C',
    description: 'C programming language fundamentals.',
    category: 'Technical',
    aliases: ['c language'],
  },
  {
    id: 'cpp',
    slug: 'cpp',
    title: 'C++',
    description: 'C++ programming language and STL.',
    category: 'Technical',
    aliases: ['c++', 'cpp'],
  },
  {
    id: 'javascript',
    slug: 'javascript',
    title: 'JavaScript',
    description: 'JavaScript programming language and web concepts.',
    category: 'Technical',
    aliases: ['js', 'javascript'],
  },
];

export const TECHNICAL_MAIN_TOPICS: TopicDefinition[] = [
  {
    id: 'arrays',
    slug: 'arrays',
    title: 'Arrays',
    description: 'Array manipulation and techniques.',
    category: 'Technical',
    aliases: ['arrays'],
  },
  {
    id: 'strings',
    slug: 'strings',
    title: 'Strings',
    description: 'String parsing and manipulation.',
    category: 'Technical',
    aliases: ['strings'],
  },
  {
    id: 'linked-lists',
    slug: 'linked-lists',
    title: 'Linked Lists',
    description: 'Singly, doubly, and circular linked list operations.',
    category: 'Technical',
    aliases: ['ll', 'lists', 'linked lists'],
  },
  {
    id: 'stacks-queues',
    slug: 'stacks-queues',
    title: 'Stacks & Queues',
    description: 'LIFO and FIFO data structure applications.',
    category: 'Technical',
    aliases: ['stacks', 'queues'],
  },
  {
    id: 'trees',
    slug: 'trees',
    title: 'Trees',
    description: 'Binary trees, BSTs, and traversals.',
    category: 'Technical',
    aliases: ['binary trees', 'bst'],
  },
  {
    id: 'graphs',
    slug: 'graphs',
    title: 'Graphs',
    description: 'DFS, BFS, shortest path, and spanning trees.',
    category: 'Technical',
    aliases: ['graph algorithms'],
  },
  {
    id: 'sorting-searching',
    slug: 'sorting-searching',
    title: 'Sorting & Searching',
    description: 'Merge sort, quick sort, and binary search.',
    category: 'Technical',
    aliases: ['sorting', 'searching'],
  },
  {
    id: 'dynamic-programming',
    slug: 'dynamic-programming',
    title: 'Dynamic Programming',
    description: 'Memoization, tabulation, and state transitions.',
    category: 'Technical',
    aliases: ['dp'],
  },
  {
    id: 'other-programming',
    slug: 'other-programming',
    title: 'Other Programming Problems',
    description: 'Bit manipulation, math, and miscellaneous challenges.',
    category: 'Technical',
    aliases: ['misc', 'other'],
  },
];

export const APTITUDE_TOPICS: TopicDefinition[] = [
  {
    id: 'quant',
    slug: 'quantitative-aptitude',
    title: 'Quantitative Aptitude',
    description:
      'Percentages, profit & loss, time & work, speed-distance-time, probability, and permutations.',
    category: 'Aptitude',
    aliases: ['quantitative aptitude', 'quant', 'numerical ability'],
  },
  {
    id: 'logical',
    slug: 'logical-reasoning',
    title: 'Logical Reasoning',
    description:
      'Linear and circular seating arrangements, syllogisms, blood relations, and deductive logic puzzles.',
    category: 'Aptitude',
    aliases: ['logical reasoning', 'reasoning', 'analytical reasoning'],
  },
  {
    id: 'verbal',
    slug: 'verbal-ability',
    title: 'Verbal Ability',
    description:
      'Critical reading comprehension, sentence completion, error identification, and professional vocabulary.',
    category: 'Aptitude',
    aliases: ['verbal ability', 'verbal', 'english'],
  },
  {
    id: 'data-interpretation',
    slug: 'data-interpretation',
    title: 'Data Interpretation',
    description:
      'Numerical tables, composite bar graphs, pie chart conversions, and trend analysis.',
    category: 'Aptitude',
    aliases: ['data interpretation', 'di', 'charts and tables'],
  },
];

export const HR_TOPICS: TopicDefinition[] = [
  {
    id: 'common-hr',
    slug: 'common-hr-questions',
    title: 'Common HR Questions',
    description:
      'Elevator pitch ("Tell me about yourself"), professional strengths and weaknesses, 5-year vision, and company alignment.',
    category: 'HR',
    aliases: ['common hr questions', 'hr questions', 'general hr'],
  },
  {
    id: 'behavioral',
    slug: 'behavioral-questions',
    title: 'Behavioral Questions',
    description:
      'The STAR methodology (Situation, Task, Action, Result) for showcasing leadership, resilience, and teamwork.',
    category: 'HR',
    aliases: ['behavioral questions', 'behavioral', 'star method'],
  },
  {
    id: 'communication',
    slug: 'communication',
    title: 'Communication',
    description:
      'Virtual and in-person executive presence, vocal clarity, active listening, and structured answering techniques.',
    category: 'HR',
    aliases: ['communication', 'communication & presence'],
  },
  {
    id: 'interview-frameworks',
    slug: 'interview-frameworks',
    title: 'Interview Frameworks',
    description:
      'Understanding recruiter grading rubrics, situational scoring matrices, and reverse-interviewing recruiters.',
    category: 'HR',
    aliases: ['interview frameworks', 'frameworks'],
  },
  {
    id: 'situational',
    slug: 'situational-questions',
    title: 'Situational Questions',
    description:
      'Workplace dilemmas: priority conflicts, tight deadlines, ethical choices, uncooperative teammates, and client escalations.',
    category: 'HR',
    aliases: ['situational questions', 'situational'],
  },
];

export function findTopicBySlug(
  topics: TopicDefinition[],
  slug: string
): TopicDefinition | undefined {
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  return topics.find((t) => {
    if (t.slug.toLowerCase() === normalized) return true;
    if (t.id.toLowerCase() === normalized) return true;
    if (t.title.toLowerCase() === normalized) return true;
    if (t.aliases?.some((a) => a.toLowerCase() === normalized)) return true;
    return false;
  });
}

export function matchesTopic(
  topic: TopicDefinition,
  materialSubCategory: string | null | undefined,
  materialTitle: string
): boolean {
  if (!materialSubCategory && !materialTitle) return false;
  const sub = (materialSubCategory || '').toLowerCase();
  const title = materialTitle.toLowerCase();
  const candidates = [
    topic.title.toLowerCase(),
    topic.slug.toLowerCase(),
    topic.id.toLowerCase(),
    ...(topic.aliases || []).map((a) => a.toLowerCase()),
  ];

  for (const c of candidates) {
    if (sub.includes(c) || c.includes(sub)) return true;
    if (title.includes(c)) return true;
  }
  return false;
}
