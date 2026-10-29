/**
 * 统一出生事实：真太阳时 + 公历农历八字入口，减少各引擎各自解析漂移。
 */
import { BirthInput, eightCharFromBirth, buildLunarFromBirth, computeCalendar, type CalendarResult } from "../calendar";
import type { Lunar, Solar } from "lunar-typescript";

export interface BirthChartCore {
  input: BirthInput;
  calendar: CalendarResult;
  lunar: Lunar;
  solar: Solar;
  eightChar: ReturnType<Lunar["getEightChar"]>;
  dayMaster: string;
  pillars: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
}

export function buildBirthChartCore(input: BirthInput): BirthChartCore {
  const calendar = computeCalendar(input);
  const { lunar, solar } = buildLunarFromBirth(input);
  const eightChar = eightCharFromBirth(lunar, input);
  return {
    input,
    calendar,
    lunar,
    solar,
    eightChar,
    dayMaster: eightChar.getDayGan(),
    pillars: {
      year: calendar.ganZhiYear,
      month: calendar.ganZhiMonth,
      day: calendar.ganZhiDay,
      time: calendar.timeKnown ? calendar.ganZhiTime : "",
    },
  };
}
