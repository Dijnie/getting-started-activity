import { create } from "zustand";
import { getDiscordSdk } from "@/lib/discord";
import type { CommandResponse } from "@discord/embedded-app-sdk";

type AuthResponse = CommandResponse<"authenticate">;

const TOKEN_KEY = "discord_access_token";

interface DiscordAuthState {
  status: string;
  auth: AuthResponse | null;
  init: () => Promise<void>;
}

export const useDiscordAuth = create<DiscordAuthState>((set, get) => ({
  status: "Initializing...",
  auth: null,

  async init() {
    // Prevent duplicate init
    if (get().auth || get().status === "Authenticating...") return;

    try {
      const discordSdk = getDiscordSdk();
      await discordSdk.ready();
      set({ status: "Authenticating..." });

      // Try cached token first
      const cachedToken = localStorage.getItem(TOKEN_KEY);
      if (cachedToken) {
        try {
          const result = await discordSdk.commands.authenticate({
            access_token: cachedToken,
          });
          if (!result) throw new Error("Authenticate command failed");
          set({ auth: result, status: "ready" });
          return;
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }

      // Full flow: authorize → exchange → authenticate
      set({ status: "Authorizing..." });
      const { code } = await discordSdk.commands.authorize({
        client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds"],
      });

      set({ status: "Exchanging token..." });
      const response = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirect_uri: `https://${window.location.host}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      localStorage.setItem(TOKEN_KEY, data.access_token);

      const result = await discordSdk.commands.authenticate({
        access_token: data.access_token,
      });
      if (!result) throw new Error("Authenticate command failed");
      set({ auth: result, status: "ready" });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null
            ? JSON.stringify(err)
            : String(err);
      console.log(`ERROR: ${message}`);
      set({ status: message });
    }
  },
}));
