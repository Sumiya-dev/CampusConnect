'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ComboboxSkillsInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  presetOptions: string[];
  initialSkills?: string[];
  onChange?: (skills: string[]) => void;
}

export function ComboboxSkillsInput({
  name,
  placeholder = 'Select from list or type custom skill...',
  presetOptions,
  initialSkills = [],
  onChange,
}: ComboboxSkillsInputProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      setIsOpen(false);
      return;
    }
    const updated = [...skills, trimmed];
    setSkills(updated);
    setInputValue('');
    setIsOpen(false);
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
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Filter options based on input value and remove already added
  const filteredOptions = presetOptions.filter((option) => {
    const matchesInput = option.toLowerCase().includes(inputValue.toLowerCase());
    const notSelected = !skills.some((s) => s.toLowerCase() === option.toLowerCase());
    return matchesInput && notSelected;
  });

  const isCustomSkill =
    inputValue.trim().length > 0 &&
    !presetOptions.some((opt) => opt.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !skills.some((s) => s.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={JSON.stringify(skills)} />

      {/* Input row with Combobox toggle */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="text-sm h-10 bg-[#0A0A0A] border-[#222222] text-[#EDEDED] placeholder:text-[#9AA1AA] focus:border-[#FF6B00] pr-8"
            />
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA1AA] hover:text-[#EDEDED] cursor-pointer"
              tabIndex={-1}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSkill(inputValue)}
            disabled={!inputValue.trim()}
            className="shrink-0 text-sm h-10 px-3 font-normal"
          >
            Add
          </Button>
        </div>

        {/* Dropdown Options List */}
        {isOpen && (
          <div className="absolute z-30 w-full mt-1 max-h-52 overflow-y-auto bg-[#0A0A0A] border border-[#222222] rounded-md shadow-xl py-1 text-sm">
            {isCustomSkill && (
              <button
                type="button"
                onClick={() => addSkill(inputValue)}
                className="w-full text-left px-3 py-2 text-[#FF6B00] hover:bg-[#121212] flex items-center justify-between transition-colors cursor-pointer border-b border-[#222222]"
              >
                <span>Add custom: &quot;{inputValue.trim()}&quot;</span>
                <span className="text-sm text-[#9AA1AA]">Press Enter</span>
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => addSkill(option)}
                  className="w-full text-left px-3 py-2 text-[#EDEDED] hover:bg-[#121212] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{option}</span>
                </button>
              ))
            ) : !isCustomSkill ? (
              <div className="px-3 py-2 text-[#9AA1AA] text-sm">
                {inputValue ? 'No matching preset skills. Type custom skill and press Add.' : 'All preset skills added.'}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected Skills Chips */}
      <div className="flex flex-wrap gap-2 min-h-[28px] items-center">
        {skills.length === 0 ? (
          <span className="text-sm text-[#9AA1AA]">
            No skills selected yet. Select from the dropdown or type custom above.
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
    </div>
  );
}
