import ForgotPassword from "@infra/emails/templates/auth/forgotPassword";
import { render } from "@react-email/render";
import { CustomMessageTriggerEvent } from "aws-lambda";

export async function handler(event: CustomMessageTriggerEvent) {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  if (event.triggerSource === "CustomMessage_ForgotPassword") {
    const confirmationCode = event.request.codeParameter;
    const email = event.request.userAttributes?.email;

    console.log("Código de confirmação:", confirmationCode);
    console.log("E-mail de destino:", email);

    const html = await render(ForgotPassword({ confirmationCode }));
    console.log("HTML gerado para o e-mail:", html);

    event.response.emailSubject = "💰 Moneystack✅ | Recupere a sua conta!";
    event.response.emailMessage = html;
  }

  return event;
}
