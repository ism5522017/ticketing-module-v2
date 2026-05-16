import type { NextConfig } from "next";

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Tenant + DR + manager flows accept up to 5 attachments × 10 MB each.
      // Default cap is 1 MB which would silently reject uploads on Vercel.
      bodySizeLimit: "60mb",
    },
  },
  images: SUPABASE_HOST
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: SUPABASE_HOST,
            pathname: "/storage/v1/object/**",
          },
        ],
      }
    : undefined,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
