---
title: "Enough Room for the Thing"
date: "2026-10-04"
issue: 12
week: "2026-W40"
deck: "Cerebro gets smaller, Job Toast recovers the missing parts of a posting, and Chimera builds one corner carefully enough to build it again."
hero: ""
---

I have a generous definition of a small addition.

A panel is small. A setting is small. A system that decides which settings apply to which panel under which circumstances presumably consists of small things, and therefore must also be small. You can get quite far with this reasoning. Eventually you have built a substantial administrative district around a button you wanted to click.

And because you built it, you know why everything is there. This is part of the problem. Every piece has an explanation, every explanation sounds reasonable, and somehow you are still standing in the kitchen unable to find the kettle.

This week I took a considerable amount out of [Cerebro](https://trycerebro.com/download).

After last week’s public beta, the local development version went through a much more fundamental change than another round of polish. I stripped it back around the agents, projects, conversations and canvas. The provider command-line tools keep responsibility for their sessions, configuration and permission decisions. Cerebro supplies the place where I can see and work with them.

The old implementation is preserved. But much of its machinery is no longer part of the active app, and previously integrated areas, including the Brain and social tools, have been parked. There are still unfinished interfaces and setup checks. Getting smaller has required being more specific about what actually remains.

One surviving detail captures the difficulty better than the deletion count. If writing the conversation log fails, the app still needs to stop displaying the agent as running. The earlier error path tried to record the failure before clearing that state. Which is an understandable instinct until you remember that recording things is precisely the operation that has just broken.

The correction attempts the recording, still performs the state cleanup, and tells the live interface what happened. Its regression test deliberately damages the log. I like a test willing to kick the furniture a little.

The reduction checkpoint recorded 873 tests, with one optional rendering check skipped and no failures. The smaller foundation is now on local main and installed in the Local app, with subsequent work making the terminals readable and arranging them by project. The public beta remains a separate release. There is plenty left to use, judge and improve, but I can explain the centre of the app in a sentence again.

That feels good.

Meanwhile, [Job Toast](https://jobtoast.io/) needed more of something: the actual job description.

A connector could save a posting with only the benefits or legal language from its final section. The field contained text, so the server treated it as present and skipped the extraction that would have filled an empty field. You could successfully save the fact that a company offered dental insurance while losing the part about what it wanted you to do all day.

The obvious distinction, empty versus filled, was too crude.

The repair reads the posting page and looks for its structured description, keeping the fuller text when it improves what the client supplied. The background worker uses that source too. A later correction handles the case where an AI response has produced a tidy summary of a much longer posting. A summary can be useful, but here the person asked to keep the posting.

There is a necessary hesitation in this seemingly straightforward act of reading: if the page contains several structured job postings, the extractor declines to choose the first one. More text from the wrong job would be a remarkably unhelpful improvement.

And the test cases have to protect ordinary short descriptions. Words about healthcare, budgets or flexible hours can belong to the work itself. Detecting a benefits-only footer must not turn into rejecting every job that happens to mention a benefit.

Underneath this, extraction had another problem. Whole pages were too large for a fallback model’s allowance, so the supposed backup could fail before doing anything useful. The changes trim the input around the relevant content, stop bursts of queue notifications from starting overlapping processing loops, and let rate-limited work wait without spending its retry allowance on the wait.

These repairs are merged into the tracked main branch. The inspected code and regression cases establish the changes; I have not established a fresh production journey through the whole repaired path. What interests me is how many different failures were hiding behind a populated text box. It looked finished. It contained words. Neither was quite enough.

Chimera offered a more pleasant place to inspect what was there.


The new Lune Corner study is deliberately small: a shop, a fountain, a tree, a few composed views, enough ground for Kai to walk across. It is a separate local art candidate, with editable source assets and a generator that can construct the environment again.

That last part became its own little investigation. Two builds initially disagreed because the exporter divided surfaces into triangles differently. Making that division explicit brought the geometry into agreement. Tiny floating-point differences in surface normals remained, so the exported files still had different hashes.

The comparison now says exactly that. Positions, materials and transforms match; triangle geometry and normals meet the stated precision checks. The files are not identical. There is something satisfying about letting the answer keep its awkward second sentence.

The retained runtime and packaged-app checks each passed thirteen cases, covering actual movement, stopping, camera changes, shaders and collisions. The fountain stops you walking through it. The camera returns to its authored position. Modest achievements, perhaps, but useful ones when you intend to put a person in a place.


Artistically, it is still cleaner and more model-like than the richly illustrated town I want. The distant buildings are simple scenery, the surfaces need more character, and there are no working shop interactions or interiors in this study. Passing the checks does not settle whether I love the picture.

For now I have one corner I can walk around, inspect from another angle, take apart and make again. I can spend time on the curve of a roof without first furnishing an entire imaginary city.

The shop is closed. There is room to work.

<!--

-->
