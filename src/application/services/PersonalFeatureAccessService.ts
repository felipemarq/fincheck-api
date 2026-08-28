import { PersonalFeature } from "@application/entities/PersonalFeature";
import { ForbiddenException } from "@application/errors/http/ForbiddenException";
import { UserFeatureRepository } from "@infra/database/neon/repositories/UserFeatureRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class PersonalFeatureAccessService {
  constructor(private readonly repository: UserFeatureRepository) {}

  async assertEnabled(userId: string, feature: PersonalFeature): Promise<void> {
    const isEnabled = await this.repository.hasFeature(userId, feature);

    if (!isEnabled) {
      throw new ForbiddenException("Recurso pessoal nao habilitado para este usuario.");
    }
  }
}
