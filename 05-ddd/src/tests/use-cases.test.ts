import { describe, it, expect, beforeEach } from "vitest";
import { CreateCampaignUseCase } from "../application/create-campaign.js";
import { ActivateCampaignUseCase } from "../application/activate-campaign.js";
import { RecordEventUseCase } from "../application/record-event.js";
import { InMemoryCampaignRepository } from "../infrastructure/in-memory-campaign-repository.js";
import { EventType } from "../domain/value-objects/event-type.js";

describe("Use Cases", () => {
  let repository: InMemoryCampaignRepository;
  let createCampaign: CreateCampaignUseCase;
  let activateCampaign: ActivateCampaignUseCase;
  let recordEvent: RecordEventUseCase;

  beforeEach(() => {
    repository = new InMemoryCampaignRepository();
    createCampaign = new CreateCampaignUseCase(repository);
    activateCampaign = new ActivateCampaignUseCase(repository);
    recordEvent = new RecordEventUseCase(repository);
  });

  describe("CreateCampaignUseCase", () => {
    it("should create a new campaign", async () => {
      const result = await createCampaign.execute({
        name: "Test Campaign",
        budgetAmount: 100000,
        budgetCurrency: "JPY",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-04-30"),
      });

      expect(result.name).toBe("Test Campaign");
      expect(result.status).toBe("draft");
      expect(result.campaignId).toBeDefined();
    });

    it("should persist the campaign", async () => {
      const result = await createCampaign.execute({
        name: "Persisted Campaign",
        budgetAmount: 50000,
        budgetCurrency: "JPY",
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-05-31"),
      });

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].getCampaign().id.toString()).toBe(result.campaignId);
    });
  });

  describe("ActivateCampaignUseCase", () => {
    it("should activate a draft campaign", async () => {
      const created = await createCampaign.execute({
        name: "To Activate",
        budgetAmount: 200000,
        budgetCurrency: "JPY",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-30"),
      });

      const result = await activateCampaign.execute({
        campaignId: created.campaignId,
      });

      expect(result.status).toBe("active");
    });

    it("should throw for non-existent campaign", async () => {
      await expect(
        activateCampaign.execute({ campaignId: "non-existent" })
      ).rejects.toThrow("Campaign not found");
    });
  });

  describe("RecordEventUseCase", () => {
    it("should record an event for active campaign", async () => {
      const created = await createCampaign.execute({
        name: "Event Campaign",
        budgetAmount: 300000,
        budgetCurrency: "JPY",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-31"),
      });

      await activateCampaign.execute({ campaignId: created.campaignId });

      const result = await recordEvent.execute({
        campaignId: created.campaignId,
        eventType: EventType.Click,
        metadata: { source: "google" },
      });

      expect(result.eventType).toBe("click");
      expect(result.campaignId).toBe(created.campaignId);
    });

    it("should throw when recording event for draft campaign", async () => {
      const created = await createCampaign.execute({
        name: "Draft Campaign",
        budgetAmount: 100000,
        budgetCurrency: "JPY",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-31"),
      });

      await expect(
        recordEvent.execute({
          campaignId: created.campaignId,
          eventType: EventType.Impression,
        })
      ).rejects.toThrow("Cannot record events");
    });
  });
});
