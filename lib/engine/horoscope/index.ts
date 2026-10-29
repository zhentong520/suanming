import { BirthInput, computeCalendar } from "../calendar";

const HOROSCOPES = [
  { name: "白羊座", range: "3.21-4.19", element: "火", traits: "热情直率" },
  { name: "金牛座", range: "4.20-5.20", element: "土", traits: "稳重务实" },
  { name: "双子座", range: "5.21-6.21", element: "风", traits: "灵活多变" },
  { name: "巨蟹座", range: "6.22-7.22", element: "水", traits: "情感细腻" },
  { name: "狮子座", range: "7.23-8.22", element: "火", traits: "自信大方" },
  { name: "处女座", range: "8.23-9.22", element: "土", traits: "细致完美" },
  { name: "天秤座", range: "9.23-10.23", element: "风", traits: "公正和谐" },
  { name: "天蝎座", range: "10.24-11.22", element: "水", traits: "深沉专注" },
  { name: "射手座", range: "11.23-12.21", element: "火", traits: "自由乐观" },
  { name: "摩羯座", range: "12.22-1.19", element: "土", traits: "坚韧上进" },
  { name: "水瓶座", range: "1.20-2.18", element: "风", traits: "独立创新" },
  { name: "双鱼座", range: "2.19-3.20", element: "水", traits: "浪漫敏感" },
];

const FORTUNES = [
  "今日运势平稳，宜处理日常事务。",
  "贵人运较佳，可多与他人交流。",
  "财运普通，不宜大额投资。",
  "感情运不错，适合表达心意。",
  "工作运上升，可推进重要项目。",
];

export function computeHoroscope(input: BirthInput) {
  const cal = computeCalendar(input);
  const sign = HOROSCOPES.find((h) => h.name.includes(cal.constellation.replace("座", ""))) ??
    HOROSCOPES.find((h) => cal.constellation.includes(h.name.replace("座", ""))) ?? HOROSCOPES[0];

  const dayIndex = new Date().getDate() % FORTUNES.length;
  return {
    constellation: cal.constellation,
    sign: sign.name,
    element: sign.element,
    traits: sign.traits,
    range: sign.range,
    dailyFortune: FORTUNES[dayIndex],
    luckyColor: ["红", "蓝", "绿", "黄", "白"][dayIndex % 5],
    luckyNumber: (dayIndex + 1) * 3,
    summary: `${sign.name}今日：${FORTUNES[dayIndex]}`,
  };
}
