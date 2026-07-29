import { NextResponse } from "next/server";

export async function GET() {
  const discordUrl = process.env.DISCORD_INVITE_URL || "https://discord.com";
  return NextResponse.redirect(discordUrl);
}
