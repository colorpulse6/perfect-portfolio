---
title: "All This Was Obvious to Me"
date: "2026-10-16"
issue: 14
week: "2026-W42"
deck: "Cerebro stops rereading its past, Job Toast follows an application between surfaces, and my publishing tools meet a reader who wasn't there for the explanation."
hero: ""
---

I am an unreliable test audience for things I have made.

I know what the button means. I know why the sentence starts halfway through an idea, because the other half has been living in my head for three days. I can look at a small purple rectangle and supply its entire childhood, its intentions, the difficult conversation that led to its current position beside another small purple rectangle.

A stranger sees two rectangles.

This week involved several versions of that discovery, including one where the software itself knew far too much and insisted on remembering all of it before letting me do anything new.

[Cerebro](https://trycerebro.com/download) had acquired an expensive habit. Every workspace refresh decoded the whole conversation event log, including the histories of agents whose conversations had not changed. While an agent was running, refreshes could be requested four times a second. The reading also held the store lock, so creating something new could wait behind the app's comprehensive review of everything that had already happened.

I wanted another agent. The app wanted to finish its memoirs.

The correction gives each agent an index of where its records sit in the file. New entries extend that index, unchanged histories keep their existing projections, and decoding an agent's conversation happens outside the lock needed for writes. A refresh requested during another refresh also gets a subsequent turn instead of disappearing.

There is a satisfying amount of restraint in this. The history stays. The app stops treating every glance at the room as a reason to reconstruct the building.


The recorded debug benchmark, using a copy of a large local store, took an unchanged refresh from roughly four seconds to two milliseconds. That measures one particular path, not every interaction in the app. The regression tests check the less glamorous obligations too: appended records are found, replacing or shrinking the file rebuilds the index, and reading a conversation leaves the write lock available.

The change is on local main. The replacement public release remains held for separate clean-user acceptance, so the download is not a promise that this development version has reached everyone yet.

I like the feature that emerges from all this bookkeeping: you ask for something, and the software has enough attention left to notice.

[Job Toast](https://jobtoast.io/) had a different problem with noticing.

After the description repairs I wrote about last week, I followed a saved job further through the journey: save it in a connected chat, open its application in the browser extension, finish the local test flow, then ask the assistant what happened. One job should remain one job throughout that trip. Its original application date should survive, and an old confirmation arriving late should not pull an interview back into the applied column.

The installed-extension check found a mistake that the separate pieces had tolerated. An application page could contain both a form and structured information about the job. The classifier saw the job information first, called the page a posting, and never enabled the application tracking that the form needed.

Of course the application page still described the job. What a peculiar thing to punish it for.

The correction gives strong application-form evidence priority while preserving the posting's identity and extracted details. The server can also recognise the saved job by its canonical URL when navigation has lost the extension's matched identifier. Later confirmation signals preserve an existing application date and leave more advanced statuses alone.


The retained browser and database checks follow a synthetic account through that path. They establish one applied job, linked submission progress, and a later interview status that survives another confirmation. The test form's submit counter stays at zero. Nobody applied for a real job to demonstrate that the software could remember one.

These corrections are merged into the tracked main branch. Distribution and a deployed journey remain separate work. My next acceptance check is the same trip against the released pieces, with a dedicated test account, until the assistant and extension agree about the same saved job at the other end.

Meanwhile, my publishing tools needed somebody who knew considerably less.

It is remarkably easy to produce a reel that makes sense to its producer. The plan explains the subject, the caption supplies the missing context, the script contains a perfectly serviceable story, and by the time the rendered video arrives I have mentally repaired it before pressing play. A tiny heading can stand in for a whole paragraph if you already know the paragraph.

So I added a cold reader. It sees the first slide, or eight frames sampled across a reel, without the plan or caption, and has to say what the thing is about. It also reports small text, unclear references and places where the sequence appears to stall. The reel check is deliberately sound-off.

The early results were usefully irritating. Rewriting one carousel to identify its subject moved the reader's score from three to four. Rewriting and narrating a Job Toast reel left its sound-off score at three. The spoken explanation had improved, but the picture still contained small text and beats that barely said anything by themselves.

I had been editing sentences around a rendering problem.

The review machinery now lays its sampled frames out in two rows, keeping the text more inspectable, and records its findings beside the asset. It remains in report mode. A model's opinion is something I can investigate; it has not earned the authority to declare that a stranger will understand a joke, and it cannot hear whether the narration is being swallowed by the music. The phone-sized watch and listen still belong to me.

That is probably the part I most want to keep. I can automate the production, the sampling, the awkward little report that says the subject remains unclear. But eventually I have to sit there with the thing I made and resist completing it in my head.

Let the page contain both the job and the form. Let the old conversations rest. Turn the sound off and watch the words I actually put on the screen.

The missing explanation is mine to supply.
