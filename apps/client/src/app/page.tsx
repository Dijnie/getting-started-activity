import { Suspense } from "react";
import { DiscordActivity } from "@/components/discord-activity";

export default function Home() {
  return (
    <div className="app">
      <Suspense fallback={<div>Loading...</div>}>
        <DiscordActivity />
      </Suspense>
    </div>
  );
}
