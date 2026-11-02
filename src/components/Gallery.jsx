/**
 * Gallery (component) – renders a grid of images for a single hall group
 * with a lightbox on click.
 *
 * Props:
 *   group – { hall_id, hall_name, block, cover_image, images: [{id, image_url, caption}] }
 */

import { useState } from "react";

function LightBox({ url, caption, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <img
                src={url}
                alt={caption || "Hall image"}
                className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
            {caption && (
                <p className="mt-3 text-sm text-white/70" onClick={(e) => e.stopPropagation()}>
                    {caption}
                </p>
            )}
            <button
                className="mt-4 rounded-full border border-white/30 px-4 py-1 text-sm text-white/80 hover:bg-white/10"
                onClick={onClose}
            >
                Close
            </button>
        </div>
    );
}

export default function GalleryGroup({ group }) {
    const [active, setActive] = useState(null); // { url, caption }

    // Build the full list: cover image first, then the rest
    const allImages = [
        { image_url: group.cover_image, caption: `${group.hall_name} – Cover` },
        ...group.images,
    ].filter((img) => img.image_url);

    return (
        <section className="space-y-3">
            {/* Section heading */}
            <h3 className="text-xl font-semibold text-[#c9a227]">
                {group.block} &nbsp;·&nbsp; {group.hall_name}
            </h3>

            {/* Image grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allImages.map((img, i) => (
                    <button
                        key={`${group.hall_id}-${i}`}
                        className="group overflow-hidden rounded-xl border border-[#c9a227]/15 focus:outline-none focus:ring-2 focus:ring-[#c9a227]"
                        onClick={() => setActive({ url: img.image_url, caption: img.caption })}
                    >
                        <img
                            src={img.image_url}
                            alt={img.caption || group.hall_name}
                            loading="lazy"
                            className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {img.caption && (
                            <div className="bg-[#06201c]/80 px-3 py-1.5 text-left text-xs text-[#f6f3ea]/70">
                                {img.caption}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Lightbox */}
            {active && (
                <LightBox url={active.url} caption={active.caption} onClose={() => setActive(null)} />
            )}
        </section>
    );
}
