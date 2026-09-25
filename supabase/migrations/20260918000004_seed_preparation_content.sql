-- ==============================================================================
-- CAMPUSCONNECT AI - SEED DATA: PREPARATION MATERIALS & INTERVIEW QUESTIONS
-- Covers Technical, Aptitude, HR, and Company-Specific Tracks
-- ==============================================================================

-- 1. Insert Preparation Materials
INSERT INTO public.preparation_materials (
    id,
    title,
    description,
    category,
    sub_category,
    difficulty,
    company_id,
    job_role,
    estimated_time,
    content,
    key_takeaways
) VALUES
(
    'm3010000-0000-0000-0000-000000000001',
    'Data Structures & Algorithmic Problem Solving Mastery',
    'Core patterns for technical coding rounds: sliding window, two pointers, tree traversals, and dynamic programming.',
    'Technical',
    'Algorithms & Data Structures',
    'Advanced',
    NULL,
    'Software Development Engineer',
    '60 mins',
    '# Data Structures & Algorithmic Problem Solving\n\n### 1. Two-Pointer and Sliding Window Patterns\nThe two-pointer technique optimizes array searching and sub-array evaluations from O(N^2) to O(N). When dealing with contiguous subarrays matching a target sum or constraint, maintain left and right pointers expanding and contracting as required.\n\n### 2. Binary Tree Traversals & Recursion Invariants\nEnsure clarity between Pre-order, In-order, and Post-order recursive visits. For BFS level-order operations, always utilize a Double-Ended Queue (Deque) tracking level dimensions.\n\n### 3. Dynamic Programming Formulations\n1. Define state variables: What changes between subproblems?\n2. Establish base cases explicitly.\n3. Formulate the recurrence relation before writing code.\n4. Optimize space complexity: If current state depends only on the previous step, reduce O(N) array storage to O(1) registers.',
    ARRAY['Master O(N) two-pointer patterns', 'Formulate DP state before coding', 'Leverage BFS queues for shortest path in unweighted graphs']
),
(
    'm3010000-0000-0000-0000-000000000002',
    'System Design & Distributed Scalability Fundamentals',
    'Architectural blueprints for scalable systems: load balancers, caching strategies, horizontal partitioning, and CAP theorem.',
    'Technical',
    'System Design',
    'Intermediate',
    NULL,
    'Software Engineer / Cloud Architect',
    '90 mins',
    '# System Design Fundamentals\n\n### 1. Horizontal vs. Vertical Scaling\nVertical scaling adds CPU/RAM to a single node, while horizontal scaling distributes load across commodity machines behind a reverse proxy (e.g., NGINX, AWS ALB).\n\n### 2. Caching Layers & Eviction Policies\nUtilize Redis or Memcached for low-latency in-memory lookup. Choose appropriate eviction strategies (LRU, LFU). Implement cache-aside or write-through patterns based on read vs. write heavy workloads.\n\n### 3. Database Sharding & Replication\n- Master-Replica replication ensures high read throughput.\n- Consistent Hashing minimizes key remapping during cluster resizing.\n- CAP Theorem: In the presence of a network partition, you must trade off between Consistency and Availability.',
    ARRAY['Understand Cache-Aside vs Write-Through', 'Apply Consistent Hashing for sharding', 'Design with CAP Theorem trade-offs']
),
(
    'm3010000-0000-0000-0000-000000000003',
    'Quantitative Aptitude & Numerical Reasoning Accelerator',
    'High-yield mathematical problem solving: percentages, profit-loss, time & work, permutations, and probability.',
    'Aptitude',
    'Quantitative Mathematics',
    'Intermediate',
    NULL,
    'All Engineering Roles',
    '45 mins',
    '# Quantitative Aptitude Core Techniques\n\n### 1. Time, Speed & Distance\nKey shortcut: Relative speed = (S1 + S2) when traveling in opposite directions, and |S1 - S2| when in the same direction. Average speed for equal distance legs = 2(S1 * S2) / (S1 + S2).\n\n### 2. Work & Efficiency\nExpress efficiency as reciprocal of days required. If A does work in 12 days and B in 18 days, combined work per day = 1/12 + 1/18 = 5/36. Total time = 36/5 = 7.2 days.\n\n### 3. Permutations, Combinations & Probability\n- P(n, r) for ordered arrangements.\n- C(n, r) for unordered selections.\n- P(A or B) = P(A) + P(B) - P(A and B).',
    ARRAY['Apply relative speed formulas', 'Calculate work through unitary efficiency', 'Deconstruct compound probability problems']
),
(
    'm3010000-0000-0000-0000-000000000004',
    'Logical Deduction, Analytical Puzzles & Syllogisms',
    'Structuring complex constraints: blood relations, seating arrangements, coding-decoding, and deductive syllogisms.',
    'Aptitude',
    'Logical Reasoning',
    'Intermediate',
    NULL,
    'All Engineering Roles',
    '45 mins',
    '# Logical & Analytical Deduction\n\n### 1. Linear & Circular Seating Arrangements\nAlways anchor statements that provide definitive positions first. Draw directional vectors (Facing North vs. Facing South, Inward vs. Outward).\n\n### 2. Syllogisms via Venn Diagrams\nDecompose statements into Universal Affirmatives (All A are B), Particular Affirmatives (Some A are B), and Negatives. Valid conclusions must hold true in every possible Venn configuration.',
    ARRAY['Anchor absolute positional constraints first', 'Use minimum overlap Venn diagrams for syllogisms', 'Eliminate false deductions via counterexamples']
),
(
    'm3010000-0000-0000-0000-000000000005',
    'Behavioral Interviewing: The STAR Method & Leadership Fit',
    'Framing experiences with Situation, Task, Action, and Result to showcase cultural alignment and accountability.',
    'HR',
    'Behavioral & Situational',
    'Beginner',
    NULL,
    'All Campus Roles',
    '40 mins',
    '# The STAR Technique for Behavioral Rounds\n\n### S - Situation\nBriefly describe the context, team environment, and challenge. Keep it concise (approx 15% of response time).\n\n### T - Task\nDetail your specific responsibility or milestone. Avoid saying "we"; state what was specifically expected of you.\n\n### A - Action\nDetail the exact steps, tools, code, or interpersonal leadership you deployed (approx 60% of response time).\n\n### R - Result\nQuantify outcomes! Did you reduce build time by 30%? Did you deliver the project 2 days ahead of schedule?',
    ARRAY['Structure answers: Situation, Task, Action, Result', 'Quantify project achievements with metrics', 'Own mistakes and emphasize lessons learned']
),
(
    'm3010000-0000-0000-0000-000000000006',
    'Microsoft IDC: Cloud & Distributed Engineering Interview Guide',
    'Exclusive guide tailored for Microsoft India Development Center: Azure services, concurrent algorithms, and Director round prep.',
    'Technical',
    'Company-Specific Technical',
    'Advanced',
    'c1010000-0000-0000-0000-000000000001',
    'Software Development Engineer (Cloud & AI)',
    '75 mins',
    '# Microsoft IDC Technical Interview Playbook\n\n### Round 1 & 2 Focus\nMicrosoft IDC heavily assesses code modularity, edge case resilience (empty input, integer overflow, cycle detection), and clean OOP design in C++, C#, Java, or TypeScript.\n\n### Concurrent Programming & Cloud Architecture\nBe prepared to discuss thread synchronization, deadlocks, idempotency in HTTP APIs, and distributed database consistency. Familiarize yourself with Azure Blob, Event Hubs, and Cosmos DB concepts.\n\n### Growth Mindset\nMicrosoft values learning from past failures. In the Director round, be ready to candidly discuss a technical challenge you navigated and how you communicated trade-offs.',
    ARRAY['Write clean, modular code with edge case checks', 'Be ready to explain thread safety and distributed idempotency', 'Demonstrate growth mindset and willingness to adapt']
),
(
    'm3010000-0000-0000-0000-000000000007',
    'TCS Digital: Advanced Coding & Technical Qualifier Kit',
    'Focused prep for TCS iON National Qualifier Test (NQT) and Digital track live pair programming.',
    'Technical',
    'Company-Specific Technical',
    'Intermediate',
    'c1020000-0000-0000-0000-000000000002',
    'Digital Software Engineer',
    '50 mins',
    '# TCS Digital Recruitment Strategy\n\n### Advanced Coding Assessment\nThe Digital coding section requires solving 2 problems in 60 minutes. Problem 1 typically focuses on string manipulation / matrix traversal. Problem 2 involves DP or greedy search.\n\n### Technical Evaluation\nExpect questions on SQL joins, indexing, Java OOP / Python decorators, and cloud microservice basics. Code clarity and explaining time complexity are critical.',
    ARRAY['Target 100% test case pass on Problem 1 first', 'Practice SQL joins and group by aggregations', 'Articulate Big-O time and space complexity clearly']
),
(
    'm3010000-0000-0000-0000-000000000008',
    'Deloitte USI: Technology Advisory Case Study & Client Scenarios',
    'Mastering business technology consulting: case breakdowns, digital transformation architecture, and client communication.',
    'HR',
    'Company-Specific Advisory',
    'Intermediate',
    'c1030000-0000-0000-0000-000000000003',
    'Technology Advisory Analyst',
    '50 mins',
    '# Deloitte USI Technology Advisory Preparation\n\n### Case Study Framework\n1. Clarify the business objective (Cost reduction? Modernization? Security?).\n2. Break the architecture into: Data, Infrastructure, Security, and Operations.\n3. Present structured trade-offs (e.g. Multi-Cloud vs Single-Vendor lock-in).\n\n### Partner Round\nDemonstrate executive presence, clear verbal communication, active listening, and curiosity about enterprise cloud migrations.',
    ARRAY['Structure recommendations with clear business ROI', 'Communicate technology trade-offs simply', 'Practice active listening in group discussions']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Interview Questions
INSERT INTO public.interview_questions (
    id,
    material_id,
    category,
    question,
    answer_guide,
    company_id,
    job_role,
    interview_type,
    difficulty,
    sample_code,
    tips
) VALUES
(
    'q4010000-0000-0000-0000-000000000001',
    'm3010000-0000-0000-0000-000000000001',
    'Technical',
    'Given an array of integers and a target sum, find the minimum length of a contiguous subarray of which the sum is greater than or equal to the target.',
    'Use a sliding window approach with two pointers (left and right). Expand right while current sum is less than target. When sum >= target, update minLength = min(minLength, right - left + 1) and contract left pointer until sum falls below target. This achieves O(N) time complexity and O(1) extra space.',
    NULL,
    'Software Engineer',
    'Coding Round',
    'Intermediate',
    'function minSubArrayLen(target, nums) {\n  let left = 0, sum = 0, minLen = Infinity;\n  for (let right = 0; right < nums.length; right++) {\n    sum += nums[right];\n    while (sum >= target) {\n      minLen = Math.min(minLen, right - left + 1);\n      sum -= nums[left++];\n    }\n  }\n  return minLen === Infinity ? 0 : minLen;\n}',
    ARRAY['Initialize minLen with Infinity', 'Watch for cases where no valid subarray exists and return 0']
),
(
    'q4010000-0000-0000-0000-000000000002',
    'm3010000-0000-0000-0000-000000000002',
    'Technical',
    'How does consistent hashing prevent cascading failures when a cache node is added or removed?',
    'In standard modular hashing (hash(key) % N), changing N from 10 to 11 causes almost 100% of keys to remap, flooding origin databases. Consistent hashing maps both servers and keys onto a virtual ring (0 to 2^32 - 1). A key is assigned to the first server clockwise on the ring. When a server is added or removed, only k/N keys are remapped on average. Virtual nodes further ensure uniform load distribution across heterogeneous servers.',
    NULL,
    'Cloud / Systems Engineer',
    'System Design',
    'Advanced',
    NULL,
    ARRAY['Explain the virtual ring concept', 'Mention virtual nodes to prevent hot-spotting']
),
(
    'q4010000-0000-0000-0000-000000000003',
    'm3010000-0000-0000-0000-000000000003',
    'Aptitude',
    'A train traveling at 72 km/h crosses a 250m long platform in 25 seconds. What is the length of the train?',
    'Convert speed from km/h to m/s: 72 * (5 / 18) = 20 m/s. Total distance covered in 25s = Speed * Time = 20 * 25 = 500 meters. Total distance = Length of train (L) + Length of platform (250m). Therefore, L = 500 - 250 = 250 meters.',
    NULL,
    'All Engineering Roles',
    'Aptitude Assessment',
    'Beginner',
    NULL,
    ARRAY['Always multiply km/h by 5/18 to convert to m/s', 'Remember train length + platform length = total distance']
),
(
    'q4010000-0000-0000-0000-000000000004',
    'm3010000-0000-0000-0000-000000000004',
    'Aptitude',
    'In a class of 60 students, 40 play Cricket, 35 play Football, and 20 play both sports. How many students play neither sport?',
    'By Principle of Inclusion-Exclusion: Total playing at least one sport = n(C) + n(F) - n(C ∩ F) = 40 + 35 - 20 = 55 students. Students playing neither sport = Total students - Total playing at least one sport = 60 - 55 = 5 students.',
    NULL,
    'All Engineering Roles',
    'Aptitude Assessment',
    'Beginner',
    NULL,
    ARRAY['Draw a two-set Venn diagram to visualize intersections']
),
(
    'q4010000-0000-0000-0000-000000000005',
    'm3010000-0000-0000-0000-000000000005',
    'HR',
    'Tell me about a time you had a technical disagreement with a teammate. How was it resolved?',
    'Structure with STAR:\n- Situation: During our final semester capstone project, our team debated whether to use MongoDB or PostgreSQL.\n- Task: As the backend lead, I needed to reach consensus without delaying sprint milestones.\n- Action: Rather than arguing preferences, I benchmarked our actual workload queries (heavily relational student records with foreign keys). I presented the benchmark data to the team in a 20-minute meeting.\n- Result: The team unanimously agreed on PostgreSQL based on data, and we delivered the project on schedule.',
    NULL,
    'All Campus Roles',
    'HR & Culture Fit',
    'Intermediate',
    NULL,
    ARRAY['Never speak ill of team members', 'Demonstrate data-driven decision making and empathy']
),
(
    'q4010000-0000-0000-0000-000000000006',
    'm3010000-0000-0000-0000-000000000006',
    'Technical',
    'Explain how you would implement a distributed lock in an Azure or cloud microservice ecosystem to avoid race conditions.',
    'Use an external distributed consensus coordinator like Redis (Redlock algorithm) or Azure Blob Storage leases. In Blob Storage, request an exclusive lease with an expiration TTL (e.g., 15-60 seconds). Only the service instance holding the lease token can perform the critical section. Periodically renew the lease (heartbeat) while work is active, and release it in a finally block upon completion.',
    'c1010000-0000-0000-0000-000000000001',
    'Software Development Engineer (Cloud & AI)',
    'Technical Interview',
    'Advanced',
    '// Acquiring Azure Blob Lease\nconst leaseClient = blobClient.getBlobLeaseClient();\nawait leaseClient.acquireLease(30); // 30s TTL\ntry {\n  // Perform critical synchronized operations\n} finally {\n  await leaseClient.releaseLease();\n}',
    ARRAY['Mention lease expiration TTL to prevent permanent deadlocks if a node crashes']
),
(
    'q4010000-0000-0000-0000-000000000007',
    'm3010000-0000-0000-0000-000000000007',
    'Technical',
    'Write an efficient query to find the 2nd highest salary of an employee from an Employee table without using LIMIT/TOP.',
    'Use a subquery with MAX: SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee); Alternatively, use the standard SQL DENSE_RANK() window function: WITH Ranked AS (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk FROM Employee) SELECT salary FROM Ranked WHERE rnk = 2;',
    'c1020000-0000-0000-0000-000000000002',
    'Digital Software Engineer',
    'Technical Evaluation',
    'Intermediate',
    'SELECT MAX(salary) AS SecondHighestSalary\nFROM Employee\nWHERE salary < (SELECT MAX(salary) FROM Employee);',
    ARRAY['Address edge cases: what if all employees earn the exact same salary?']
)
ON CONFLICT (id) DO NOTHING;
