import { Payable } from "@application/entities/Payable";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { NotFoundException } from "@application/errors/http/NotFoundException";
import { OrganizationAccessService } from "@application/services/OrganizationAccessService";
import { PayableRepository } from "@infra/database/neon/repositories/PayableRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class UpdatePayableUseCase {
  constructor(
    private readonly repository: PayableRepository,
    private readonly organizationAccessService: OrganizationAccessService
  ) {}

  async execute(input: UpdatePayableUseCase.Input): Promise<Payable> {
    await this.organizationAccessService.assertUserAccess(input.entityId, input.userId);
    const current = await this.repository.findOne(input);
    if (!current) throw new NotFoundException("Conta a pagar nao encontrada.");
    if (current.status === Payable.Status.CANCELLED) {
      throw new BadRequestException("Uma conta cancelada nao pode ser reaberta.");
    }

    return this.repository.updateStatus(
      new Payable({
        ...current,
        updatedByUserId: input.userId,
        status: input.status,
        paidAt:
          input.status === Payable.Status.PAID
            ? input.paidAt ?? current.paidAt ?? new Date()
            : undefined,
      })
    );
  }
}

export namespace UpdatePayableUseCase {
  export type Input = {
    entityId: string;
    userId: string;
    payableId: string;
    status: Payable.Status.OPEN | Payable.Status.PAID;
    paidAt?: Date;
  };
}
