"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getLaunchParamsFromSearchParams,
  type DiscordLaunchParams,
} from "@/lib/launch-params";

export function useLaunchParams() {
  const searchParams = useSearchParams();
  const [launchParams, setLaunchParams] = useState<DiscordLaunchParams | null>(
    null
  );

  useEffect(() => {
    setLaunchParams(getLaunchParamsFromSearchParams(searchParams));
  }, [searchParams]);

  return launchParams;
}
