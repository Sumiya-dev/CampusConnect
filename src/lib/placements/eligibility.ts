import { PlacementDrive, Student } from '../types/database.types';
import { EligibilityResult } from '../types/drive.types';

export interface StudentEligibilityProfile {
  cgpa: number;
  department: string;
  year: number;
  skills: string[];
  backlogs?: number;
}

export function evaluateEligibility(
  student: StudentEligibilityProfile,
  drive: PlacementDrive
): EligibilityResult {
  const reasons: string[] = [];
  const passedChecks: string[] = [];

  // 1. CGPA Threshold Check
  const studentCgpa = Number(student.cgpa) || 0;
  const minCgpa = Number(drive.min_cgpa) || 0;
  const cgpaDelta = Number((studentCgpa - minCgpa).toFixed(2));

  if (studentCgpa < minCgpa) {
    reasons.push(
      `Minimum CGPA required is ${minCgpa.toFixed(2)}, but your recorded CGPA is ${studentCgpa.toFixed(2)}.`
    );
  } else {
    passedChecks.push(
      `CGPA criteria satisfied: ${studentCgpa.toFixed(2)} meets the minimum threshold of ${minCgpa.toFixed(2)}.`
    );
  }

  // 2. Department / Academic Branch Check
  if (drive.eligible_departments && drive.eligible_departments.length > 0) {
    const studentDeptNorm = (student.department || '').toLowerCase().trim();
    const isDeptEligible = drive.eligible_departments.some((dept) => {
      const dNorm = dept.toLowerCase().trim();
      return (
        studentDeptNorm === dNorm ||
        studentDeptNorm.includes(dNorm) ||
        dNorm.includes(studentDeptNorm) ||
        (studentDeptNorm.includes('cse') && dNorm.includes('computer')) ||
        (studentDeptNorm.includes('computer') && dNorm.includes('cse')) ||
        (studentDeptNorm.includes('it') && dNorm.includes('information')) ||
        (studentDeptNorm.includes('ece') && dNorm.includes('electronics'))
      );
    });

    if (!isDeptEligible) {
      reasons.push(
        `Department restriction: Your branch (${student.department || 'Unspecified'}) is not listed among the eligible disciplines (${drive.eligible_departments.join(', ')}).`
      );
    } else {
      passedChecks.push(
        `Academic discipline verified: ${student.department} is an approved branch.`
      );
    }
  }

  // 3. Academic Cohort Year Check
  if (drive.eligible_years && drive.eligible_years.length > 0) {
    const studentYear = Number(student.year);
    const isYearEligible = drive.eligible_years.includes(studentYear);

    if (!isYearEligible) {
      reasons.push(
        `Academic cohort restriction: This drive is open exclusively for Year ${drive.eligible_years.join(
          ' and '
        )} students. Your current standing is Year ${studentYear}.`
      );
    } else {
      passedChecks.push(`Academic standing confirmed: Year ${studentYear} student.`);
    }
  }

  // 4. Active Backlogs Limit Check
  if (student.backlogs !== undefined && student.backlogs !== null) {
    const studentBacklogs = Number(student.backlogs) || 0;
    const maxAllowed = Number(drive.max_backlogs) || 0;

    if (studentBacklogs > maxAllowed) {
      reasons.push(
        `Active backlogs restriction: This drive permits at most ${maxAllowed} active backlog(s), but you currently have ${studentBacklogs}.`
      );
    } else {
      passedChecks.push(
        `Backlogs criteria satisfied: ${studentBacklogs} active backlogs (max allowed: ${maxAllowed}).`
      );
    }
  }

  // 5. Skills Match Analysis
  const studentSkillsNorm = (student.skills || []).map((s) => s.toLowerCase().trim());
  const driveSkills = drive.required_skills || [];

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of driveSkills) {
    const sNorm = skill.toLowerCase().trim();
    const isMatched = studentSkillsNorm.some(
      (studentSkill) =>
        studentSkill === sNorm ||
        sNorm.includes(studentSkill) ||
        studentSkill.includes(sNorm)
    );
    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const isEligible = reasons.length === 0;

  return {
    isEligible,
    reasons,
    passedChecks,
    matchedSkills,
    missingSkills,
    cgpaDelta,
  };
}
