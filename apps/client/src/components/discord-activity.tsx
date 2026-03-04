"use client";

import { useEffect, useState } from "react";
import { getDiscordSdk } from "@/lib/discord";
import type { CommandResponse } from "@discord/embedded-app-sdk";

type AuthResponse = CommandResponse<"authenticate">;

export function DiscordActivity() {
  const [status, setStatus] = useState("Initializing...");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  useEffect(() => {
    async function setup() {
      try {
        const discordSdk = getDiscordSdk();
        console.log(`Client ID: ${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}`);
        console.log("SDK created, calling ready()...");
        await discordSdk.ready();
        console.log("SDK ready!");
        setStatus("Authorizing...");
        
        const { code } = await discordSdk.commands.authorize({
          client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds"],
        });
        console.log(`Authorized, got code: ${code}`);
        setStatus("Exchanging token...");

        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: `https://${window.location.host}`,
          }),
        });
        const data = await response.json();
        console.log(
          `Token response: ${response}`
        );

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response}`);
        }
        setStatus("Authenticating...");

        const authResult = await discordSdk.commands.authenticate({
          access_token: data.access_token,
        });
        if (!authResult) {
          throw new Error("Authenticate command failed");
        }
        setAuth(authResult);
        setStatus(JSON.stringify(authResult.user));
        console.log(authResult);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null
              ? JSON.stringify(err)
              : String(err);
        console.log(`ERROR: ${message}`);
        setStatus(message);
      }
    }
    setup();
  }, []);

  return (
    <div>
      <h1>Welcome, {auth?.user?.global_name || auth?.user?.username}!</h1>
      <pre>{JSON.stringify(auth, null, 2)}</pre>
    </div>
  );
}
  