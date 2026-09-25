-- ==============================================================================
-- CAMPUSCONNECT AI - SEED DATA: REPUTED RECRUITERS & PLACEMENT DRIVES
-- Inserts initial active companies and campus recruitment drives
-- ==============================================================================

-- 1. Insert Reputed Corporate Recruiters
INSERT INTO public.companies (
    id,
    company_name,
    industry,
    description,
    website,
    location,
    contact_name,
    contact_email,
    contact_phone,
    status
) VALUES 
(
    'c1010000-0000-0000-0000-000000000001',
    'Microsoft India Development Center',
    'Software & Cloud Infrastructure',
    'Global innovation hub driving Azure distributed systems, developer technologies, Office 365 services, and enterprise artificial intelligence solutions.',
    'https://careers.microsoft.com',
    'Hyderabad / Bengaluru',
    'Aditi Sharma',
    'aditi.sharma@microsoft.com',
    '+91 80 6789 1200',
    'active'
),
(
    'c1020000-0000-0000-0000-000000000002',
    'Tata Consultancy Services',
    'Information Technology & Consulting',
    'Multinational information technology services and consulting company, pioneering digital business transformation and enterprise AI implementations worldwide.',
    'https://www.tcs.com',
    'Mumbai / Pune / Chennai / Bengaluru',
    'Rajesh Varma',
    'rajesh.varma@tcs.com',
    '+91 22 6778 9000',
    'active'
),
(
    'c1030000-0000-0000-0000-000000000003',
    'Deloitte USI',
    'Management & Technology Consulting',
    'Providing audit, consulting, tax, and advisory services to Fortune 500 enterprises with specialization in cloud security, data engineering, and strategy.',
    'https://www2.deloitte.com',
    'Hyderabad / Bengaluru / Gurugram',
    'Pooja Iyer',
    'piyer@deloitte.com',
    '+91 40 7198 5000',
    'active'
),
(
    'c1040000-0000-0000-0000-000000000004',
    'Infosys Limited',
    'Information Technology & Consulting',
    'Global leader in next-generation digital services and consulting, enabling clients in more than 50 countries to navigate their digital transformation.',
    'https://www.infosys.com',
    'Bengaluru / Pune / Hyderabad',
    'Siddharth Rao',
    'siddharth_rao@infosys.com',
    '+91 80 2852 0261',
    'active'
),
(
    'c1060000-0000-0000-0000-000000000006',
    'Cisco Systems India',
    'Computer Networking & Cybersecurity',
    'Worldwide technology leader in securely connecting everything to make anything possible, powering high-resilience campus networks and zero-trust security.',
    'https://www.cisco.com',
    'Bengaluru',
    'Karan Mehra',
    'karan.mehra@cisco.com',
    '+91 80 4426 0000',
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Active Campus Placement Drives
INSERT INTO public.placement_drives (
    id,
    company_id,
    job_role,
    package_details,
    tier,
    location,
    description,
    min_cgpa,
    eligible_departments,
    eligible_years,
    max_backlogs,
    required_skills,
    recruitment_stages,
    registration_deadline,
    drive_date,
    drive_time,
    venue,
    instructions,
    required_documents,
    vacancies,
    bond_period,
    status
) VALUES 
(
    'd2010000-0000-0000-0000-000000000001',
    'c1010000-0000-0000-0000-000000000001',
    'Software Development Engineer (Cloud & AI)',
    '₹44.50 LPA (Base: ₹18.0 LPA + RSUs)',
    'Tier 1 (Super Dream)',
    'Hyderabad / Bengaluru',
    'Microsoft India Development Center (IDC) is driving engineering innovations across Azure distributed cloud infrastructure, Office 365 services, Developer Tools, and Copilot AI systems. Selected engineers will architect high-concurrency microservices, distributed storage pipelines, and global-scale data platforms.',
    8.00,
    ARRAY['Computer Science & Engineering', 'Information Technology'],
    ARRAY[3, 4],
    0,
    ARRAY['Data Structures & Algorithms', 'TypeScript', 'Distributed Systems', 'Cloud Computing'],
    ARRAY[
        'Round 1: Online Technical Assessment (3 Algorithmic Problems on Codility - 90 mins)',
        'Round 2: System Architecture & Data Structures (Virtual Technical)',
        'Round 3: Concurrent Programming & Low-Level Design',
        'Round 4: Engineering Director Fitment & System Scale Evaluation'
    ],
    timezone('utc'::text, now() + interval '45 days'),
    timezone('utc'::text, now() + interval '55 days'),
    '09:00 AM IST',
    'Virtual Teams Assessment & Microsoft IDC Hyderabad',
    ARRAY[
        'Candidates must carry their verified Institutional ID card and two updated physical resumes.',
        'Ensure college grade reports through Semester 6 are verified on your student profile.',
        'Formal academic attire is strictly mandatory for all evaluation rounds.'
    ],
    ARRAY['College ID Card', 'Latest Official Grade Card', 'Updated Resume (2 Copies)', 'Government Photo ID'],
    '12 Positions',
    'No Service Bond',
    'open'
),
(
    'd2020000-0000-0000-0000-000000000002',
    'c1020000-0000-0000-0000-000000000002',
    'Digital Software Engineer',
    '₹7.50 – ₹9.00 LPA + Incentives',
    'Core Recruiter',
    'Bengaluru / Hyderabad / Pune / Chennai',
    'TCS Digital is the premier engineering division of Tata Consultancy Services, focusing on next-generation cloud architectures, AI solutions, distributed microservices, and enterprise applications for Fortune 500 partners globally.',
    7.00,
    ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics'],
    ARRAY[3, 4],
    0,
    ARRAY['Data Structures & Algorithms', 'Java / Python', 'SQL Database Design', 'Web Technologies'],
    ARRAY[
        'Round 1: National Qualifier Online Cognitive & Coding Assessment (TCS iON)',
        'Round 2: Technical Evaluation & Live Coding Interview (Virtual)',
        'Round 3: Managerial Assessment & HR Fitment Round'
    ],
    timezone('utc'::text, now() + interval '40 days'),
    timezone('utc'::text, now() + interval '48 days'),
    '09:00 AM IST',
    'Campus Placement Labs A & B / Online Proctored',
    ARRAY[
        'Candidates must carry verified college ID card and two updated physical resumes.',
        'Formal academic dress code is strictly mandatory during all on-campus stages.',
        'Maintain stable internet connectivity for the virtual technical stage.'
    ],
    ARRAY['College ID Card', 'Semester Mark Sheets', 'Resume (2 Copies)', 'Aadhaar / Government ID'],
    '45 Positions',
    'No Service Bond',
    'open'
),
(
    'd2030000-0000-0000-0000-000000000003',
    'c1030000-0000-0000-0000-000000000003',
    'Technology Advisory Analyst',
    '₹8.10 – ₹12.80 LPA + Bonus',
    'Tier 1 (Dream)',
    'Hyderabad / Bengaluru / Gurugram',
    'Deloitte Technology Advisory provides strategy, architecture, cybersecurity, and cloud migration services to premier global brands across finance, life sciences, healthcare, and public sector organizations.',
    7.50,
    ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering'],
    ARRAY[3, 4],
    0,
    ARRAY['Analytical Problem Solving', 'Python / SQL', 'Cloud Fundamentals', 'Data Structures & Algorithms'],
    ARRAY[
        'Round 1: Deloitte Aptitude, Verbal & Technical MCQ Screen',
        'Round 2: Group Case Study Discussion & Technical Presentation',
        'Round 3: Partner Leadership Interview'
    ],
    timezone('utc'::text, now() + interval '50 days'),
    timezone('utc'::text, now() + interval '58 days'),
    '09:30 AM IST',
    'Deloitte Virtual Assessment Suite',
    ARRAY[
        'Review the Deloitte Advisory candidate guide before the group discussion stage.',
        'Formal business attire required for the virtual partner round.'
    ],
    ARRAY['College ID Card', 'Latest Grade Sheet', 'Updated Resume', 'Government Photo ID'],
    '25 Positions',
    'None',
    'open'
),
(
    'd2040000-0000-0000-0000-000000000004',
    'c1040000-0000-0000-0000-000000000004',
    'Specialist Programmer (Power Programmer)',
    '₹9.50 LPA + Relocation Allowance',
    'Core Recruiter',
    'Bengaluru / Mysuru / Pune',
    'Specialist Programmers at Infosys work directly on cutting-edge digital transformation projects, AI algorithms, and mission-critical cloud migrations for international financial and industrial institutions.',
    7.20,
    ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Electrical & Electronics'],
    ARRAY[3, 4],
    1,
    ARRAY['Object Oriented Programming', 'Python / Java', 'Data Structures & Algorithms', 'Database Queries'],
    ARRAY[
        'Round 1: Infosys HackWithInfy / National Coding Assessment',
        'Round 2: Live Code Demonstration & System Review',
        'Round 3: Technical HR Evaluation'
    ],
    timezone('utc'::text, now() + interval '55 days'),
    timezone('utc'::text, now() + interval '65 days'),
    '10:00 AM IST',
    'Auditorium Hall C & Computer Labs',
    ARRAY[
        'Candidates must maintain accurate institutional contact numbers on their profile.',
        'Active verification from academic faculty advisor is required for hall ticket issuance.'
    ],
    ARRAY['College ID Card', 'Mark Sheets', 'Resume (2 Copies)'],
    '30 Positions',
    '1 Year Agreement',
    'open'
),
(
    'd2050000-0000-0000-0000-000000000005',
    'c1060000-0000-0000-0000-000000000006',
    'Technical Consulting Engineer (Networking & Security)',
    '₹17.50 LPA (Base: ₹13.0 LPA + Benefits)',
    'Tier 1 (Dream)',
    'Bengaluru',
    'Cisco Customer Experience engineering teams design, troubleshoot, and automate enterprise architectures, cybersecurity zero-trust platforms, and mission-critical cloud backbones worldwide.',
    7.80,
    ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
    ARRAY[3, 4],
    0,
    ARRAY['Computer Networks', 'Python', 'Linux', 'Cybersecurity Fundamentals'],
    ARRAY[
        'Round 1: Online Networking & Coding Test (90 mins)',
        'Round 2: Technical System Troubleshooting & Architecture',
        'Round 3: Leadership & Team Fitment Interview'
    ],
    timezone('utc'::text, now() + interval '60 days'),
    timezone('utc'::text, now() + interval '70 days'),
    '09:30 AM IST',
    'Cisco Virtual Assessment & Bangalore Campus',
    ARRAY[
        'Stable broadband connection and working webcam mandatory for all virtual stages.',
        'Formal academic attire required.'
    ],
    ARRAY['College ID Card', 'Official Transcripts', 'Resume (PDF)'],
    '15 Positions',
    'None',
    'open'
)
ON CONFLICT (id) DO NOTHING;
