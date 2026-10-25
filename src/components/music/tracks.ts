import type { Track } from "./queue"

const sc = (slug: string, title: string, artist = "Colorpulse"): Track => ({ id: `sc-${slug}`, title, artist, platform: "soundcloud", ref: `https://soundcloud.com/colorpulse/${slug}` })
const sp = (id: string, title: string): Track => ({ id: `sp-${id}`, title, artist: "Alex's Hand", platform: "spotify", ref: `spotify:track:${id}` })

// SoundCloud: the public uploads on soundcloud.com/colorpulse (full tracks).
// Spotify: Alex's Hand top tracks (30 second previews unless the listener is signed in to Spotify).
export const SOUNDCLOUD_TRACKS: Track[] = [
  sc("space-terror-adamaudio-steelworker", "Space Terror"),
  sc("project-cynapse", "Project Cynapse"),
  sc("at-the-pony-palace", "At The Pony Palace"),
  sc("cerebrorchestral-1", "Cerebrorchestral"),
  sc("nwcz-radio-sesh-edit", "NWCZ Radio Sesh Edit"),
  sc("priaprizm-im-inflamed", "I'm Inflamed", "Priaprizm"),
  sc("priaprizm-the-chrono-coup", "The Chrono Coup d'Etat", "Priaprizm"),
  sc("recepton-nov-31st", "Recepton Nov. 31st"),
  sc("4-filthy-flowers", "Filthy Flowers"),
  sc("3-7bits", "7Bits"),
  sc("1-amid-the-light", "Amid the Light"),
  sc("liquid-egyptian-1st", "Liquid Egyptian 1st"),
  sc("alexs-hand-robot", "Robot", "Alex's Hand"),
]
export const SPOTIFY_TRACKS: Track[] = [
  sp("4Cb53E58hg3CywvF0CIxxv", "Mars Travolta"),
  sp("2gK5BS3LUUeMUCqxWdR503", "Stalker"),
  sp("3RAxk2vyhOTt9ulqAZxK23", "Try"),
  sp("5E4Yy7lP0LziIeee2KRROT", "Trained"),
  sp("1QZ7Ko90OoKYgjCvAOXpWp", "All Those Nights"),
  sp("5Z581lNmEwpPC18Th6kkSS", "You're a Little Freak"),
  sp("4QoJFhS0KYdM5e6MsFX4Dc", "Slave"),
  sp("08i8HWDFDIDUCeOp7OPx8Z", "Habibs"),
  sp("4404l8P4JxbaFklaxGcH7J", "Evans Lips"),
  sp("4XCrfutmhSFxkfE8dE0DOu", "Back to Evan"),
]

export const TRACKS: Track[] = [...SOUNDCLOUD_TRACKS, ...SPOTIFY_TRACKS]
