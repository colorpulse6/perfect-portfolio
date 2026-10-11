---
title: "The Other End of the Button"
date: "2026-10-09"
issue: 13
week: "2026-W41"
deck: "Cerebro gets phone controls, shutdown acquires an ending, and Job Toast repairs a small piece of its past."
hero: ""
---

Retry is a surprisingly optimistic word.

It assumes we know what happened the first time. Something failed, presumably, and now we can do it again. But sometimes the work happened and the reply disappeared, which leaves you looking at a button that might mean try again or might mean do the same thing twice. The button is perfectly calm about this. It has room for five letters.

I have considerably more questions.

This week [Cerebro](https://trycerebro.com/download) gained a phone interface, and some of the interesting work happened inside that little gap between sending an instruction and knowing where it went.

After last week’s reduction of the desktop app, Remote extends the surviving centre: projects, agents and conversations. The agents still run on the Mac, which has to remain awake and connected. A paired phone browser reaches them over the owner’s private network. It can read the conversation, send a message, stop work, answer questions and respond to supported approval requests.

Which sounds pleasantly straightforward until the phone loses a response.

The new interface keeps the identity of that request and offers to retry the same one. The receiving side can recognise it instead of launching another copy. There is also a test for a wonderfully ordinary complication: you send something to one agent, lose the reply, switch to another agent and start writing. Retrying the first request must still address the first agent. It must leave the second draft alone.

These are the sorts of details that disappear when a feature is described as “mobile access.” There are people at both ends of the button, even when one of those people is software with a name I gave it.


I also made the stream of tool activity optional on the phone. The pending question or approval remains visible. A small screen is an excellent editor: the thing waiting for your decision deserves space before the machinery describing how it got there.

Model and effort controls have reached the same surface, with changes unavailable during an active run. They use the agent’s existing provider and permission settings. Moving a control into your pocket should not quietly change what it is allowed to do.


Remote is on local main. The retained tests exercise request replay, access revocation and browser interactions, but they do not establish a real phone connection through the private network or live acceptance of a provider approval. This is development progress, separate from the downloadable beta. I want the convenience. I still have to prove the journey.

Elsewhere, I ran into the opposite end of an operation: getting software to stop.

There is something almost sociable about a process that receives a shutdown signal, closes the front door, says it is leaving, and then remains in the hallway because several other things are still attached to it. Beginning the goodbye is easy. Actually departing takes coordination.

The useful lesson was to give the whole departure one deadline. Stop accepting new work, allow existing work a bounded chance to finish, distinguish the cleanup that determines success from the optional reporting, and then exit. Giving every step a fresh allowance can turn a supposedly bounded shutdown into a succession of small extensions.

And if work had to be interrupted, the result should retain that fact. A process becoming absent does not prove it finished politely. I am taking away a more specific definition of graceful: preserve what you can, say what you could not, and leave. That is a design lesson, not a claim that every live shutdown has been settled.

[Job Toast](https://jobtoast.io/) supplied the week’s most tangible repair.

Last week I wrote about recovering the missing parts of job descriptions. This week continued downstream, where the description and the match score have to agree about what is ready. Independent workers could reach the same saved job in the wrong order: one was still recovering the posting while another was ready to judge the match.

The correction makes scoring wait for active description recovery, while allowing other ready jobs to continue. It also checks that the description is usable before asking AI to assess it. A score produced promptly from inadequate material is still inadequate. It just has a number attached.

That correction reached the deployed code. But changing what happens to the next saved job does not fill the holes in jobs already saved. The past needs its own repair.

So I prepared a separate recovery tool that starts by producing a reviewable proposal. It checks the intended records again when the repair runs, refuses to overwrite a description that has since been filled, and rolls back the batch if the expected state has changed. The database tests deliberately exercise those disagreements. I want a repair to notice when its instructions have become old news.

Finding the actual text was less tidy. A successful page response could contain a JavaScript shell or unrelated content. Rendering some pages in a browser exposed the matching descriptions; other sources remained unresolved. An available page and an available posting are different things.

Two descriptions were restored in an explicitly approved production batch. The retained checks confirmed that both matched the reviewed source text and that unrelated fields and queue records stayed unchanged. No scoring was requested. Evidence that an account has an AI grant does not, by itself, establish permission for this particular recovery action.

Two is a small number beside the ambition of fixing a pipeline. But it is a satisfying size for an ending: two blank places now contain the words they were supposed to keep, and the rest of each record is still where its owner left it.

I can look at that and know what happened.
