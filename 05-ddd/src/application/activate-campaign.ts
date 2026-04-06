/**
 * ActivateCampaign ユースケース
 *
 * Draft 状態のキャンペーンを Active に遷移させる。
 */
import { CampaignRepository } from "../domain/repositories/campaign-repository.js";
import { CampaignId } from "../domain/value-objects/campaign-id.js";

export interface ActivateCampaignInput {
  campaignId: string;
}

export interface ActivateCampaignOutput {
  campaignId: string;
  status: string;
}

export class ActivateCampaignUseCase {
  constructor(private readonly repository: CampaignRepository) {}

  async execute(input: ActivateCampaignInput): Promise<ActivateCampaignOutput> {
    const campaignId = CampaignId.create(input.campaignId);
    const aggregate = await this.repository.findById(campaignId);

    if (!aggregate) {
      throw new Error(`Campaign not found: ${input.campaignId}`);
    }

    aggregate.activate();
    await this.repository.save(aggregate);

    return {
      campaignId: aggregate.getCampaign().id.toString(),
      status: aggregate.getCampaign().status,
    };
  }
}
