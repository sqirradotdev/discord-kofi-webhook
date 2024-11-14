type WebhookMessage = {
  username?: string;
  avatar_url?: string;
  attachments?: string[];
  content?: string;
  embeds?: Embed[];
};

type Embed = {
  title?: string;
  description?: string;
  color: number;
};

export default {
  async fetch(request, env): Promise<Response> {
    const baseWebhookMessage: WebhookMessage = {
      username: env.DISCORD_WEBHOOK_DISPLAY_NAME ?? "Ko-fi Bot",
      avatar_url: env.DISCORD_WEBHOOK_AVATAR_URL ?? "https://storage.ko-fi.com/cdn/useruploads/26713482-7aa8-48f3-9269-f50e74292477_d33a0b94-982a-4a4e-ac2e-dd6f28ae47ce.png",
      attachments: [],
      content: "",
      embeds: [],
    };

    const baseEmbed: Embed = {
      title: "",
      description: "",
      color: 0x72a5f2,
    };

    switch (request.method) {
      case "POST": {
        // This is ridiculous... Ko-fi sends out the JSON payload with a form encoded payload.
        // The actual JSON is inside the data paramater. Why???
        const formBody = await request.formData();
        const bodyValue = (formBody.get("data") as string) ?? "";
        const body = JSON.parse(bodyValue);

        if (body["verification_token"] !== env.KOFI_VERIFICATION_TOKEN) {
          throw new Error("Wrong verification token");
        }

        const kofiEmbed = { ...baseEmbed };
        const webhookMessage: WebhookMessage = {
          ...baseWebhookMessage,
          embeds: [kofiEmbed],
        };

        if (body["is_subscription_payment"] === true) {
          const baseTitle = body["is_first_subscription_payment"] === true ? "New first subscription payment" : "New subscription payment";
          kofiEmbed.title = `${baseTitle} from **${body["from_name"]}** (${body["tier_name"]})`;
        } else {
          kofiEmbed.title = `New donation from **${body["from_name"]}**`;
        }

        kofiEmbed.description = `Donated **${body["amount"]} ${body["currency"]}**\n${body["message"]}`;

        const webhookResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookMessage),
        });

        console.log(await webhookResponse.text());

        return new Response(JSON.stringify(body));
      }
      default:
        break;
    }

    return new Response(null, {
      status: 404,
    });
  },
} satisfies ExportedHandler<Env>;