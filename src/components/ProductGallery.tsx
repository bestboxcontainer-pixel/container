import Image from "next/image";

export function ProductGallery({ image, alt }: { image: string; alt: string }) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-border bg-white">
      <Image
        src={image}
        alt={alt}
        fill
        priority
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="object-contain p-6"
      />
    </div>
  );
}
