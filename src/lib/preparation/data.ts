import { SEED_COMPANIES } from '../companies/queries';
import {
  PreparationMaterial,
  InterviewQuestion,
} from '../types/preparation.types';

export const SEED_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // 1. Technical: DSA
  {
    id: 'q4010000-0000-0000-0000-000000000001',
    material_id: 'm3010000-0000-0000-0000-000000000001',
    category: 'Technical',
    question:
      'Given an array of positive integers and a target sum, find the minimum length of a contiguous subarray whose sum is greater than or equal to the target.',
    answer_guide:
      'Use a sliding window approach with two pointers (left and right). Expand right while current sum is less than target. When sum >= target, record minLength = min(minLength, right - left + 1) and contract left pointer until sum falls below target. This guarantees O(N) time complexity and O(1) space complexity.',
    company_id: null,
    job_role: 'Software Development Engineer',
    interview_type: 'Technical Coding Round',
    difficulty: 'Intermediate',
    sample_code:
      'function minSubArrayLen(target: number, nums: number[]): number {\n  let left = 0, sum = 0, minLen = Infinity;\n  for (let right = 0; right < nums.length; right++) {\n    sum += nums[right];\n    while (sum >= target) {\n      minLen = Math.min(minLen, right - left + 1);\n      sum -= nums[left++];\n    }\n  }\n  return minLen === Infinity ? 0 : minLen;\n}',
    tips: [
      'Initialize minLen with Infinity',
      'Watch for cases where no valid subarray exists and return 0',
      'Explain why the two-pointer approach runs in linear time',
    ],
    created_at: '2026-09-01T09:00:00Z',
  },
  // 2. Technical: System Design
  {
    id: 'q4010000-0000-0000-0000-000000000002',
    material_id: 'm3010000-0000-0000-0000-000000000002',
    category: 'Technical',
    question:
      'How does consistent hashing prevent cascading cache node failures during horizontal scaling?',
    answer_guide:
      'Standard modulo hashing (hash(key) % N) causes almost 100% of keys to remap when N changes, immediately overwhelming the backend database. Consistent hashing maps keys and servers onto a virtual 360-degree ring (0 to 2^32 - 1). A key is served by the first server encountered clockwise. Adding or removing a node only remaps k/N keys. Virtual nodes distribute load evenly across heterogeneous servers.',
    company_id: null,
    job_role: 'Software Engineer / Cloud Architect',
    interview_type: 'System Design Round',
    difficulty: 'Advanced',
    sample_code: null,
    tips: [
      'Draw the virtual hash ring on the whiteboard',
      'Explain how virtual nodes prevent non-uniform cluster hot-spots',
    ],
    created_at: '2026-09-02T10:00:00Z',
  },
  // 3. Technical: DBMS
  {
    id: 'q4010000-0000-0000-0000-000000000012',
    material_id: 'm3010000-0000-0000-0000-000000000012',
    category: 'Technical',
    question:
      'Explain the difference between Clustered and Non-Clustered Indexes, and how B+ Trees optimize range queries.',
    answer_guide:
      'A clustered index physically orders the data rows in the table on disk based on the key; therefore, a table can only have one clustered index. Non-clustered indexes contain the index key and a row locator pointer to the actual data. B+ trees keep all actual data pointers in leaf nodes connected by a linked list, enabling extremely fast sequential traversal for range queries (e.g. WHERE age BETWEEN 20 AND 30) compared to binary search trees.',
    company_id: null,
    job_role: 'Database Engineer / Backend Developer',
    interview_type: 'Technical Interview',
    difficulty: 'Intermediate',
    sample_code:
      '-- Creating optimized composite non-clustered index\nCREATE INDEX idx_student_dept_cgpa \nON public.students (department, cgpa DESC);',
    tips: [
      'Mention that leaf nodes in B+ trees form a doubly-linked list',
      'Highlight write penalty: every insert/update also updates the index tree',
    ],
    created_at: '2026-09-03T10:00:00Z',
  },
  // 4. Technical: OS
  {
    id: 'q4010000-0000-0000-0000-000000000013',
    material_id: 'm3010000-0000-0000-0000-000000000013',
    category: 'Technical',
    question:
      'What are the four Coffman conditions necessary for a Deadlock, and how can prevention be implemented?',
    answer_guide:
      'The four conditions are: 1. Mutual Exclusion (non-shareable resources), 2. Hold and Wait (process holding a resource while waiting for another), 3. No Preemption (resources cannot be forcibly confiscated), 4. Circular Wait (a closed chain of processes waiting on each other). Deadlock prevention eliminates at least one condition: enforcing global resource acquisition ordering breaks the circular wait condition.',
    company_id: null,
    job_role: 'Systems / Core Engineer',
    interview_type: 'Technical Interview',
    difficulty: 'Intermediate',
    sample_code: null,
    tips: [
      'Name all 4 Coffman conditions accurately',
      'Explain how strict hierarchical lock ordering eliminates circular wait',
    ],
    created_at: '2026-09-04T10:00:00Z',
  },
  // 5. Technical: Networks
  {
    id: 'q4010000-0000-0000-0000-000000000014',
    material_id: 'm3010000-0000-0000-0000-000000000014',
    category: 'Technical',
    question:
      'Explain the TCP Three-Way Handshake and what happens during SYN Flood attacks.',
    answer_guide:
      'The client sends SYN (Synchronize) with an initial sequence number (ISN). The server responds with SYN-ACK (acknowledging client ISN and sending server ISN). The client sends ACK, completing the reliable bidirectional connection. In a SYN Flood, an attacker spams SYN packets with forged IP addresses and never sends the final ACK, filling the server connection backlog queue (half-open connections). Mitigations include SYN Cookies and firewall rate limits.',
    company_id: null,
    job_role: 'Network Engineer / Security Analyst',
    interview_type: 'Technical Interview',
    difficulty: 'Intermediate',
    sample_code: null,
    tips: [
      'Draw the client-server sequence diagram: SYN -> SYN-ACK -> ACK',
      'Mention SYN cookies as the primary defense against connection queue exhaustion',
    ],
    created_at: '2026-09-05T10:00:00Z',
  },
  // 6. Aptitude: Quantitative
  {
    id: 'q4010000-0000-0000-0000-000000000003',
    material_id: 'm3010000-0000-0000-0000-000000000003',
    category: 'Aptitude',
    question:
      'A train traveling at 72 km/h crosses a 250m long platform in 25 seconds. What is the length of the train?',
    answer_guide:
      'Convert speed to m/s: 72 * (5/18) = 20 m/s. Total distance covered in 25s = Speed * Time = 20 * 25 = 500 meters. Total distance = Train Length (L) + Platform Length (250m). Therefore, L = 500 - 250 = 250 meters.',
    company_id: null,
    job_role: 'All Engineering Disciplines',
    interview_type: 'Aptitude Assessment',
    difficulty: 'Beginner',
    sample_code: null,
    tips: [
      'Always multiply km/h by 5/18 to convert into m/s',
      'Remember train length + platform length = total distance',
    ],
    created_at: '2026-09-03T11:00:00Z',
  },
  // 7. Aptitude: Logical
  {
    id: 'q4010000-0000-0000-0000-000000000004',
    material_id: 'm3010000-0000-0000-0000-000000000004',
    category: 'Aptitude',
    question:
      'In a cohort of 60 engineering students, 40 play Cricket, 35 play Football, and 20 play both sports. How many students play neither sport?',
    answer_guide:
      'By Principle of Inclusion-Exclusion: Total playing at least one sport = n(C) + n(F) - n(C ∩ F) = 40 + 35 - 20 = 55 students. Students playing neither sport = Total students - Total playing at least one sport = 60 - 55 = 5 students.',
    company_id: null,
    job_role: 'All Engineering Disciplines',
    interview_type: 'Aptitude Assessment',
    difficulty: 'Beginner',
    sample_code: null,
    tips: [
      'Draw a two-set Venn diagram to visualize the overlapping subset',
    ],
    created_at: '2026-09-04T12:00:00Z',
  },
  // 8. Aptitude: Verbal
  {
    id: 'q4010000-0000-0000-0000-000000000016',
    material_id: 'm3010000-0000-0000-0000-000000000016',
    category: 'Aptitude',
    question:
      'Identify the grammatical error: "Each of the software engineers have submitted their deployment logs to the production repository."',
    answer_guide:
      'The error is the plural verb "have submitted". The subject of the sentence is "Each" (singular pronoun), which requires the singular verb "has submitted". The correct sentence is: "Each of the software engineers has submitted their deployment logs to the production repository."',
    company_id: null,
    job_role: 'All Campus Roles',
    interview_type: 'Verbal Assessment',
    difficulty: 'Beginner',
    sample_code: null,
    tips: [
      'Ignore prepositional phrases ("of the software engineers") when identifying the true subject ("Each")',
    ],
    created_at: '2026-09-05T12:00:00Z',
  },
  // 9. HR: Behavioral
  {
    id: 'q4010000-0000-0000-0000-000000000005',
    material_id: 'm3010000-0000-0000-0000-000000000005',
    category: 'HR',
    question:
      'Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?',
    answer_guide:
      'Frame using STAR:\n- Situation: During our semester capstone project, our team was divided between MongoDB and PostgreSQL.\n- Task: As the data lead, I needed to guide consensus without delaying sprint milestones.\n- Action: I benchmarked query performance against our actual relational student entity model and presented empirical data during our sprint meeting.\n- Result: The team adopted PostgreSQL based on verified data, and we submitted our project with zero data integrity issues.',
    company_id: null,
    job_role: 'All Campus Roles',
    interview_type: 'HR & Behavioral Interview',
    difficulty: 'Intermediate',
    sample_code: null,
    tips: [
      'Never criticize teammates or faculty',
      'Demonstrate data-driven leadership and active listening',
    ],
    created_at: '2026-09-05T13:00:00Z',
  },
  // 10. HR: Common Questions
  {
    id: 'q4010000-0000-0000-0000-000000000018',
    material_id: 'm3010000-0000-0000-0000-000000000018',
    category: 'HR',
    question:
      '"Why do you want to join our company instead of other recruiters?"',
    answer_guide:
      'Structure into three pillars:\n1. Technology & Domain Alignment: Mention specific products, open-source initiatives, or client sectors the company leads.\n2. Engineering Culture: Reference their emphasis on continuous mentorship, code review standards, and ownership.\n3. Long-Term Value: Articulate how your foundational skills (e.g. systems, cloud, problem-solving) will make an active contribution in your first 90 days.',
    company_id: null,
    job_role: 'All Campus Roles',
    interview_type: 'HR Culture Fit',
    difficulty: 'Beginner',
    sample_code: null,
    tips: [
      'Avoid generic answers like "It is a reputed company"',
      'Name at least two specific projects, platforms, or core values of the recruiter',
    ],
    created_at: '2026-09-06T13:00:00Z',
  },
  // 11. Company: Microsoft IDC
  {
    id: 'q4010000-0000-0000-0000-000000000006',
    material_id: 'm3010000-0000-0000-0000-000000000006',
    category: 'Technical',
    question:
      'How do you achieve thread-safe synchronization across distributed microservices sharing state in Azure/Cloud?',
    answer_guide:
      'Use a distributed consensus coordinator like Azure Blob Storage leases or Redis Redlock. When a microservice instance attempts a critical section, it acquires a lease with an explicit TTL (Time-To-Live). The instance performs the operation and releases the lease. If the instance crashes, the TTL expires automatically, preventing deadlocks.',
    company_id: 'c101-msft',
    job_role: 'Software Development Engineer (Cloud & AI)',
    interview_type: 'Technical Interview',
    difficulty: 'Advanced',
    sample_code:
      '// Azure Blob Storage lease acquisition\nconst leaseClient = blobClient.getBlobLeaseClient();\nawait leaseClient.acquireLease(30); // 30s TTL\ntry {\n  // Synchronized cloud mutations\n} finally {\n  await leaseClient.releaseLease();\n}',
    tips: [
      'Emphasize why local mutexes (e.g. synchronized block) fail across multiple containers',
      'Explain heartbeats and lease renewal',
    ],
    created_at: '2026-09-06T14:00:00Z',
    company: SEED_COMPANIES[0],
  },
  // 12. Company: TCS Digital
  {
    id: 'q4010000-0000-0000-0000-000000000007',
    material_id: 'm3010000-0000-0000-0000-000000000007',
    category: 'Technical',
    question:
      'Write an efficient SQL query to find the 2nd highest salary from an Employee table without using LIMIT/TOP.',
    answer_guide:
      'Use a nested query with MAX(): SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee); Alternatively, use DENSE_RANK(): WITH Ranked AS (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk FROM Employee) SELECT salary FROM Ranked WHERE rnk = 2 LIMIT 1;',
    company_id: 'c102-tcs',
    job_role: 'Digital Software Engineer',
    interview_type: 'Technical Evaluation',
    difficulty: 'Intermediate',
    sample_code:
      'SELECT MAX(salary) AS SecondHighestSalary\nFROM Employee\nWHERE salary < (SELECT MAX(salary) FROM Employee);',
    tips: [
      'Account for ties or duplicate highest salaries',
      'Address the case where fewer than 2 employees exist (returns NULL)',
    ],
    created_at: '2026-09-07T15:00:00Z',
    company: SEED_COMPANIES[1],
  },
  // 13. Company: Deloitte USI
  {
    id: 'q4010000-0000-0000-0000-000000000008',
    material_id: 'm3010000-0000-0000-0000-000000000008',
    category: 'HR',
    question:
      'A corporate client insists on keeping their legacy on-premise infrastructure instead of migrating to Cloud. How do you advise them?',
    answer_guide:
      'Acknowledge valid client constraints (data sovereignty, legacy compliance, amortized hardware costs). Propose a phased Hybrid Cloud blueprint: keep sensitive compliance workloads on-premise while migrating elastic, customer-facing services to public cloud. Provide a Clear Total Cost of Ownership (TCO) comparison showing operational savings over 3-5 years.',
    company_id: 'c103-deloitte',
    job_role: 'Technology Advisory Analyst',
    interview_type: 'Partner Case Round',
    difficulty: 'Intermediate',
    sample_code: null,
    tips: [
      'Show business empathy rather than pushing technology dogma',
      'Structure your response into Risk, Compliance, and Financial ROI',
    ],
    created_at: '2026-09-08T16:00:00Z',
    company: SEED_COMPANIES[2],
  },
  // 14. Company: Cisco Systems
  {
    id: 'q4010000-0000-0000-0000-000000000022',
    material_id: 'm3010000-0000-0000-0000-000000000022',
    category: 'Technical',
    question:
      'How does Spanning Tree Protocol (STP) prevent bridge loops in Layer 2 switched networks?',
    answer_guide:
      'Bridge loops cause broadcast storms and MAC table instability. STP (IEEE 802.1D) elects a Root Bridge based on lowest Bridge ID. Each non-root switch identifies its Root Port (lowest path cost to root) and Designated Ports for each segment. Redundant ports are placed into a Blocking state to enforce a loop-free logical tree topology while providing automated failover if an active link drops.',
    company_id: 'c106-cisco',
    job_role: 'Technical Consulting Engineer (Networking & Security)',
    interview_type: 'Technical Systems Round',
    difficulty: 'Intermediate',
    sample_code: null,
    tips: [
      'State the 4 STP port states: Blocking, Listening, Learning, Forwarding',
      'Explain the convergence advantage of Rapid STP (RSTP / 802.1w)',
    ],
    created_at: '2026-09-09T16:00:00Z',
    company: SEED_COMPANIES[5],
  },
  // 15. HR: Situational Questions
  {
    id: 'q4010000-0000-0000-0000-000000000021',
    material_id: 'm3010000-0000-0000-0000-000000000021',
    category: 'HR',
    question:
      'If you discover a critical production bug 2 hours before a major client demo, and the team lead is unreachable, how would you respond?',
    answer_guide:
      '1. Assess Severity & Blast Radius: Check if the bug affects core demo workflows or isolated peripheral functions. 2. Implement Safe Mitigation: If a quick, tested hotfix or feature flag toggle is available, prepare it. If high-risk, document a clear fallback or graceful degradation. 3. Transparent Communication: Immediately alert the client account manager and available team members with facts: bug symptom, impact, and proposed workaround. Never attempt an untested cowboy fix right before a live release.',
    company_id: null,
    job_role: 'All Campus Roles',
    interview_type: 'Situational & Integrity Round',
    difficulty: 'Intermediate',
    sample_code: null,
    tips: [
      'Prioritize customer experience and transparency over hiding mistakes',
      'Demonstrate calm decision-making and risk calculation under pressure',
    ],
    created_at: '2026-09-09T17:00:00Z',
  },
  // 16. Company: Infosys Limited
  {
    id: 'q4010000-0000-0000-0000-000000000023',
    material_id: 'm3010000-0000-0000-0000-000000000023',
    category: 'Technical',
    question:
      'Given an array of integers representing house values along a street, determine the maximum stolen sum without robbing adjacent houses (House Robber DP).',
    answer_guide:
      'Define dp[i] as the maximum money obtainable from the first i houses. Recurrence: dp[i] = max(dp[i-1], dp[i-2] + nums[i]). Space can be optimized to O(1) by maintaining two variables (prevMax and currMax) since only the previous two states are needed.',
    company_id: 'c104-infy',
    job_role: 'Specialist Programmer / Digital Specialist Engineer',
    interview_type: 'Technical Coding Round',
    difficulty: 'Intermediate',
    sample_code:
      'function rob(nums: number[]): number {\n  let prev1 = 0, prev2 = 0;\n  for (const num of nums) {\n    const temp = Math.max(prev1, prev2 + num);\n    prev2 = prev1;\n    prev1 = temp;\n  }\n  return prev1;\n}',
    tips: [
      'State base cases for 0, 1, and 2 houses clearly',
      'Show the transition from O(N) array DP to O(1) two-variable storage',
    ],
    created_at: '2026-09-09T18:00:00Z',
    company: SEED_COMPANIES[3],
  },
];

