import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import type { Subscription } from '@/types';

interface AccountAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  subscriptions: Subscription[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const AccountAutocomplete: React.FC<AccountAutocompleteProps> = ({
  value,
  onChange,
  subscriptions,
  placeholder = "Enter account email...",
  required = false,
  className = "",
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Extract unique accounts from existing subscriptions
  const getUniqueAccounts = (): string[] => {
    const accounts = subscriptions.map(sub => sub.account).filter(Boolean);
    return [...new Set(accounts)].sort();
  };

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const uniqueAccounts = getUniqueAccounts();
    const filtered = uniqueAccounts.filter(account =>
      account.toLowerCase().includes(value.toLowerCase())
    );
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
    setActiveSuggestion(-1);
  }, [value, subscriptions]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (value.trim()) {
      const uniqueAccounts = getUniqueAccounts();
      const filtered = uniqueAccounts.filter(account =>
        account.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  // Handle input blur with delay to allow suggestion clicks
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }, 200);
  };

  // Handle suggestion click
  const handleSuggestionClick = (account: string) => {
    onChange(account);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0) {
          handleSuggestionClick(suggestions[activeSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
        >
          {suggestions.map((account, index) => (
            <div
              key={account}
              onClick={() => handleSuggestionClick(account)}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === activeSuggestion
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              {account}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountAutocomplete;