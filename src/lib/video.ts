/**
 * Reading a video address the way an owner would type one.
 *
 * The clip on the dive page is filled in from the CMS, by somebody with a
 * phone and a link in their clipboard. That link is nearly always a YouTube
 * one — it is where the family's own diving footage already is, and uploading
 * a 200MB file into a repository is not a thing to ask of anybody. But it can
 * equally be a file dropped into `public/`, which is what a short clip
 * belongs in: no third party, no consent banner, no advertisement in front of
 * somebody's holiday.
 *
 * So the field takes either, and this is what tells them apart. Nothing is
 * validated beyond that: a typed address that is neither is played as a file,
 * fails, and the band removes itself, which is a better failure than a form
 * that refuses to save.
 */

/**
 * Every shape a YouTube link arrives in.
 *
 * Watch pages, the share link, an embed somebody copied out of an iframe, a
 * Short, and a live URL. The id itself is eleven characters of the URL-safe
 * alphabet, which is what makes this worth matching rather than guessing at:
 * a string that is not that is not an id, whatever the host said.
 */
const YOUTUBE = [
  /(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/shorts\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/live\/([A-Za-z0-9_-]{11})/,
];

/** The video id in a YouTube address, or null for anything else. */
export function youtubeId(url: string): string | null {
  const s = (url ?? "").trim();
  if (!s) return null;
  for (const re of YOUTUBE) {
    const m = re.exec(s);
    if (m) return m[1];
  }
  /* The id on its own, which is what somebody pasting from the address bar of
     a mobile app sometimes has. Only when it cannot be a path or a file: a
     name like `dive.mp4` is eight characters and has a dot in it, and even an
     eleven-character one would still be a file. */
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

/** The still YouTube serves for a video, at the largest size that always exists. */
export function youtubeThumb(id: string): string {
  /* `hqdefault` rather than `maxresdefault`: the high-resolution one is only
     generated for videos uploaded above a certain size, and asking for one
     that was never made returns a grey placeholder image rather than a 404 —
     so the failure is a grey box on the page rather than something we could
     catch and hide. */
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * The embed address, on the domain that does not set a cookie until play.
 *
 * `youtube-nocookie.com` is YouTube's own privacy-enhanced host. The iframe is
 * only ever created when the clip is about to play — pressed, or scrolled to
 * on a page that autoplays — so a guest who never reaches the dive section is
 * not handed to Google at all.
 *
 * `loop` needs `playlist` set to the same id and there is no way around it:
 * YouTube loops a playlist, not a video, so a single video has to be given to
 * it as a playlist of one. Without that, `loop=1` is accepted and ignored.
 *
 * `mute` is not a preference either. Every browser refuses to start a video
 * with sound in it that nobody asked for, and refuses it silently — the
 * player simply sits there. Muted is the price of starting by itself, and the
 * controls are left on so anyone who wants the sound can have it.
 */
export function youtubeEmbed(
  id: string,
  { loop = false, muted = false }: { loop?: boolean; muted?: boolean } = {},
): string {
  const q = new URLSearchParams({
    autoplay: "1",
    /* Related videos from this channel only, rather than whatever the
       algorithm has for a stranger. */
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (muted) q.set("mute", "1");
  if (loop) {
    q.set("loop", "1");
    q.set("playlist", id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${q}`;
}
