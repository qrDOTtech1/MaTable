/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL || "http://localhost:3001",
  },
};
