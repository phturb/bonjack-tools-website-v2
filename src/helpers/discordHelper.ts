import { User } from "@auth0/auth0-react";

export const extractDiscordFromUser = (user: User | undefined) => {
  if (!user) {
    return { isDiscordUser: undefined, discordId: undefined };
  }
  const subInfo = user?.sub?.split("|");
  const isDiscordUser = subInfo?.includes("discord");

  let discordId;
  if (isDiscordUser && subInfo) {
    discordId = subInfo[2];
  }

  return { isDiscordUser, discordId };
}
