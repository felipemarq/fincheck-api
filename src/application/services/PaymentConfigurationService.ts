import { Acquisition } from "@application/entities/Acquisition";
import { BadRequestException } from "@application/errors/http/BadRequestException";
import { CreditCardRepository } from "@infra/database/neon/repositories/CreditCardRepository";
import { Injectable } from "@kernel/decorators/Injectable";

@Injectable()
export class PaymentConfigurationService {
  constructor(private readonly creditCardRepository: CreditCardRepository) {}

  async normalize(
    input: PaymentConfigurationService.Input
  ): Promise<PaymentConfigurationService.Output> {
    if (input.paymentMethod === Acquisition.PaymentMethod.CREDIT_CARD) {
      if (!input.creditCardId) {
        throw new BadRequestException(
          "Selecione o cartao utilizado na compra."
        );
      }

      if (!input.firstPaymentDueAt) {
        throw new BadRequestException(
          "Informe o vencimento da primeira parcela."
        );
      }

      const card = await this.creditCardRepository.findOne({
        entityId: input.entityId,
        creditCardId: input.creditCardId,
      });
      if (!card || !card.active) {
        throw new BadRequestException(
          "O cartao selecionado nao existe ou esta inativo."
        );
      }

      return {
        creditCardId: card.id,
        installmentCount: input.installmentCount ?? 1,
        firstPaymentDueAt: input.firstPaymentDueAt,
        paymentInstrument: card.safeLabel,
        paymentHolder: card.holderName,
      };
    }

    if (input.paymentMethod === Acquisition.PaymentMethod.BOLETO) {
      if (!input.firstPaymentDueAt) {
        throw new BadRequestException("Informe o vencimento do boleto.");
      }

      return {
        creditCardId: undefined,
        installmentCount: 1,
        firstPaymentDueAt: input.firstPaymentDueAt,
        paymentInstrument: input.paymentInstrument,
        paymentHolder: input.paymentHolder,
      };
    }

    return {
      creditCardId: undefined,
      installmentCount: 1,
      firstPaymentDueAt: undefined,
      paymentInstrument: input.paymentInstrument,
      paymentHolder: input.paymentHolder,
    };
  }
}

export namespace PaymentConfigurationService {
  export type Input = {
    entityId: string;
    paymentMethod: string;
    creditCardId?: string;
    installmentCount?: number;
    firstPaymentDueAt?: Date;
    paymentInstrument?: string;
    paymentHolder?: string;
  };

  export type Output = {
    creditCardId?: string;
    installmentCount: number;
    firstPaymentDueAt?: Date;
    paymentInstrument?: string;
    paymentHolder?: string;
  };
}
