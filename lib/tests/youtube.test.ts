import { toYouTubeEmbedUrl, getYouTubeThumbnail } from "../youtube";

describe("toYouTubeEmbedUrl", () => {
  it("konvertiert watch-URL", () => {
    expect(
      toYouTubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("konvertiert youtu.be-URL", () => {
    expect(toYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("lässt embed-URL unverändert", () => {
    expect(toYouTubeEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("gibt null zurück bei ungültiger URL", () => {
    expect(toYouTubeEmbedUrl("https://vimeo.com/123")).toBeNull();
    expect(toYouTubeEmbedUrl("")).toBeNull();
  });
});

describe("getYouTubeThumbnail", () => {
  it("gibt Thumbnail-URL zurück", () => {
    expect(
      getYouTubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("gibt null zurück bei ungültiger URL", () => {
    expect(getYouTubeThumbnail("https://vimeo.com/123")).toBeNull();
  });
});
