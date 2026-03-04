import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk: DiscordSDK | null = null;

export function getDiscordSdk(): DiscordSDK {
  if (!discordSdk) {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error("NEXT_PUBLIC_DISCORD_CLIENT_ID is not set");
    }
    discordSdk = new DiscordSDK(clientId);
  }
  return discordSdk;
}
