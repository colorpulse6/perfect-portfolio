export type Platform = "soundcloud" | "spotify"
export interface Track {
  id: string
  title: string
  artist: string
  platform: Platform
  /** SoundCloud permalink or Spotify track URI. */
  ref: string
}

interface Options {
  rng?: () => number
  shuffle?: boolean
}

/**
 * One queue across every platform. Shuffle deals a round: each track once, in random
 * order, then a new round whose first track differs from the last one played. History
 * lets previous and next walk back and forward through what already played.
 */
export function createQueue(initial: Track[], { rng = Math.random, shuffle = true }: Options = {}) {
  let tracks = initial
  let shuffled = shuffle
  const history: Track[] = []
  let cursor = -1
  let round: Track[] = []

  function deal(exclude?: Track) {
    const bag = tracks.filter(track => track !== exclude)
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]] }
    return bag
  }
  function draw(): Track {
    const last = history[history.length - 1]
    if (!shuffled) return tracks[(last ? tracks.indexOf(last) + 1 : 0) % tracks.length]
    if (!round.length) {
      round = deal()
      // a new round never opens with the track that just played
      if (round.length > 1 && round[round.length - 1] === last) [round[0], round[round.length - 1]] = [round[round.length - 1], round[0]]
    }
    return round.pop()!
  }
  function push(track: Track) { history.push(track); cursor = history.length - 1; return track }

  return {
    get current(): Track | null { return history[cursor] ?? null },
    get shuffle() { return shuffled },
    /** Begin with a chosen track (the rest of the round skips it) or with the first draw. */
    start(id?: string) {
      history.length = 0; cursor = -1; round = []
      const chosen = id ? tracks.find(track => track.id === id) : undefined
      if (chosen) { round = shuffled ? deal(chosen) : []; return push(chosen) }
      return push(draw())
    },
    next() {
      if (cursor < history.length - 1) return history[++cursor]
      return push(draw())
    },
    prev() {
      if (cursor > 0) cursor--
      return history[cursor] ?? push(draw())
    },
    setShuffle(on: boolean) {
      if (on === shuffled) return
      shuffled = on
      round = []
    },
    /** Change which tracks are in play (a platform joins): what is playing continues, the next round deals the new pool. */
    setTracks(next: Track[]) {
      tracks = next
      round = shuffled ? deal(history[cursor]) : []
    },
    get tracks() { return tracks },
  }
}
