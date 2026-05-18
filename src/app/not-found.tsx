import { PublicBoundary } from "@/components/shell/public-boundary";

export default function NotFound() {
  return (
    <PublicBoundary
      actions={[
        { href: "/", label: "Open homepage" },
        { href: "/?type=writing", label: "Open writing" },
      ]}
      message="The requested page is missing. Open the homepage or return to the reading surfaces."
      title="Page not found."
    />
  );
}
