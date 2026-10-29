// app/[locale]/tools/image-engine/page.tsx
import ImageConverterComponent from "@/app/components/image-converter/ImageConverterComponent";

export const metadata = {
  title: "Image Engine",
  description:
    "Privacy-focused, 100% client-side image converter, cropper, and bulk resizer.",
};

export default function ImageConverterPage() {
  return (
    <main className="py-8 px-4 sm:px-6">
      <ImageConverterComponent />
    </main>
  );
}
