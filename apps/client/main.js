import "./style.css";
import { DiscordSDK } from "@discord/embedded-app-sdk";

// Debug log on screen (Discord Activity can't open DevTools)
const log = (msg) => {
  const el = document.getElementById("debug");
  if (el) el.innerHTML += `<p>${msg}</p>`;
};

document.querySelector("#app").innerHTML = `
  <div>
    <h1>Loading...</h1>
    <div id="debug" style="text-align:left; font-size:12px; color:#aaa; margin-top:20px; padding:10px;"></div>
  </div>
`;

log(`Client ID: ${import.meta.env.VITE_DISCORD_CLIENT_ID}`);

const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

log("SDK created, calling ready()...");

setupDiscordSdk().catch((err) => {
  log(`ERROR: ${err.message}`);
  document.querySelector("h1").textContent = "Error";
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  log("SDK ready!");

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds"],
  });
  log(`Authorized, got code: ${code.slice(0, 8)}...`);

  const response = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirect_uri: `https://${location.host}`,
    }),
  });
  const data = await response.json();
  log(`Token response: ${response.status}, has token: ${!!data.access_token}`);

  const auth = await discordSdk.commands.authenticate({
    access_token: data.access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
  log("Authenticated!");

  // Display user info
  const { user } = auth;
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`;

  document.querySelector("#app").innerHTML = `
    <div>
      <img src="${avatarUrl}" class="logo" alt="Avatar" />
      <h1>Welcome, ${user.username}!</h1>
      <div class="user-info">
        <p><strong>Display Name:</strong> ${user.global_name || user.username}</p>
        <p><strong>User ID:</strong> ${user.id}</p>
        ${user.discriminator !== "0" ? `<p><strong>Tag:</strong> ${user.username}#${user.discriminator}</p>` : ""}
      </div>
    </div>
  `;
}
