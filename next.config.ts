import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Set workspace root to silence warning about multiple lockfiles
  outputFileTracingRoot: path.join(__dirname),

  // Webpack config to silence MongoDB optional dependencies warnings
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Silence warnings for MongoDB optional dependencies
      config.resolve.fallback = {
        ...config.resolve.fallback,
        kerberos: false,
        "@mongodb-js/zstd": false,
        "@aws-sdk/credential-providers": false,
        "gcp-metadata": false,
        snappy: false,
        aws4: false,
        "mongodb-client-encryption": false,
      };
    }

    // Ignore Edge Runtime warnings for MongoDB (it's only used in Node.js runtime routes)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/mongodb/,
        message: /Edge Runtime/,
      },
      {
        module: /node_modules\/socks/,
        message: /Edge Runtime/,
      },
    ];

    return config;
  },

  // Security Headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: [
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev", // allow Clerk loader
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.stripe.com https://api.openai.com",
              "frame-src 'self' https://*.stripe.com https://*.clerk.accounts.dev",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // X-Frame-Options: Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // X-Content-Type-Options: Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer-Policy: Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions-Policy: Control browser features
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()",
              "interest-cohort=()",
            ].join(", "),
          },
          // X-XSS-Protection: Legacy XSS protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Strict-Transport-Security: Force HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
