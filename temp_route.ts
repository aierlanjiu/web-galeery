import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    isVIP: true,
    tier: "GOLD",
    message: "Authorized"
  });
}
