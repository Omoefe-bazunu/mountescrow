"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const dropdownRef = useRef(null);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected option label
  useEffect(() => {
    const selected = options.find((opt) => opt.value === value);
    setSelectedLabel(selected?.label || "");
  }, [value, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    console.log("🔍 Option selected:", option);

    // Pass the entire option object if needed, or just the value
    onValueChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  // And update the options rendering to show more info:
  {
    filteredOptions.map((option) => (
      <div
        key={option.value}
        className={cn(
          "flex flex-col px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
          value === option.value && "bg-blue-50"
        )}
        onClick={() => handleSelect(option)}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{option.label}</span>
          {value === option.value && (
            <Check className="h-4 w-4 text-blue-600" />
          )}
        </div>
        {option.domBankCode && (
          <span className="text-xs text-gray-500 mt-1">
            Code: {option.domBankCode} →{" "}
            {String(option.domBankCode).padStart(6, "0")}
          </span>
        )}
      </div>
    ));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={cn(
          "flex items-center justify-between w-full p-3 border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn(!selectedLabel && "text-gray-500")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Search input */}
          <div className="sticky top-0 p-2 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search banks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-center">
                No banks found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                    value === option.value && "bg-blue-50"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
