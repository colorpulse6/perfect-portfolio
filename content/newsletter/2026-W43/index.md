---
title: "The Town Has to Let You Leave"
date: "2026-11-07"
issue: 15
week: "2026-W43"
deck: "Sector Zero earns a way out of scarcity, Job Toast checks what it actually saved, and Chimera finds an expensive habit hiding inside its painted world."
hero: ""
---

Delayed publication of the 2026-W43 working-week draft, published 2026-11-07. Progress and remaining checks below describe that week, not new claims as of publication.

A mine is an excellent way to get metal, provided you already have enough metal to build a mine.

I can spend a surprising amount of time arranging everything that comes after this. The housing, the farm, the people arriving with their little expectations, the pleasant business of turning a patch of ground into somewhere worth returning to. Meanwhile the player is standing beside an empty supply box, studying my beautiful diagram of things they cannot afford.

There should probably be something to do here.

In [Sector Zero](https://colorpulse6.github.io/sector-zero/), that became a salvage shift. Ashfall’s colony management now offers repeatable work near the landing pad: spend one world cycle recovering scrap, receive forty metal and one travel supply. No entry fee, no building prerequisite, no combat victory required. You can begin with nothing.

The rest of the colony keeps moving while you work. Buildings finish, existing production runs, food and water get consumed, settlers can arrive. The reward comes after that cycle. I wanted a way back into the economy that belonged to the economy, with time passing and consequences continuing around it.

The first estimate said twenty shifts would get the settlement going. The simulation disagreed. The accepted route takes twenty-five shifts to build the five basic buildings and reach ten settlers, with the building orders and travel controls requiring their own clicks. Apparently even my imaginary construction estimates require supervision.


The tests follow the ordinary controls from a fresh galaxy through arrival, work, construction, departure, return and reload. Another case starts after a failed expedition and reaches an operational mine without erasing the failure. Holding Enter cannot turn one shift into an accidental career in scrap recovery, and an old request cannot award the same cargo twice.

The work merged on October 22, and its deployment completed successfully. My remaining release check is the whole journey again on the deployed game. Trading and the broader settlement balance still need work.

But the colony has acquired a useful property. Failure can leave you with something to do next.

I went back to an earlier point in [Job Toast](https://jobtoast.io/) too, before the application journey I followed last week: the moment a job gets saved from a connected chat.

The old shortcut was reasonable enough to be troublesome. If the assistant supplied a description with enough text, the save path could trust it and skip reading the posting. But a substantial fragment is still a fragment. Benefits and legal language can occupy plenty of space while leaving out what the person would actually be doing all day.

The page reader had another limitation. It looked for the posting’s structured data, the machine-readable description tucked into the page. Some pages contained the useful words in their ordinary markup instead. We could reach the page and still come home empty-handed.

The correction checks the posting on every URL save, gives that work an eight-second deadline, and uses the fuller extractor that can read both forms. Supplied text survives unless the page offers a better description. The response also says where the saved words came from and whether background recovery was actually queued.

That last detail gives the assistant something more useful to say than a cheerful, undifferentiated “saved.” It can distinguish keeping the job from successfully recovering its missing text.

The recorded live-page comparison recovered full reference-length descriptions for empty and partial inputs across all eight readable test postings. Two blocked sources remained blocked; their tests establish preservation of supplied text, not successful extraction. One live page also replaced an already complete paste because the comparison preferred it. That is a tradeoff I want to watch.

This repair is merged. Those checks fetched real pages but used local test storage. A save through the deployed connector with a dedicated test account remains the next check.

Meanwhile, [Chimera](https://colorpulse6.github.io/project-chimera/) had enough scenery to make me suspect the scenery.

The native 3D build now has a painted courtyard and street, drawn residents, conversations, and a cape doing considerably more dramatic work than its owner. This week’s look settled on ink lines, flat colour, lavender shadows and paper grain. The earlier plastic-toy quality finally started giving way to the drawing.

And the packaged build was running at around twenty-five frames a second.


Removing the expensive lighting system had barely changed that number. The measurements pointed somewhere less picturesque: the pass that smooths jagged edges was taking roughly seven and a half milliseconds of a graphics frame already close to twenty milliseconds.

My display refreshes fifty times a second. Twenty milliseconds is its interval. A frame that narrowly misses that interval can wait for the next one, turning a small excess into a much larger visible delay. The same build could hover near fifty frames a second or fall toward twenty-five depending on the surrounding load. A very small ledge, a surprisingly long fall.

There was a second trap in measuring it. Put the game behind another application and the operating system throttles it. Those samples said more about which window had focus than about the town. The investigation started counting only focused frames.

Switching to a cheaper edge-smoothing method kept the accepted ink, grain and shadow treatment visually intact in the comparison. The rebuilt package averaged 49.9 frames a second over a focused sixty-second courtyard sample. That is a stationary local measurement, with occasional slower frames, and I still owe it a measured route with camera movement. It does not establish sixty frames a second on another display.

I like that the expensive thing turned out to be something I could barely see. The lavender stayed. The paper stayed. The strange people around the well stayed.

There is a particular pleasure in reaching the point where a place can disappoint you in ordinary ways. The camera catches a tree. The shopkeeper’s collar needs attention. You walk down the street and wonder what ought to be around the corner.

I have spent a long time trying to make that street exist. Now I want to take a walk.
