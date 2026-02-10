import { NextResponse } from "next/server";

export async function POST() {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({
    success: true,
    message: "Mock checkout successful",
    orderId: "MOCK-" + Math.random().toString(36).substr(2, 9).toUpperCase()
  });
}

export async function GET() {
    return NextResponse.json({
        message: "Mock checkout endpoint ready. Use POST to simulate a transaction."
    });
}
