"use client";

import { useEffect, useState } from "react";
import { getDiscordSdk } from "@/lib/discord";

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  discriminator: string;
}

type Status =
  | { phase: "loading"; message: string }
  | { phase: "authenticated"; user: DiscordUser }
  | { phase: "error"; message: string };

export function DiscordActivity() {
  const [status, setStatus] = useState<Status>({
    phase: "loading",
    message: "Initializing...",
  });
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    setDebugLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    async function setup() {
      try {
        const discordSdk = getDiscordSdk();
        log(`Client ID: ${process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID}`);
        log("SDK created, calling ready()...");

        await discordSdk.ready();
        log("SDK ready!");

        setStatus({ phase: "loading", message: "Authorizing..." });

        const { code } = await discordSdk.commands.authorize({
          client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds"],
        });
        log(`Authorized, got code: ${code.slice(0, 8)}...`);

        setStatus({ phase: "loading", message: "Exchanging token..." });

        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: `https://${window.location.host}`,
          }),
        });
        const data = await response.json();
        log(
          `Token response: ${response.status}, has token: ${!!data.access_token}`
        );

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.status}`);
        }

        setStatus({ phase: "loading", message: "Authenticating..." });

        const auth = await discordSdk.commands.authenticate({
          access_token: data.access_token,
        });

        if (!auth) {
          throw new Error("Authenticate command failed");
        }
        log("Authenticated!");

        setStatus({ phase: "authenticated", user: auth.user as DiscordUser });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log(`ERROR: ${message}`);
        setStatus({ phase: "error", message });
      }
    }

    setup();
  }, []);

  if (status.phase === "error") {
    return (
      <div>
        <h1>Error</h1>
        <p>{status.message}</p>
        <DebugPanel logs={debugLogs} />
      </div>
    );
  }

  if (status.phase === "loading") {
    return (
      <div>
        <h1>{status.message}</h1>
        <DebugPanel logs={debugLogs} />
      </div>
    );
  }

  const { user } = status;
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarUrl} className="logo" alt="Avatar" />
      <h1>Welcome, {user.username}!</h1>
      <div className="user-info">
        <p>
          <strong>Display Name:</strong> {user.global_name || user.username}
        </p>
        <p>
          <strong>User ID:</strong> {user.id}
        </p>
        {user.discriminator !== "0" && (
          <p>
            <strong>Tag:</strong> {user.username}#{user.discriminator}
          </p>
        )}
      </div>
    </div>
  );
}

function DebugPanel({ logs }: { logs: string[] }) {
  if (logs.length === 0) return null;
  return (
    <div className="debug">
      {logs.map((msg, i) => (
        <p key={i}>{msg}</p>
      ))}
    </div>
  );
}
