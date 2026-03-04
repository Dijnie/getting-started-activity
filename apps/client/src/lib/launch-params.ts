/** Query params khi Discord mở Activity (từ URL GET /?instance_id=...) */
export type DiscordLaunchParams = {
  instance_id: string | null;
  location_id: string | null;
  launch_id: string | null;
  referrer_id: string | null;
  custom_id: string | null;
  guild_id: string | null;
  channel_id: string | null;
  frame_id: string | null;
  platform: string | null;
};

const PARAM_KEYS: (keyof DiscordLaunchParams)[] = [
  "instance_id",
  "location_id",
  "launch_id",
  "referrer_id",
  "custom_id",
  "guild_id",
  "channel_id",
  "frame_id",
  "platform",
];

export function getLaunchParamsFromSearchParams(
  searchParams: URLSearchParams
): DiscordLaunchParams {
  const params = {} as DiscordLaunchParams;
  for (const key of PARAM_KEYS) {
    const value = searchParams.get(key);
    params[key] = value === "undefined" || value === "" ? null : value;
  }
  return params;
}