export const SEED_PREPARATION_MATERIALS: PreparationMaterial[] = [
  // ==========================================
  // TECHNICAL TRACK TOPICS
  // ==========================================
  {
    id: 'm3010000-0000-0000-0000-000000000001',
    title: 'Data Structures & Algorithmic Problem Solving Mastery',
    description:
      'Comprehensive masterclass on sliding window, two-pointer techniques, tree traversals, and dynamic programming formulations for technical coding assessments.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Advanced',
    company_id: null,
    job_role: 'Software Development Engineer',
    estimated_time: '60 mins',
    content: `# Data Structures & Algorithmic Problem Solving

### 1. Two-Pointer and Sliding Window Patterns
The two-pointer technique optimizes array searching and contiguous sub-array evaluations from O(N^2) to O(N).
- **Fixed Window**: Maintain a window of size K. Slide by subtracting the departing element and adding the incoming element.
- **Dynamic Window**: Expand right pointer until constraint is satisfied or violated; contract left pointer to minimize/maximize window size.

### 2. Binary Tree Traversals & Recursion Invariants
Ensure crystal clarity between Pre-order, In-order, and Post-order recursive visits.
- For level-order and shortest path operations in unweighted graphs, always utilize a Double-Ended Queue (BFS Deque).
- For topological dependencies, utilize Kahn's Algorithm or DFS with recursion stack tracking.

### 3. Dynamic Programming Formulations
1. **State Definition**: Identify what parameters uniquely define a subproblem.
2. **Base Cases**: Establish trivial subproblem solutions explicitly.
3. **Transition Function**: Derive how state (i, j) computes from smaller states.
4. **Space Optimization**: If state i only depends on state i-1, reduce array space from O(N) to O(1).`,
    key_takeaways: [
      'Master O(N) two-pointer and sliding window patterns',
      'Formulate DP state and transitions before coding',
      'Leverage BFS queues for shortest path in unweighted graphs',
    ],
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000031',
    title: 'Arrays & Strings',
    description:
      'Prefix sums, two pointers, sliding window, cyclic sort, and string pattern matching algorithms.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '45 mins',
    content: `# Arrays & Strings

### 1. Sliding Window & Two Pointers
The two-pointer technique optimizes sub-array calculations from O(N^2) to O(N).
- Fixed Window: Add incoming element, remove departing element.
- Variable Window: Expand right, contract left when target condition triggers.

### 2. Prefix Sums & Difference Arrays
Precompute cumulative sums in O(N) to answer range sum queries in O(1).
- Range sum [L, R] = prefix[R] - prefix[L - 1].`,
    key_takeaways: [
      'Master sliding window for contiguous subarray optimization',
      'Use prefix sums for O(1) range queries',
      'Beware of off-by-one edge conditions on string boundaries',
    ],
    created_at: '2026-09-01T11:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000032',
    title: 'Linked Lists',
    description:
      'Fast & slow pointers (Floyd cycle detection), in-place list reversals, and merge k-sorted lists.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '35 mins',
    content: `# Linked Lists

### 1. Floyd's Tortoise and Hare Cycle Detection
- Move slow pointer by 1 step, fast pointer by 2 steps.
- If they meet, a cycle exists. To find cycle origin, reset one pointer to head and advance both by 1 step until they meet again.

### 2. In-Place Reversal of Singly Linked List
- Maintain prev, curr, and next pointers to reverse pointers in O(N) time and O(1) auxiliary space.`,
    key_takeaways: [
      'Floyd cycle detection operates in O(N) time and O(1) space',
      'Use a dummy head node to simplify edge cases with head deletions/insertions',
    ],
    created_at: '2026-09-01T12:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000033',
    title: 'Stacks & Queues',
    description:
      'Monotonic stack patterns, next greater element, balanced parentheses, and queue simulation.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '40 mins',
    content: `# Stacks & Queues

### 1. Monotonic Stack
- Maintain elements in strictly increasing or decreasing order.
- Ideal for finding the Next Greater Element or Largest Rectangle in Histogram in O(N) time instead of O(N^2).

### 2. Double-Ended Queue (Deque)
- Supports O(1) insertions and deletions at both ends.
- Critical for solving Sliding Window Maximum in O(N) time.`,
    key_takeaways: [
      'Use monotonic stacks to resolve Next Greater / Smaller element in O(N)',
      'Leverage double-ended queues for sliding window extrema',
    ],
    created_at: '2026-09-01T13:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000034',
    title: 'Trees & Binary Search Trees',
    description:
      'DFS traversals, BFS level-order, LCA algorithms, tree height balance, and BST validation.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '50 mins',
    content: `# Trees & Binary Search Trees

### 1. Depth-First Traversals
- Inorder: Left -> Root -> Right (produces sorted order in BSTs).
- Preorder: Root -> Left -> Right (used for serialization/cloning).
- Postorder: Left -> Right -> Root (used for bottom-up property aggregation like tree height).

### 2. Lowest Common Ancestor (LCA)
- In BSTs: Walk root until p and q diverge on left and right subtrees.
- In General Binary Trees: Recurse left and right; if both return non-null, current node is LCA.`,
    key_takeaways: [
      'Inorder traversal of a valid BST produces strictly ascending elements',
      'Use postorder recursion to aggregate subtree properties bottom-up',
    ],
    created_at: '2026-09-01T14:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000035',
    title: 'Graphs & Graph Algorithms',
    description:
      'BFS/DFS traversal, Dijkstra shortest path, topological sorting (Kahn algorithm), and Disjoint Set Union (DSU).',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Advanced',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '60 mins',
    content: `# Graphs & Graph Algorithms

### 1. Topological Sorting
- Valid only for Directed Acyclic Graphs (DAGs).
- Kahn's Algorithm: Track in-degrees of all nodes. Initialize queue with in-degree 0 nodes. Decrement neighbor in-degrees as nodes are processed.

### 2. Shortest Path (Dijkstra)
- Solves single-source shortest path on graphs with non-negative edge weights using a Min-Priority Queue in O((V + E) log V).`,
    key_takeaways: [
      'Use BFS with double-ended queue for shortest path in unweighted graphs',
      'Apply Kahn algorithm for course scheduling and topological dependencies',
    ],
    created_at: '2026-09-01T15:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000036',
    title: 'Sorting & Searching',
    description:
      'Binary search on answer space, rotated sorted arrays, quickselect, and stable sorting invariants.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '40 mins',
    content: `# Sorting & Searching

### 1. Binary Search on Answer Space
- When the feasibility function is monotonic (e.g., F(x) = true for all x >= K and false for x < K), binary search the optimal value in O(log(range) * cost_of_check).

### 2. Rotated Sorted Array
- One half of the array is always strictly sorted. Determine which half is sorted, check if target falls in its range, and adjust pointers accordingly.`,
    key_takeaways: [
      'Recognize monotonic feasibility functions to apply binary search on answer',
      'Use mid = left + (right - left) / 2 to prevent integer overflow',
    ],
    created_at: '2026-09-01T16:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000037',
    title: 'Dynamic Programming',
    description:
      '1D and 2D DP formulations, memoization vs tabulation, knapsack patterns, and space optimization techniques.',
    category: 'Technical',
    sub_category: 'Data Structures & Algorithms',
    difficulty: 'Advanced',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '60 mins',
    content: `# Dynamic Programming

### 1. The 4-Step DP Formulation
1. Define State: What parameters uniquely identify a subproblem?
2. Recurrence Relation: How does state i relate to earlier subproblems?
3. Base Cases: Establish boundary conditions explicitly.
4. Space Optimization: Can state i be computed using only state i-1?

### 2. Classic Knapsack Pattern
- 0/1 Knapsack: Iterate items, then iterate weights backwards from capacity down to item weight.
- Unbounded Knapsack: Iterate weights forwards from item weight to capacity.`,
    key_takeaways: [
      'Always articulate the recurrence relation before writing code',
      'Reduce 2D DP matrices to 1D arrays when only previous row is needed',
    ],
    created_at: '2026-09-01T17:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-00000038',
    title: 'Programming & Coding Foundations',
    description:
      'Language idioms, recursion call stack mechanics, memory allocation (stack vs heap), and edge-case testing.',
    category: 'Technical',
    sub_category: 'Programming & Coding',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '35 mins',
    content: `# Programming & Coding Foundations

### 1. Recursion Mechanics & Stack Overflow
- Every recursive invocation adds a frame to the call stack.
- Ensure the base case terminates before stack depth limit is reached.
- Tail call optimization can convert tail-recursive calls into iterative loops in supported runtimes.

### 2. Clean Code & Edge-Case Guard Clauses
- Handle null, empty arrays, single elements, and negative integers first with early returns.`,
    key_takeaways: [
      'Write early guard clauses to handle null and empty collections',
      'Understand call stack depth limits when writing recursive logic',
    ],
    created_at: '2026-09-01T18:00:00Z',
    updated_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000002',
    title: 'System Design & Distributed Scalability Fundamentals',
    description:
      'Architectural blueprints for scalable systems: load balancers, caching strategies, horizontal database sharding, and CAP theorem trade-offs.',
    category: 'Technical',
    sub_category: 'System Design',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Software Engineer / Cloud Architect',
    estimated_time: '90 mins',
    content: `# System Design Fundamentals

### 1. Horizontal vs. Vertical Scaling
Vertical scaling adds CPU/RAM to a single node, while horizontal scaling distributes load across commodity machines behind a reverse proxy (e.g., NGINX, AWS ALB).

### 2. Caching Layers & Eviction Policies
Utilize Redis or Memcached for low-latency in-memory lookup. Choose appropriate eviction strategies (LRU, LFU). Implement cache-aside or write-through patterns based on read vs. write heavy workloads.

### 3. Database Sharding & Replication
- **Master-Replica**: Distributes read queries across read replicas; single master handles writes.
- **Consistent Hashing**: Minimizes key remapping when scaling cluster nodes up or down.
- **CAP Theorem**: Under network partition, balance Consistency against Availability.`,
    key_takeaways: [
      'Understand Cache-Aside vs Write-Through strategies',
      'Apply Consistent Hashing for sharded data distributions',
      'Design with CAP Theorem trade-offs in mind',
    ],
    created_at: '2026-09-02T10:00:00Z',
    updated_at: '2026-09-11T14:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000012',
    title: 'Database Management Systems (DBMS) & Query Optimization',
    description:
      'ACID guarantees, indexing mechanics (B+ Trees), transaction isolation levels, normalization, and high-performance SQL query design.',
    category: 'Technical',
    sub_category: 'DBMS',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Backend & Data Engineer',
    estimated_time: '50 mins',
    content: `# Relational DBMS & Performance Optimization

### 1. ACID Invariants
- **Atomicity**: All or nothing transaction commits (Write-Ahead Logging).
- **Consistency**: Transition from one valid state to another satisfying constraints.
- **Isolation**: Prevent dirty reads, non-repeatable reads, and phantom reads via isolation levels (Read Committed, Repeatable Read, Serializable).
- **Durability**: Committed data persists across power loss via WAL flushing.

### 2. B+ Tree Index Mechanics
Indexes reduce lookup complexity from O(N) table scans to O(log N) tree navigations. Leaves are doubly linked for rapid range scans. Avoid index column transformations (e.g. WHERE UPPER(name) = 'X') which prevent index usage unless an expression index exists.`,
    key_takeaways: [
      'Master the 4 transaction isolation levels',
      'Understand why B+ Trees are superior to binary trees on disk',
      'Write SARGable SQL queries that leverage indexes',
    ],
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000013',
    title: 'Operating Systems & Concurrency Architecture',
    description:
      'Process vs threads, CPU scheduling algorithms, virtual memory paging, inter-process communication (IPC), and race condition prevention.',
    category: 'Technical',
    sub_category: 'Operating Systems',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Systems Engineer',
    estimated_time: '55 mins',
    content: `# Operating Systems & Concurrency

### 1. Process vs Thread Memory Layout
Processes possess isolated virtual address spaces (code, data, heap, stack). Threads share code, data, and heap while retaining individual stacks and program counters, lowering context-switch overhead.

### 2. Virtual Memory & Paging
Virtual addresses translate to physical frames via the Page Table and Memory Management Unit (MMU). The Translation Lookaside Buffer (TLB) caches translations. Page Faults occur when the accessed page is on swap space or unmapped.

### 3. Synchronization Primitives
- **Mutex**: Mutual exclusion lock for shared resources.
- **Semaphore**: Signaling mechanism with a counter tracking resource availability.
- **Spinlock**: Busy-waiting lock suitable only for short critical sections in multi-core kernels.`,
    key_takeaways: [
      'Compare process and thread resource overheads',
      'Explain TLB hits and page replacement policies (LRU, FIFO)',
      'Analyze deadlocks using Coffman conditions',
    ],
    created_at: '2026-09-04T10:00:00Z',
    updated_at: '2026-09-13T11:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000014',
    title: 'Computer Networks & Internet Protocol Protocols',
    description:
      'OSI and TCP/IP models, TCP vs UDP, DNS resolution, HTTP/1.1 vs HTTP/2 vs HTTP/3, and network security foundations.',
    category: 'Technical',
    sub_category: 'Computer Networks',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'Network & Cloud Engineer',
    estimated_time: '50 mins',
    content: `# Computer Networks Architecture

### 1. The Transport Layer: TCP vs UDP
- **TCP**: Connection-oriented, reliable, ordered delivery with flow control (sliding window) and congestion control (Slow Start, Congestion Avoidance).
- **UDP**: Connectionless, lightweight, unordered with zero handshake latency; ideal for live video streaming, DNS queries, and gaming.

### 2. Anatomy of a Web Request
1. Browser checks cache -> Local DNS resolution -> Root DNS -> TLD DNS -> Authoritative Nameserver.
2. TCP 3-Way Handshake + TLS 1.3 Key Exchange.
3. HTTP GET request dispatched over encrypted channel.
4. Reverse proxy passes request to application server.`,
    key_takeaways: [
      'Walk through the full lifecycle of typing a URL into a browser',
      'Compare TCP congestion control mechanisms',
      'Understand TLS handshake and symmetric encryption',
    ],
    created_at: '2026-09-05T10:00:00Z',
    updated_at: '2026-09-14T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000015',
    title: 'Object-Oriented Programming (OOP) & SOLID Principles',
    description:
      'Encapsulation, inheritance, polymorphism, abstraction, and the 5 SOLID software design principles for clean, maintainable code.',
    category: 'Technical',
    sub_category: 'Object-Oriented Programming',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'Software Engineer',
    estimated_time: '40 mins',
    content: `# Object-Oriented Programming & SOLID Principles

### 1. The 4 Pillars of OOP
- **Encapsulation**: Bundling state and behavior while restricting direct field access.
- **Abstraction**: Hiding internal complexity behind clear interfaces.
- **Inheritance**: Code reuse through parent-child class relationships.
- **Polymorphism**: Overloading (compile-time) and Overriding (runtime dynamic dispatch).

### 2. SOLID Design Principles
- **S**ingle Responsibility Principle: A class should have only one reason to change.
- **O**pen/Closed Principle: Open for extension, closed for modification.
- **L**iskov Substitution: Subtypes must be substitutable for their base types without altering correctness.
- **I**nterface Segregation: Clients should not be forced to depend on methods they do not use.
- **D**ependency Inversion: Depend on abstractions, not on concrete classes.`,
    key_takeaways: [
      'Explain runtime polymorphism and vtables',
      'Apply SOLID principles to refactor tightly-coupled classes',
      'Identify when Composition is preferred over Inheritance',
    ],
    created_at: '2026-09-06T10:00:00Z',
    updated_at: '2026-09-15T10:00:00Z',
  },

  // ==========================================
  // APTITUDE & REASONING TRACK TOPICS
  // ==========================================
  {
    id: 'm3010000-0000-0000-0000-000000000003',
    title: 'Quantitative Aptitude & Numerical Reasoning Accelerator',
    description:
      'High-yield mathematical problem solving: percentages, speed-distance-time, work-efficiency, and probability formulas used in screening assessments.',
    category: 'Aptitude',
    sub_category: 'Quantitative Aptitude',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'All Engineering Disciplines',
    estimated_time: '45 mins',
    content: `# Quantitative Aptitude Core Techniques

### 1. Time, Speed & Distance
- **Relative Speed**: S1 + S2 when traveling in opposite directions; |S1 - S2| when moving in the same direction.
- **Average Speed**: For equal distance legs: 2 * S1 * S2 / (S1 + S2).
- **Unit Conversion**: 1 km/h = 5/18 m/s.

### 2. Work & Efficiency
Express efficiency as the reciprocal of days required.
If Worker A completes a task in 12 days and Worker B in 18 days:
Combined Work/Day = 1/12 + 1/18 = 5/36
Total Days = 36/5 = 7.2 days.`,
    key_takeaways: [
      'Quickly convert km/h to m/s using 5/18',
      'Calculate joint work via reciprocal unitary efficiency',
      'Deconstruct compound probability through Venn combinations',
    ],
    created_at: '2026-09-03T10:00:00Z',
    updated_at: '2026-09-12T11:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000004',
    title: 'Logical Deduction, Analytical Puzzles & Syllogisms',
    description:
      'Master structured constraint solving: seating arrangements, syllogisms, blood relations, and pattern recognition for aptitude rounds.',
    category: 'Aptitude',
    sub_category: 'Logical Reasoning',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'All Engineering Disciplines',
    estimated_time: '45 mins',
    content: `# Logical & Analytical Deduction

### 1. Seating Arrangements
- **Step 1**: Identify absolute, definite clues first.
- **Step 2**: Track directional vectors (Facing North vs South; Facing Center in circles).
- **Step 3**: Split into parallel cases if an ambiguous branch occurs.

### 2. Syllogisms
- Use minimum-overlap Venn diagrams.
- Conclusions are valid only if they hold true across every possible scenario.`,
    key_takeaways: [
      'Anchor absolute positional clues before conditional branches',
      'Validate syllogisms across all possible Venn configurations',
      'Identify Either/Or complementary pairs efficiently',
    ],
    created_at: '2026-09-04T10:00:00Z',
    updated_at: '2026-09-13T15:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000016',
    title: 'Verbal Ability & Technical Comprehension',
    description:
      'Master critical reading comprehension, sentence completion, error spotting, and professional vocabulary for campus screening rounds.',
    category: 'Aptitude',
    sub_category: 'Verbal Ability',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '35 mins',
    content: `# Verbal Ability & Technical Comprehension

### 1. Subject-Verb Agreement Rules
- Phrases starting with "Each", "Everyone", "Neither", "Either" take singular verbs.
- Intervening prepositional phrases do not alter subject number.

### 2. Reading Comprehension Strategy
- Skim questions first to understand key focal points before reading dense passages.
- Distinguish between directly stated facts and inferred assumptions.`,
    key_takeaways: [
      'Eliminate grammatical errors through subject-verb agreement isolation',
      'Pre-read comprehension questions to target relevant textual paragraphs',
    ],
    created_at: '2026-09-05T10:00:00Z',
    updated_at: '2026-09-14T10:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000017',
    title: 'Data Interpretation: Tables, Bar Charts & Pie Visualizations',
    description:
      'Rapid calculation techniques for data-heavy charts: percentage changes, ratios, weighted averages, and multi-graph synthesis.',
    category: 'Aptitude',
    sub_category: 'Data Interpretation',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '40 mins',
    content: `# Data Interpretation Techniques

### 1. Percentage Change Shortcuts
- Absolute change vs relative base.
- Percentage Increase = (New - Old) / Old * 100%.

### 2. Pie Chart Conversion
- 100% corresponds to 360 degrees.
- 1% = 3.6 degrees. To convert degrees to percentage, divide by 3.6.`,
    key_takeaways: [
      'Quickly convert pie chart degrees to percentages',
      'Use approximation techniques for multi-digit calculations',
    ],
    created_at: '2026-09-06T10:00:00Z',
    updated_at: '2026-09-15T11:00:00Z',
  },

  // ==========================================
  // HR & BEHAVIORAL TRACK TOPICS
  // ==========================================
  {
    id: 'm3010000-0000-0000-0000-000000000005',
    title: 'Behavioral Interviewing: The STAR Method & Leadership Fit',
    description:
      'Proven strategy for behavioral HR rounds: structuring past experiences with Situation, Task, Action, and Result to convey maturity and impact.',
    category: 'HR',
    sub_category: 'Behavioral Questions',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '40 mins',
    content: `# The STAR Method for Behavioral Interviews

### S - Situation (15% of answer)
Set the scene. Provide context about the project, hackathon, or classroom challenge.

### T - Task (15% of answer)
Define your explicit role and responsibility. What challenge needed to be solved?

### A - Action (55% of answer)
The core of your answer. What tools, algorithms, decisions, or interpersonal communication did you initiate? Use "I" rather than vague "we".

### R - Result (15% of answer)
Quantify the positive outcome:
- "Reduced API response latency by 45%."
- "Delivered the prototype 3 days ahead of the hackathon deadline."
- "What did you learn from the experience?"`,
    key_takeaways: [
      'Structure every behavioral answer using STAR',
      'Spend 50%+ time explaining your direct actions',
      'Always quantify results and articulate lessons learned',
    ],
    created_at: '2026-09-05T10:00:00Z',
    updated_at: '2026-09-14T09:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000018',
    title: 'Common HR Questions & Career Alignment',
    description:
      'Master the standard institutional HR questions: "Tell me about yourself", strengths, weaknesses, 5-year vision, and company alignment.',
    category: 'HR',
    sub_category: 'Common HR Questions',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '35 mins',
    content: `# Standard HR Interview Strategies

### 1. "Tell Me About Yourself"
Follow the Chronological Elevator Formula:
1. Past: Engineering foundation & passion origin.
2. Present: Core technical projects, internships, and primary tech stack.
3. Future: Why this specific recruiter is the logical next milestone in your trajectory.

### 2. Weaknesses
State a genuine professional area of growth paired with the active mechanism you deployed to overcome it.`,
    key_takeaways: [
      'Deliver a structured 90-second elevator pitch',
      'Frame weaknesses around active corrective habits',
    ],
    created_at: '2026-09-06T10:00:00Z',
    updated_at: '2026-09-15T12:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000019',
    title: 'Professional Communication & Executive Presence',
    description:
      'Body language, virtual camera etiquette, vocal clarity, structured pausing, and answering with confidence.',
    category: 'HR',
    sub_category: 'Communication',
    difficulty: 'Beginner',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '30 mins',
    content: `# Communication & Executive Presence

### 1. Virtual & On-Campus Presence
- Maintain eye contact with the camera lens, not the screen.
- Use deliberate pauses rather than filler words ("um", "like", "you know").

### 2. Active Listening
Summarize questions before responding to ensure full alignment with interviewer intent.`,
    key_takeaways: [
      'Replace fillers with confident pauses',
      'Confirm question requirements before formulating answers',
    ],
    created_at: '2026-09-07T10:00:00Z',
    updated_at: '2026-09-16T10:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000020',
    title: 'Interview Frameworks & Strategic Negotiation',
    description:
      'Understanding recruiter grading rubrics, situational scoring matrices, and reverse-interviewing the recruiter with smart questions.',
    category: 'HR',
    sub_category: 'Interview Frameworks',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '35 mins',
    content: `# Strategic Interview Frameworks

### Reverse Interviewing Questions
When the interviewer asks: "Do you have any questions for us?"
1. "What does a high-impact week look like for an entry-level engineer on your team?"
2. "How does your engineering division balance feature velocity with technical debt reduction?"`,
    key_takeaways: [
      'Ask insightful questions that reflect real engineering curiosity',
      'Understand how recruiters score behavioral dimensions',
    ],
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-17T10:00:00Z',
  },

  // ==========================================
  // COMPANY-SPECIFIC TRACK
  // ==========================================
  {
    id: 'm3010000-0000-0000-0000-000000000006',
    title: 'Microsoft IDC: Cloud & Distributed Engineering Interview Guide',
    description:
      'Curated playbook for Microsoft India Development Center: Azure distributed storage, thread safety, low-level design, and Director round fitment.',
    category: 'Technical',
    sub_category: 'Cloud & Distributed Systems',
    difficulty: 'Advanced',
    company_id: 'c101-msft',
    job_role: 'Software Development Engineer (Cloud & AI)',
    estimated_time: '75 mins',
    content: `# Microsoft IDC Interview Playbook

### 1. Codility Assessment Focus
- 3 algorithmic questions in 90 minutes.
- Tests optimal time and space complexity plus boundary edge cases (e.g. empty lists, single elements, negative numbers, potential integer overflow).

### 2. System Architecture & Low-Level Design
- Microsoft evaluates clean Object-Oriented Principles (SOLID).
- Expect questions on multi-threading, concurrency, idempotency, and cloud distributed data caches.

### 3. Growth Mindset in Director Round
- Microsoft values learning from past failures.
- Be prepared to discuss a project where things went wrong and how you methodically debugged and resolved the roadblock.`,
    key_takeaways: [
      'Write clean, modular code with defensive edge-case checks',
      'Demonstrate deep understanding of thread synchronization and idempotency',
      'Exhibit growth mindset and active problem solving in director rounds',
    ],
    created_at: '2026-09-06T10:00:00Z',
    updated_at: '2026-09-15T11:00:00Z',
    company: SEED_COMPANIES[0],
  },
  {
    id: 'm3010000-0000-0000-0000-000000000007',
    title: 'TCS Digital: Advanced Coding & Technical Qualifier Kit',
    description:
      'Tactical guide for the TCS iON National Qualifier Test (NQT) and Digital track live coding interviews: SQL, Java/Python, and algorithmic puzzles.',
    category: 'Technical',
    sub_category: 'Core Engineering & SQL',
    difficulty: 'Intermediate',
    company_id: 'c102-tcs',
    job_role: 'Digital Software Engineer',
    estimated_time: '50 mins',
    content: `# TCS Digital Recruitment Kit

### 1. Advanced Coding Assessment
- 2 coding problems in 60 minutes on TCS iON platform.
- Problem 1 is typically string manipulation or matrix math.
- Problem 2 is dynamic programming or graph traversal. Target 100% test case pass on Problem 1 before moving to Problem 2.

### 2. Technical Interview Focus
- SQL indexing, joins, and aggregate functions.
- Core OOP paradigms and memory management (garbage collection in Java / Python GIL).`,
    key_takeaways: [
      'Secure 100% pass on Problem 1 before investing time in Problem 2',
      'Prepare SQL joins, subqueries, and grouping sets',
      'Be able to articulate Big-O time and space complexity clearly',
    ],
    created_at: '2026-09-07T10:00:00Z',
    updated_at: '2026-09-16T14:00:00Z',
    company: SEED_COMPANIES[1],
  },
  {
    id: 'm3010000-0000-0000-0000-000000000008',
    title: 'Deloitte USI: Technology Advisory Case Study & Client Scenarios',
    description:
      'Strategy and case study frameworks for Deloitte Advisory interviews: cloud migration trade-offs, cybersecurity governance, and executive communication.',
    category: 'HR',
    sub_category: 'Technology Advisory & Case Studies',
    difficulty: 'Intermediate',
    company_id: 'c103-deloitte',
    job_role: 'Technology Advisory Analyst',
    estimated_time: '50 mins',
    content: `# Deloitte USI Advisory Prep

### 1. Case Study Framework
- **Clarify Business Objective**: Cost optimization, risk mitigation, or customer growth?
- **Pillars of Analysis**: People, Process, Technology, and Governance.
- **Recommendations**: Always present 2-3 viable options with explicit pros, cons, and ROI.

### 2. Partner Leadership Round
- Demonstrates executive presence, active listening, and concise verbal communication.
- Express genuine interest in digital transformation and enterprise architectures.`,
    key_takeaways: [
      'Frame solutions around measurable business value and ROI',
      'Communicate complex technical concepts simply for business stakeholders',
      'Showcase active listening and adaptability during group exercises',
    ],
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-17T16:00:00Z',
    company: SEED_COMPANIES[2],
  },
  {
    id: 'm3010000-0000-0000-0000-000000000022',
    title: 'Cisco Systems: Enterprise Networking & Systems Troubleshooting',
    description:
      'High-yield preparation for Cisco campus interviews: routing protocols (OSPF, BGP), STP switching, packet captures, and Linux network diagnostics.',
    category: 'Technical',
    sub_category: 'Enterprise Networking',
    difficulty: 'Intermediate',
    company_id: 'c106-cisco',
    job_role: 'Technical Consulting Engineer (Networking & Security)',
    estimated_time: '55 mins',
    content: `# Cisco Systems Technical Prep

### 1. Layer 2 Switching Fundamentals
- Spanning Tree Protocol (STP / RSTP): Root bridge election, path cost, blocking states to prevent broadcast storms.
- VLANs and 802.1Q trunking encapsulation.

### 2. Layer 3 Routing & Diagnostics
- OSPF Link-State Advertising and Dijkstra's algorithm.
- Systematic network troubleshooting: Physical -> Data Link (ping / ARP) -> Transport (traceroute, netstat, telnet).`,
    key_takeaways: [
      'Master OSI layer troubleshooting methodologies',
      'Explain STP root bridge election and convergence',
      'Demonstrate practical familiarity with Linux networking tools',
    ],
    created_at: '2026-09-09T10:00:00Z',
    updated_at: '2026-09-17T18:00:00Z',
    company: SEED_COMPANIES[5],
  },
  {
    id: 'm3010000-0000-0000-0000-000000000021',
    title: 'Situational Judgement & Workplace Scenario Analysis',
    description:
      'Handle difficult workplace dilemmas: priority conflicts, missed deadlines, ethical considerations, and uncooperative stakeholders.',
    category: 'HR',
    sub_category: 'Situational Questions',
    difficulty: 'Intermediate',
    company_id: null,
    job_role: 'All Campus Roles',
    estimated_time: '35 mins',
    content: `# Situational Judgement & Workplace Scenarios

### 1. High-Pressure Dilemmas
- **Ethical Integrity**: Never compromise on security, compliance, or honest reporting.
- **Deadline Conflicts**: Escalate early with data, present prioritized trade-offs, and suggest phased deliverables.

### 2. Stakeholder Collaboration
- Seek first to understand conflicting viewpoints before proposing compromises.
- Base arguments on user impact, engineering feasibility, and business value.`,
    key_takeaways: [
      'Balance engineering diligence with business delivery milestones',
      'Handle interpersonal conflicts calmly with objective data',
      'Demonstrate ethical integrity and transparent escalation paths',
    ],
    created_at: '2026-09-09T11:00:00Z',
    updated_at: '2026-09-17T19:00:00Z',
  },
  {
    id: 'm3010000-0000-0000-0000-000000000023',
    title: 'Infosys: Specialist Programmer (SP) & DSE Assessment Guide',
    description:
      'Curated playbook for Infosys HackWithInfy and SP/DSE qualifier assessments: advanced dynamic programming, graph algorithms, and system architecture.',
    category: 'Technical',
    sub_category: 'Competitive Programming & Systems',
    difficulty: 'Advanced',
    company_id: 'c104-infy',
    job_role: 'Specialist Programmer / Digital Specialist Engineer',
    estimated_time: '60 mins',
    content: `# Infosys Specialist Programmer Playbook

### 1. Advanced Coding Assessment Structure
- 3 algorithmic problems in 3 hours with strict execution time limits.
- High focus on Dynamic Programming with bitmasks, Disjoint Set Union (DSU), and Segment Trees.

### 2. Technical Interview Focus
- Code walkthrough of your qualifier solutions.
- Thorough probing on complexity analysis and alternate approaches.
- Real-world database transactions and indexing mechanics.`,
    key_takeaways: [
      'Target full test case coverage on Problem 1 and Problem 2',
      'Explain DP space optimization techniques clearly',
      'Be prepared to defend your code choices line-by-line',
    ],
    created_at: '2026-09-09T12:00:00Z',
    updated_at: '2026-09-17T20:00:00Z',
    company: SEED_COMPANIES[3],
  },
];
