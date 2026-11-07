---
title: "Somewhere You Can Actually Go"
date: "2026-11-07"
issue: 16
week: "2026-W44"
deck: "Chimera opens its first public demo, Sector Zero earns a way home, and the small journeys through Job Toast and my portfolio get more dependable."
hero: ""
---

*Delayed publication of the 2026-W44 working-week draft, published 2026-11-07. Progress and remaining checks below describe that week, not new claims as of publication.*

A road in a game makes a promise before anybody writes dialogue.

There is something over there, it says, and you can go to it. Which is quite a lot to promise. The mountain might be scenery, the gate might be locked, the road might belong to a version of the world that only exists when its maker starts the application with a particular incantation. I am increasingly interested in what happens when you put the incantations away.

[Chimera](https://projectchimera.dev/download/) now has its first public Mac demo. You can walk through Havenwood, leave the harbour along the coast road and reach the Long Road, with its river crossings, repairable cart and hidden hollow. It requires macOS 14 or newer on Apple silicon. It is an early game, with plenty still showing its seams, but there is an actual download at the other end of that sentence.

Getting there exposed a fairly fundamental difference between having built a road and having put it in the game.

The Long Road had been created through the development path. In the release configuration, the code that brought it into existence was disabled. The town could load perfectly well while an entire destination declined to participate.

The correction makes the road load during ordinary play, keeping the development controls separate. Then a causeway connected the harbour to it. The packaged check walked out and back through eighteen route segments, without falling into the sea or using a menu to skip the distance. Continue restored Kai at the quay, halfway across and at the arrival.


And then I played it. The causeway felt long. Kai’s stance and movement needed work. Some residents had the social energy of furniture.

Those observations belong beside the successful checks. They tell me what the journey feels like after the software has established that it is possible. Later internal builds have continued into movement, weather and a furnished hall, but the public demo remains 0.1.0. Those changes need their own acceptance.

[Sector Zero](https://colorpulse6.github.io/sector-zero/) raised a less picturesque travel question: what happens when you arrive somewhere and cannot afford to leave?

Ashfall now has a repeatable salvage shift with no entry cost. It advances the world by one cycle and earns colony metal and travel supply, while construction, consumption and settler growth continue. The recovery path works even when both stocks are empty. You can get back into the game through work.

The tested building sequence reaches five operational buildings and ten settlers in twenty-five shifts. That number came from running the simulation; the earlier estimate had been twenty. Apparently my imaginary settlers also require me to check the arithmetic.


The next change gives the Quartermaster a useful exchange: twenty colony metal for one travel supply. The shop had carried assumptions from the older campaign, offering things a fresh Galaxy player could not use. Now the offer belongs to the economy you are actually standing in.

The trade reads the current save again before spending, refuses an outdated offer and records the exchange once. Holding the interaction key cannot buy the same thing repeatedly. The full browser route starts a new game, works, builds, trades, leaves, returns and reloads.

Salvage is merged. The trade addition has passed its automated checks but remains an open change awaiting review and my final playtest before release. Twenty-five successful shifts prove a route through the economy. I still have to decide whether I want to spend that time there.

[Job Toast](https://jobtoast.io/) found a journey that could finish on the server while leaving the person at the starting line.

When connecting another app, an approval could be accepted and the browser could stay on the consent page. Its security rules were blocking the onward navigation after the form submission. Click again, reasonably enough, and the request had already been consumed. Now it appeared to have expired.

The first click worked. That was part of the problem.

The repair gives the browser a small confirmation page with onward navigation and a visible Continue link. It also remembers the first decision for the request’s remaining lifetime, so another click returns the same answer. The authorization code still works only once.

The backend checks cover repeated approval, repeated denial and attempts from another account. They passed, and the correction is merged. The remaining acceptance step is the real browser journey through the deployed callbacks. A server test can inspect the response; the person still needs to arrive in the app they were connecting.

My [portfolio](https://nichalasbarnes.com/) has acquired a more agreeable reason to keep moving: music.

The new home brings projects, essays, stories and recordings into a continuous sequence. Its music player lives across page navigation, so moving from home into the Atlas can leave the track playing. Previously that navigation loaded a new page and ended the song. A technically valid way to browse a website, an unnecessarily abrupt way to treat a band.

Joining two embedded music services took some negotiation. One requires a press inside its own player before its tracks can enter the shared queue. Another transition needs a brief pause at the end of a preview. The controls now account for those differences.

The retained desktop browser checks follow playback between services and across the route change. Mobile, background playback and long sessions remain unverified.

I also fixed the reading areas catching a continuous trackpad gesture indefinitely. They now hold the last little bit of momentum at the end of the text, then let the page move. You should be able to finish a paragraph and keep going without learning the paragraph’s release procedure.

I think the music is the part I will enjoy most. Someone might arrive to look at a project, start a track, wander into a story and stay for a few minutes longer than they intended. I cannot test whether that will happen.

But I can leave the song playing.
