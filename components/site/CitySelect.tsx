"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type ChinaCity, cityLabel, searchCities } from "@/lib/geo/china-cities";

type CitySelectProps = {
  placeholder?: string;
  emptyHint?: string;
  clearLabel?: string;
  onSelect: (city: ChinaCity | null) => void;
};

export function CitySelect({
  placeholder = "搜索城市，如：成都、苏州",
  emptyHint = "无匹配城市",
  clearLabel = "清除选择",
  onSelect,
}: CitySelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ChinaCity | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const results = searchCities(query, 50);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function pick(city: ChinaCity) {
    setSelected(city);
    setQuery(cityLabel(city));
    setOpen(false);
    onSelect(city);
  }

  function clear() {
    setSelected(null);
    setQuery("");
    setOpen(false);
    onSelect(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && open && results[activeIndex]) {
      e.preventDefault();
      pick(results[activeIndex]);
    }
  }

  return (
    <div className="city-select" ref={rootRef}>
      <div className="city-select-row">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setOpen(true);
            if (!e.target.value.trim()) onSelect(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {(selected || query) && (
          <button type="button" className="city-select-clear" onClick={clear} aria-label={clearLabel}>
            ×
          </button>
        )}
      </div>
      {open && (
        <ul id={listId} className="city-select-list" role="listbox">
          {results.length === 0 ? (
            <li className="city-select-empty">{emptyHint}</li>
          ) : (
            results.map((city, idx) => (
              <li key={`${city.province}-${city.name}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={idx === activeIndex ? "is-active" : undefined}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => pick(city)}
                >
                  <span>{city.name}</span>
                  <span className="city-select-meta">{city.province}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
