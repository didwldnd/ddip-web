import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // S3 이미지 버킷 (cloud.aws.s3.bucket=ddip-image, region=ap-northeast-2)
      {
        protocol: 'https',
        hostname: 'ddip-image.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
