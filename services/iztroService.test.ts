import { describe, expect, it } from "vitest";
import { ChildLimit, Gender, SolarTime } from "tyme4ts";
import type { UserInput } from "../types";
import { calculateAstrolabe, calculateTimeIndex, getChineseTimeLabel } from "./iztroService";

const buildInput = (overrides: Partial<UserInput> = {}): UserInput => ({
  calendarType: "solar",
  solarDate: "1990-01-01",
  lunarYear: 1990,
  lunarMonth: 1,
  lunarDay: 1,
  isLeapMonth: false,
  birthHour: 12,
  birthMinute: 0,
  longitude: 120,
  latitude: 30,
  gender: "male",
  ...overrides,
});

const pad2 = (value: number) => value.toString().padStart(2, "0");

const getExpectedStart = (input: UserInput) => {
  const [year, month, day] = input.solarDate.split("-").map(Number);
  const offsetMinutes = (input.longitude - 120) * 4;
  const trueSolarDate = new Date(year, month - 1, day, input.birthHour, input.birthMinute);
  trueSolarDate.setMinutes(trueSolarDate.getMinutes() + offsetMinutes);

  const solarTime = SolarTime.fromYmdHms(
    trueSolarDate.getFullYear(),
    trueSolarDate.getMonth() + 1,
    trueSolarDate.getDate(),
    trueSolarDate.getHours(),
    trueSolarDate.getMinutes(),
    trueSolarDate.getSeconds()
  );
  const gender = input.gender === "male" ? Gender.MAN : Gender.WOMAN;
  const childLimit = ChildLimit.fromSolarTime(solarTime, gender);
  const startAge = childLimit.getStartDecadeFortune().getStartAge();
  const startTime = childLimit.getEndTime();
  const startDate = `${startTime.getYear()}-${pad2(startTime.getMonth())}-${pad2(startTime.getDay())}`;

  return { startAge, startDate };
};

describe("calculateTimeIndex", () => {
  it("accounts for longitude-based true solar time", () => {
    expect(calculateTimeIndex(12, 0, 120)).toBe(6);
    expect(calculateTimeIndex(0, 0, 0)).toBe(8);
  });
});

describe("getChineseTimeLabel", () => {
  it("maps time index to a readable label", () => {
    expect(getChineseTimeLabel(0)).toBe("子 (Zi)");
    expect(getChineseTimeLabel(6)).toBe("午 (Wu)");
  });
});

describe("calculateAstrolabe", () => {
  it("uses tyme4ts child limit for start fortune info", () => {
    const input = buildInput();
    const expected = getExpectedStart(input);
    const result = calculateAstrolabe(input);

    expect(result.bazi).toBeTruthy();
    expect(result.bazi?.startYunAge).toBe(expected.startAge);
    expect(result.bazi?.startYunDate).toBe(expected.startDate);
    expect(result.bazi?.daYun.length).toBeGreaterThan(0);
    expect(result.bazi?.daYun[0].startAge).toBe(expected.startAge);
  });
});
