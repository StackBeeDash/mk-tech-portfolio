import { describe, it, expect } from "vitest";
import { CampaignAggregate } from "../domain/aggregates/campaign-aggregate.js";
import { Money } from "../domain/value-objects/money.js";
import { DateRange } from "../domain/value-objects/date-range.js";
import { EventType } from "../domain/value-objects/event-type.js";

function createTestAggregate() {
  return CampaignAggregate.create({
    name: "Summer Sale 2025",
    budget: Money.create(500000, "JPY"),
    dateRange: DateRange.create(
      new Date("2025-07-01"),
      new Date("2025-08-31")
    ),
  });
}

describe("CampaignAggregate", () => {
  it("should create a campaign in draft status", () => {
    const aggregate = createTestAggregate();
    const campaign = aggregate.getCampaign();

    expect(campaign.name).toBe("Summer Sale 2025");
    expect(campaign.status).toBe("draft");
    expect(campaign.budget.getAmount()).toBe(500000);
  });

  it("should emit CampaignCreated domain event on creation", () => {
    const aggregate = createTestAggregate();
    const events = aggregate.getDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("CampaignCreated");
  });

  it("should activate a draft campaign", () => {
    const aggregate = createTestAggregate();
    aggregate.activate();

    expect(aggregate.getCampaign().status).toBe("active");
    const events = aggregate.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe("CampaignActivated");
  });

  it("should not activate a non-draft campaign", () => {
    const aggregate = createTestAggregate();
    aggregate.activate();

    expect(() => aggregate.activate()).toThrow("Cannot activate campaign");
  });

  it("should record events for active campaign", () => {
    const aggregate = createTestAggregate();
    aggregate.activate();

    const event = aggregate.recordEvent(EventType.Click, {
      page: "/landing",
    });

    expect(event.eventType).toBe("click");
    expect(event.metadata).toEqual({ page: "/landing" });
    expect(aggregate.countEvents()).toBe(1);
    expect(aggregate.countEvents(EventType.Click)).toBe(1);
  });

  it("should not record events for draft campaign", () => {
    const aggregate = createTestAggregate();

    expect(() => aggregate.recordEvent(EventType.Click)).toThrow(
      "Cannot record events"
    );
  });

  it("should complete an active campaign", () => {
    const aggregate = createTestAggregate();
    aggregate.activate();
    aggregate.complete();

    expect(aggregate.getCampaign().status).toBe("completed");
  });

  it("should clear domain events", () => {
    const aggregate = createTestAggregate();
    expect(aggregate.getDomainEvents()).toHaveLength(1);

    aggregate.clearDomainEvents();
    expect(aggregate.getDomainEvents()).toHaveLength(0);
  });

  it("should track multiple event types", () => {
    const aggregate = createTestAggregate();
    aggregate.activate();

    aggregate.recordEvent(EventType.Impression);
    aggregate.recordEvent(EventType.Impression);
    aggregate.recordEvent(EventType.Click);
    aggregate.recordEvent(EventType.Conversion);

    expect(aggregate.countEvents()).toBe(4);
    expect(aggregate.countEvents(EventType.Impression)).toBe(2);
    expect(aggregate.countEvents(EventType.Click)).toBe(1);
    expect(aggregate.countEvents(EventType.Conversion)).toBe(1);
  });
});
