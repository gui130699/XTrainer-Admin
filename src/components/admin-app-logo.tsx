import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION ?? "local";

export function AdminAppLogo({ size = 44 }: { size?: number }) {
  return <span className="app-logo">
    <Image
      className="app-logo-icon"
      src={`${basePath}/xtrainer-admin-icon-192.png?v=${buildVersion}`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority
      unoptimized
    />
    <span className="app-logo-wordmark"><span className="app-logo-x">X</span><span className="app-logo-name">TRAINER</span><b>ADMIN</b></span>
  </span>;
}
