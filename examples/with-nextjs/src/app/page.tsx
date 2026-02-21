import dynamic from "next/dynamic";
import Script from "next/script";

// Since client components get prerenderd on server as well hence importing the excalidraw stuff dynamically
// with ssr false
const DyldrawApp = dynamic(
  async () => (await import("../components/DyldrawApp")).default,
  {
    ssr: false,
  },
);

export default function Page() {
  return (
    <>
      <Script id="load-env-variables" strategy="beforeInteractive">
        {`window["EXCALIDRAW_ASSET_PATH"] = window.origin;`}
      </Script>
      {/* @ts-expect-error - https://github.com/vercel/next.js/issues/42292 */}
      <DyldrawApp />
    </>
  );
}
