import { isWhitelistedEmail } from "#/lib/edge-config";
import { conn } from "#/lib/planetscale";
import { ratelimit } from "#/lib/upstash";
import { LOCALHOST_IP } from "@dub/utils";
import { ipAddress } from "@vercel/edge";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    const ip = ipAddress(req) || LOCALHOST_IP;
    const { success } = await ratelimit(5, "1 m").limit(ip);
    if (!success) {
      return new Response("Don't DDoS me pls 🥺", { status: 429 });
    }

    const { email } = (await req.json()) as { email: string };

    if (!conn) {
      return new Response("Database connection not established", {
        status: 500,
      });
    }

    const user = await conn
      .execute("SELECT email FROM User WHERE email = ?", [email])
      .then((res) => res.rows[0]);

    if (user) {
      return new Response(JSON.stringify({ exists: true }));
    }

    const whitelisted = await isWhitelistedEmail(email);
    if (whitelisted) {
      return new Response(JSON.stringify({ exists: true }));
    }

    return new Response(JSON.stringify({ exists: false }));
  } else {
    return new Response("Method not allowed", {
      status: 405,
      statusText: "Method not allowed",
    });
  }
}
