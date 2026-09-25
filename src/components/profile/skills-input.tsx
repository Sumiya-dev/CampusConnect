'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SkillsInputProps {
  initialSkills?: string[];
  onChange?: (skills: string[]) => void;
}

const COMMON_SKILL_SUGGESTIONS = [
  'Data Structures',
  'Algorithms',
  'TypeScript',
  'Python',
  'React.js',
  'PostgreSQL',
  'Node.js',
  'Docker',
  'Machine Learning',
  'System Design',
  'Java',
  'C++',
  'Git',
];

export function SkillsInput({ initialSkills = [], onChange }: SkillsInputProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [inputValue, setInputValue] = useState('');

  const addSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    const updated = [...skills, trimmed];
    setSkills(updated);
    setInputValue('');
    onChange?.(updated);
  };

  const removeSkill = (skillToRemove: string) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    onChange?.(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(inputValue);
    }
  };

  const availableSuggestions = COMMON_SKILL_SUGGESTIONS.filter(
    (s) => !skills.some((curr) => curr.toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Hidden input for form submission */}
      <input type="hidden" name="skills" value={JSON.stringify(skills)} />

      {/* Current Skills Tags - No unnecessary enclosing box */}
      <div className="flex flex-wrap gap-2 min-h-[32px] items-center">
        {skills.length === 0 ? (
          <span className="text-sm text-[#9AA1AA]">
            No skills added yet. Add competencies below.
          </span>
        ) : (
          skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#222222] bg-[#121212] text-[#EDEDED] text-sm font-normal"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-[#9AA1AA] hover:text-[#EDEDED] transition-colors cursor-pointer"
                title={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add New Skill Input */}
      <div className="flex gap-2 max-w-md">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add skill (e.g. Docker, Python) and press Enter"
          className="text-sm h-10 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] focus:border-[#FF6B00]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addSkill(inputValue)}
          className="shrink-0 text-sm h-10 px-3 font-normal"
        >
          Add
        </Button>
      </div>

      {/* Suggestions as subtle text triggers */}
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#9AA1AA]">
          <span className="text-sm">Suggestions:</span>
          {availableSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSkill(suggestion)}
              className="text-sm text-[#9AA1AA] hover:text-[#EDEDED] underline underline-offset-2 transition-colors cursor-pointer"
            >
              +{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
