import { describe, it, expect } from "vitest";
import { CampaignId } from "../domain/value-objects/campaign-id.js";
import { Money } from "../domain/value-objects/money.js";
import { DateRange } from "../domain/value-objects/date-range.js";
import { EventId } from "../domain/value-objects/event-id.js";
import { EventType, isValidEventType } from "../domain/value-objects/event-type.js";

describe("CampaignId", () => {
  it("should create from valid string", () => {
    const id = CampaignId.create("test-id");
    expect(id.toString()).toBe("test-id");
  });

  it("should throw on empty string", () => {
    expect(() => CampaignId.create("")).toThrow("CampaignId cannot be empty");
  });

  it("should generate unique ids", () => {
    const id1 = CampaignId.generate();
    const id2 = CampaignId.generate();
    expect(id1.equals(id2)).toBe(false);
  });

  it("should compare equality correctly", () => {
    const id1 = CampaignId.create("same-id");
    const id2 = CampaignId.create("same-id");
    expect(id1.equals(id2)).toBe(true);
  });
});

describe("Money", () => {
  it("should create JPY amount", () => {
    const money = Money.create(1000, "JPY");
    expect(money.getAmount()).toBe(1000);
    expect(money.getCurrency()).toBe("JPY");
  });

  it("should create USD amount with decimals", () => {
    const money = Money.create(99.99, "USD");
    expect(money.getAmount()).toBe(99.99);
    expect(money.getCurrency()).toBe("USD");
  });

  it("should throw on negative amount", () => {
    expect(() => Money.create(-100, "JPY")).toThrow("cannot be negative");
  });

  it("should add same currency", () => {
    const a = Money.create(100, "USD");
    const b = Money.create(50, "USD");
    const result = a.add(b);
    expect(result.getAmount()).toBe(150);
  });

  it("should throw when adding different currencies", () => {
    const jpy = Money.create(1000, "JPY");
    const usd = Money.create(10, "USD");
    expect(() => jpy.add(usd)).toThrow("Cannot add different currencies");
  });

  it("should compare amounts", () => {
    const a = Money.create(200, "JPY");
    const b = Money.create(100, "JPY");
    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isGreaterThan(a)).toBe(false);
  });
});

describe("DateRange", () => {
  it("should create valid range", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-03-31");
    const range = DateRange.create(start, end);
    expect(range.getDurationInDays()).toBe(89);
  });

  it("should throw when start > end", () => {
    const start = new Date("2025-12-31");
    const end = new Date("2025-01-01");
    expect(() => DateRange.create(start, end)).toThrow(
      "Start date must be before"
    );
  });

  it("should check containment", () => {
    const range = DateRange.create(
      new Date("2025-01-01"),
      new Date("2025-03-31")
    );
    expect(range.contains(new Date("2025-02-15"))).toBe(true);
    expect(range.contains(new Date("2025-06-01"))).toBe(false);
  });

  it("should detect overlap", () => {
    const range1 = DateRange.create(
      new Date("2025-01-01"),
      new Date("2025-03-31")
    );
    const range2 = DateRange.create(
      new Date("2025-03-01"),
      new Date("2025-06-30")
    );
    expect(range1.overlaps(range2)).toBe(true);
  });
});

describe("EventId", () => {
  it("should generate unique ids", () => {
    const id1 = EventId.generate();
    const id2 = EventId.generate();
    expect(id1.equals(id2)).toBe(false);
  });
});

describe("EventType", () => {
  it("should validate known types", () => {
    expect(isValidEventType("click")).toBe(true);
    expect(isValidEventType("impression")).toBe(true);
    expect(isValidEventType("conversion")).toBe(true);
  });

  it("should reject unknown types", () => {
    expect(isValidEventType("unknown")).toBe(false);
  });
});
