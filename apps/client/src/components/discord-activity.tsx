"use client";

import { useEffect } from "react";
import { useDiscordAuth } from "@/hooks/use-discord-auth";
import { useLaunchParams } from "@/hooks/use-launch-params";

export function DiscordActivity() {
  const { auth, status, init } = useDiscordAuth();
  const launchParams = useLaunchParams();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div>
      <h1>{status}</h1>
      {launchParams && (
        <section>
          <h2>Launch params (từ URL)</h2>
          <pre>{JSON.stringify(launchParams, null, 2)}</pre>
        </section>
      )}
      <pre>{JSON.stringify(auth, null, 2)}</pre>
    </div>
  );
}
