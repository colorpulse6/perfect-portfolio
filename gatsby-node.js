/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

// You can delete this file if you're not using it

const { SourceMapConsumer } = require("source-map")

SourceMapConsumer.initialize({
  "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm",
})

exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const projects = [
    {
      name: "Job Toast",
      link: "https://jobtoast.io/",
      techArray: [22, 21, 13, 16, 17, 19, 10, 2, 12, 23, 18, 14, 6, 15],
      ref: "jobToastRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/v1738562557/udeejdfdy0f9hpqvb0i2.jpg",
      description:
        "A tool to aid in the job search. Keep track of information for jobs found and applied, prepare for interviews and get the gig!",
    },
    {
      name: "Swash Flag",
      link: "https://swash-flag.vercel.app/",
      techArray: [21, 13, 24, 19, 10, 2, 12, 23, 14, 20, 25, 11],
      ref: "swashFlagRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/v1740145144/bb3iioasmg10aisavinb.jpg",
      description:
        "A feature flag management platform and SDK designed to help developers dynamically control features in their applications.",
    },
    {
      name: "Hoop.It.App",
      link: "https://hoopitapp.herokuapp.com/",
      github: "https://github.com/colorpulse6/hoopitapp",
      techArray: [13, 10, 2, 9, 8, 1, 7, 0, 16, 6, 15],
      ref: "hoopItAppRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616360670/Portfolio/project-images/nvulohccpr3eyywygyv5.png",
      description:
        "Hoop.It.App is a web and mobile app that allows you to organize basketball games in your city and build teams with your friends. Includes a chat function for easy organization and an interactive map for finding courts and games in your area.",
    },

    {
      name: "Fire Store",
      link: "https://fire-store.netlify.app/",
      github: "https://github.com/colorpulse6/fire-store",
      techArray: [13, 10, 2, 3, 9, 8, 1, 7, 0, 15],
      ref: "fireStoreRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616361970/Portfolio/project-images/et8hsi32oszqi3e3bdl4.png",
      description: "A simple Book collection app using Google Books API.",
    },
    {
      name: "Gigzilla",
      link: "https://gig-zilla.herokuapp.com/",
      github: "https://github.com/colorpulse6/gigzilla",
      techArray: [5, 10, 2, 9, 8, 1, 7, 0, 6, 15],
      ref: "gigzillaRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616362260/Portfolio/project-images/x1ivnv5gchqi4tiph0q6.png",
      description:
        "Gigzilla offers a convenient platform for for musicians and venues to contact each other to make it easier for musicians to build tours and venues to book shows.",
    },
    {
      name: "Mad Science",
      link: "https://colorpulse6.github.io/mad-science/",
      github: "https://github.com/colorpulse6/mad-science",
      techArray: [8, 1, 7, 15],
      ref: "madScienceRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1618133528/Portfolio/project-images/gdsjgsgl8bhkwbxonxcs.png",
      description:
        "Mad Science is a game where the player must click on the appropriate balls falling from the screen to fill his beakers with ingredients. Each beaker will hold 3 ingredients. If the player fills 4 beakers he will advance to the next level. The player starts with 10 lives and will loose a life if a target ball falls to the floor before he is able to catch it. He will also gain a life as well as score points if he clicks on a target ball.",
    },
  ]
  projects.forEach(project => {
    const node = {
      name: project.name,
      techArray: project.techArray,
      description: project.description,
      link: project.link,
      github: project.github,
      imgSrc: project.imgSrc,
      ref: project.ref,
      id: createNodeId(`Project-${project.name}`),
      internal: {
        type: "Project",
        contentDigest: createContentDigest(project),
      },
    }
    actions.createNode(node)
  })

  const writing = [
    {
      title: "A Room With A View",
      content:
        "\t   Not only is the floor hard but its covered in wires.  The empty cigarette packs make a nice cushion if they're in the right position.  Theres a vent high above me that almost touches the cement ceiling but stops short.  I like to look at it like it's some bond villain; more powerful than the wall but not quite as collected and austere as the ceiling.  Like it's waiting at the bus terminal with a bomb.  Waiting for a certain bus with a certain passenger but is to distracted by it's own motive and doesn't read the right sign and ends up missing the bus because he isn't sure which passenger is on which bus.  Always he misses the bus.  Will always miss the bus.  Theres no two ways about it.  \n" +
        "\tThere are pipes.  One is in a perpendicular erection to the wall but straight forward like the penis had a muzzled dog nose.  Another pipe behind it, thicker and spray painted for some reason, was burrowed into a drywall box in one corner on one end and painted the same color as the drywall box in the opposite corner.  This is weird to me.  Fucking weird.  Like an ironic mistake.   It occurs to me that I have to think about these things if I ever want to fall asleep.  Especially in this place.   Unless I am comfortable, my mind will devour me and I will eat reality like I'm starving and it's a delicious hamburger, until the daydream becomes a nightmare and I become comfortable because I have picked certain things out to help occupy my brain with meaningless information.  It has to be this way.  Things have to bear absolutely no importance on my waking life, it has to be random, arbitrary, stupid…otherwise my mind will eat it up and I cannot handle the digestion because my metabolism is too quick.  And insatiable, never filled, always hungry.  Like there is a tunnel inside of the mind and at the end is a slight glimmer of something you can barely touch and despite how much you want it and how obsessed you become with it, it just becomes a part of your dream or twisted nightmare.  And then you fall asleep.   \n" +
        "\tI have been in this room for an indeterminable amount of time.  Its part of an experiment, I have agreed to.  I cannot leave, it is part of the experiment, and if I do, everything will fall apart somehow and I will loose what I have been trying to obtain and in one fell swoop become exposed again to the fucked up world outside and my mind, the frailest of organs, will once again become diluted by society.  It will give me information that I do not need or want and it will reduce me proper.  Like vermiculite to soil, like sand, like the croppings of beetle wings, sawdust and basil that, in some mad scientist's version of  an antidote to some disease I do not have, is somehow connected to the panacea that I need but can never bring myself to ask for.  \n" +
        "\tI have a friend that comes by and brings me things.  Survival elements;  Food, beer and cigarettes mostly.  The later two without question, the former can momentarily be substituted by meditation and further drinking.  The food is usually dim sum.  I didn't ask for it but I don't really care.  I'll eat shoelaces when Im drunk and the MSG makes me feel like i'm sparkles and helps me sleep so I go with it.  Sometimes he brings me trinkets which I usually throw into a corner somewhere but then rearrange them quickly if I know he's coming to establish a perception that maybe I am ministering these stupid items as if they mean something to me.  Maybe they should.  I just don't seem to care.  My friend's name is Fred.\n" +
        "\tSometimes Fred comes by, and for reasons I can only explain to myself, I can tell he is afraid.  Maybe it's the awkward look on his face and the darting glances that shoot out like an estranged chrysalis atop an asparagus high on lightning and forcing itself into every conceived corner of non-space, but it frightens me back actually, seeing a human being so offensively perturbed by another.  Or maybe its not me he is afraid of and if its not then that scares me even more.  I guess it's a sort of symbiosis that we have.  A collaboration in fear.  \n" +
        "\tI hate to say it, perhaps because I rely on him so much and have known him for so long but, sometimes I sense something almost sinister in Fred.  A betrayal;  but not from him in particular.  He is a good person, I can sense it.  I wouldn't have begun this whole thing if he weren't.  But I feel as if he is some kind of a henchman, perhaps even for this whole situation, this weird experiment that we have agreed to.  In the beginning it was more jovial, I had it under control, or at least I thought I did and that was good enough to keep me happy or whatever.  But at this juncture I am no longer sure who is in control of what or if there is any control to be had at all.  Sometimes its like I have become not mine or Fred's but some other force's twisted experiment.  Like I am a prisoner.   I think I have to imagine these scenarios because I have no contact with the outside world.  In this scenario I have created I can imagine him driving away from this room in silence as some dark overlord pats him on the back, appearing out of nowhere in the backseat and congratulating him on a job well done.  He resists the accolades because he hates what he has do to but has no say in the matter regardless.  At least this is what I see in his eyes as he hands me the half rack and bags of dim sum and seems to be begging me to be the one to stop all this.  He handles it all like he's fucking poisoning it and I look at him.  I try to tell him that I've poisoned myself and that he has nothing to do with it, but my eyes are not so revealing, forgiving.  \n" +
        "\tYesterday, I think it must have been, I wrote a a small bit about altruism on the wall next to a strange hole that only goes as deep as my longest finger will allow.  I think I love this hole.  I don't understand it, and it makes as little sense to me as a monkey on a tugboat, but I don't seem to want to know why or how this hole is here either.  I just want to love it as it is.  It is a beautiful thing when you can choose not to care about what you love because you know it just is and will always be what you think you love.  But I wrote this thing on the wall and I was thinking that it doesn't matter if you do nice things at all.  Assholes do nice things all the time.  I think you have to be afraid to be an asshole.  Fear is the overlooked cousin of empathy but balancing fear and empathy is too difficult for most of us to imagine.  Fear makes you sensitive and through the introspection that is created through your own knowledge of it you become empathetic.   False confidence does not breed sensitivity, that much I am sure of.  The gift shop is what we cant help but expose to the rest of the world.  The gallery is what we have inside that people are constantly trying to figure out.  I used to think that I was a nice person until I realized that having these kind of thoughts make me an asshole.  \n" +
        "\tAnyways, I have to let myself breath sometime and sometimes I miss people because, despite all their annoying faults and beautiful problems, they are at least interesting.  I miss being downtown and looking at some random guy 's head lesion after I establish eye contact and then they look away right before I do.  I miss catching a fearful glance from someone dressed in a halloween costume that is slightly more outgoing than their comfort can allow. I miss sitting awkwardly in a stairwell with a cigarette, watching the people go up and down wondering if it's normal or not.  I miss the mystery of whether or not  things are normal because right now I have no idea.  I guess I need that self proclaimed vindication.  I need some kind of reference point, I need something to see so that I can at least see through it.  In this room I cannot bring myself to see anything let alone see through anything.  The only faults I can identify are my own and they have no reference.  I guess the only thing you can actually see through is yourself and once you pass through that and into the other room all there is are one way mirrors.  \n" +
        "\tI miss little interactions with people that don't matter.  People that don't matter say the most interesting things because they don't care and they don't care because no one has ever cared about them.  Their thoughts are only their own.  I miss the homeless superheroes, riding that electric rainbow into foreverness.  I miss talking about things that I don\"t give a shit about just for my own therapy.  I miss calculating the time it takes for grocery clerks to bag your groceries.  Some of them are really good, but i'll never tell them.  I guess I just miss slipping on the slime that coats the city.  It has a strange cushion when you fall.  It's like a lillypad, you might fall in but you can't expect anything.  In this room I have my shoes in a small duffle bag in the corner and all I use are flip-flops.\n" +
        "\tWhat I don't miss is the planing and strategy that comes along with interacting with society,  contorting my face and personality to match an assumed perception of some female, hobgoblin or whatnot that I see on the bus, looking off with squinted eyes and lips pursed like an asshole.  Im definitely an asshole, at this point i've relaxed to this fact.  I don't really miss sex all that much.  At least not as much as I miss talking to women and kissing their faces.  I masturbate about once every 4 hours but I don't have a clock in here.  There's also that thing that happens when your talking to people and you weigh their personality and react to them accordingly.  People will tell you they don't do this but they all definitely do, its just that some people are not very self aware or too much so, at this point i cant really tell.  I do miss friendship.  And I miss being a brother.\n" +
        "\tI can tell my friend is here again because I can hear the estranged echo of footsteps and the rustling of plastic bags and him typing in the code onto the keypad on the door.  You have to press the buttons in very firmly otherwise it takes forever and it's no longer a secret.  I have given him the privilege of coming in unannounced because I feel it gives me a very small amount of spontaneity that i think is important.  I hear him keying in the code and my brain has to immediately shift from private to social in 3-5 seconds.  I think that humans need this shift to survive.  When you pull them out into the world it is overwhelming.  They are in a constant state of trying to understand the private recesses of their mind's while spontaneously interacting with others in the process.  Thats why society is schizophrenic.  Why do children learn to talk?  Because everyone else is doing it, and so I have arranged for the lowest possible amount of this.  Learn to react immediately.  \n" +
        "\tI have one bucket in the corner in which I pee and shit the massive amounts of MSG I consume.  I cover it with seran wrap.  It may not be the best system but I'm too lazy to think of anything else.  I'm not Alan fucking Turing.  I've told Fred not to give me any advice and to overlook any discrepancy that he may see in my behavior while i'm in here.  I have directed him to abandon any formula for this scenario that he may construct and I tell him to shut up and I am still learning to do the same:  Any mistakes I may make in this eternity are my own to live with and thats the way I've decided it should go.  \n" +
        "\tSometimes I want to talk to Fred about the world.  This is not one of those times but sometimes I do.  I occasionally want to engage with him about the ticks and tocks of life out there.  But I have expressed very clearly that he is not to speak to me about anything other than what may be happening in this room.  There's something about this that I don't think he likes.  \n" +
        "\n" +
        "\tThe list of items I have in this room are as follows:  a tiny glockenspiel that I hammer out rhythms with, a recording interface, two microphones, two speakers, a children sized drum set, 37 books of empty college ruled paper piled up in the corner and 3 scattered about the room with diametric scribblings and esoteric remarks on random pages about divinity, 20 30 paged books of staff paper untouched, a USB keyboard, a Bob Hope marionette I bought from a Ukrainian gypsy on 4th ave in Olympia, 3 firewire cables, 7 xlr cables, a pair of colorful boots, an amplifier and 3 foot switches.  \n" +
        "\tI have acquired the habit of marking, with a ball point pen, all of the spots where I bruised, cut or hurt myself.  For example, I fell onto a cymbal stand the other day and now my shoulder is in considerable pain.  I think i'll keep re-marking it until it goes away.  At least I can reach it.  At least I can diagnose the problem.  I feel as if this calculated procedure will help in identifying things about myself that would otherwise go unnoticed.  At least the parts of myself that I can reach.  If I am not becoming a robot, than I am coming close to being one.  As if thought were just an amalgam of circumstance.  My environment is finite, like a local bar where you are a regular.  You keep thinking you are going to experience something different with each day, but nothing ever changes.  You go in, expecting to find that one thing that tells you that you are alive and not just a machine, but it never comes.  You are the same person you were yesterday, and the day before, and you can never expect anything different.  You can never expect life to be something that it isn't because then it never will.  You will always be seeing past life instead of through it.  Your frustration of what is not happening will shadow reality and make you a non-entity, a husk of what was once a human.  But then you wake up for some reason in the middle of the night and go outside, because this is where you think life happens.",
    },
    {
      title: "Jeff's Weird Fantasy",
      content:
        "   Jeffrey is the most powerful being in the universe.  He had his qualms with it though.  For example, he couldn't stand being the outcast of a situation.  The foreigner.  The Social Interaction was his god and he prayed to it just a little bit more than the rest of us.  Its not as if he had to be at the center of anything, no, he didn't like that either, made him feel weird, on the spot, like he was being admired as is a shinny diamond or a sunset, something that had no foundation other than what was imagined; unreachable, untouchable, just a catalyst for someone else's perceived version of  beauty, contorted, disturbed, diluted.  If not anything else, he at least wanted to communicate this with people.  Was sad when he wasn't able to.  Made him feel limp, lost, a decrepit goblin scouring the streets around the golden gates.  \n" +
        "\n" +
        "But like us all he was his own worst enemy.  The guy could write his way out of a box made of one way mirrors, but never mustered up the apathy to do so.  Jeffrey was so concerned with the stroke marks that he could never see the full painting.  He cared too much about the little movements of things, the stuff, the shit that doesn't matter, the shit.  He had it down to a science, a mathematics of movement that went on forever.  The end is something you create, and if you don't then life will go on and on and you will miss everything.  The importance of the details can only last for so long before you disintegrate into the surroundings, become just wallpaper with an interesting design on it, but its just wallpaper so no one gives a shit because it's the wallpaper of a really cool bar.  And that would be fine for him even, but in his mind he would be the wallpaper that every talks about.  It would be more like that shit on the walls that make people not want to go to the bar at all.  That shit thats in the background for a reason, stuffed away from the point of focus like a withering flower on which there is maybe one petal left.  A petal that is covered in shit and just trying to lay to rest but can't because reality wont let it.  In his mind Jeff's bullshit would be more important to everyone else than anything good around it.  It would be like a disaster, like a bombing; more influential than any art.  And he would never realize that it's because of his gross, blackened and disgusting flower petal, covered in shit that anyone would ever experience anything at all.  \n" +
        "\n",
    },
    {
      title: "Jerks",
      content:
        "   At the same time, or slightly before you read this, on a small vessel just outside of the planet Earth's atmosphere, two rather bored looking individuals sat in silence flipping unmarked cards onto a table.  The cards gradually piled up.  \n" +
        "\n" +
        '"I win," one of them said.\n' +
        "\n" +
        "The other collected the cards, shuffled them, split the deck and started over.\n" +
        "\n" +
        '"I win. Thats six.  Im telling you, its all in the wrist."\n' +
        "\n" +
        'The other shook his head as he gathered up the cards again. "For you maybe.  But I\'m on a whole other level.  I\'m working on a special technique," he said looking downward with a grimace-like expression, "a secret technique.  Ancient.  A technique of the mind."\n' +
        "\n" +
        '"Well whatever, I\'ve grown rather fond of the wrist technique.  It seems to be effective for winning."\n' +
        "\n" +
        '"Its not all about winning, Siggy."\n' +
        "\n" +
        '"Actually thats all its about."  \n' +
        "\n" +
        "He flipped another card\n" +
        "\n" +
        '  "I win."\n' +
        "\n" +
        '"Well maybe in the long run, but once I get this down, I\'ll be winning in my sleep."\n' +
        "\n" +
        '"And how long does this technique take to develop?"\n' +
        "\n" +
        '"Dunno, probably like another four thousand years.  You just keep wristing about…you\'ll see."\n' +
        "\n" +
        '"Well I don\'t have time for that."  Flip.  "I win.  I quit."\n' +
        "\n" +
        "\"You can't quit.  I can't master the technique unless you play.  Just one more, I've almost got it.\"\n" +
        "\n" +
        '"Nope." He got up and adjusted his jumpsuit as he floated away.  "I\'m done," he said, "have fun," yawning so it sounded more like \'howl run\'.  He floated across the room and brought his ass down onto the rotating stool in front of the control console.  Just beyond him was a window, on its glass surface was a vast diagram of the galaxy, the screen activated automatically as he sat and the Earth appeared.  He moved his palm across the ball in the middle of the board and various index fields opened up.  Lines of glyphs streamed along the fields and he selected a certain parameter of information that he needed.  "Hey Salamander," he said.\n' +
        "\n" +
        '"Not now I\'m concentrating."  He flipped another card.\n' +
        "\n" +
        '"No seriously," Sigfried checked the text once again for verification and then turned around.  Salamander, narrowed his eyes on the target and flipped again.  The card went out of control, catching a maverick pocket of gravity and flew to the other end of the room.\n' +
        "\n" +
        '"Shit," he said.\n' +
        "\n" +
        '"Salamander you dull witted bastard.  I\'ve got the lock-in.  Lets get dressed, its time to do this."\n' +
        "\n" +
        'Salamander shot up from his seat, and immediately found himself in a deep, orgasmic black-out stretch that disabled him even as he drifted into the ceiling.  "Yearrrhhh!"  He announced upon his recovery.  He positioned his feet on the ceiling and propelled himself in the direction of the door.  "Its about damn time.  Im startin\' to get space-crazy."  The door opened and he drifted through it.  \n' +
        "\n" +
        '"Yeah right."  Sigfried palmed the ball and brought up the log.  He typed something into the field, read it, deleted it and typed something else.  He cleared the screen, leaving only the live video feed of the Earth before doing a backflip that sent him flying towards the door.\n' +
        "\n" +
        "Sigfried drifted through the bright tunnel after Salamander.  \"Goddamn this lexicon.  It keeps fucking me up. I almost made an entry in English.  The translation would have been something like 'smoking mango bridge platoon'.\n" +
        "\n" +
        "\"Hey, thats pretty funny.  Yeah I've realized that despite the phonetic similarities in origin, the languages don't exactly translate with the greatest accuracy,\"\n" +
        "\n" +
        "They reached the end of the corridor and another door flew open.  \n" +
        "\n" +
        "\"Did you know that the word for jillywog, when phonetically translated into english means 'violent sodomy'?  I think thats hilarious.\"\n" +
        "\n" +
        "They flew over to a platform and, with their legs straight, bent over so that their heads were at their knees and grabbed onto handles sticking out of the floor.  \n" +
        "\n" +
        '"Yeah and your name\'s a lizard," said Sigfried.\n' +
        "\n" +
        "The gravity came back on and their legs flopped up which instantly became down.  They fell from the handles like sausages and flopped around on the floor for a while.  \n" +
        "\n" +
        '"Wee."\n' +
        "\n" +
        '"Ugh," Salamander grunted, "my organs".\n' +
        "\n" +
        '"Yeah its like spontaneous obesity."  I feel like an elfant."\n' +
        "\n" +
        "They crawled towards the ladder in a similar fashion to the behavior of helpless, brain starved zombies.\n" +
        "\n" +
        'Salamander panted, "Oh, I think you mean elephant. Get on it."\n' +
        "\n" +
        '"On it?" , he pondered, "mmm.  Oh yeah."  \n' +
        "\n" +
        "They managed to make there way to the ladder, but by then they had grown accustomed to the dead air and were walking normally.  \n" +
        "\n" +
        "\"Better not be doing that when we're on the ground or you'll blow our super secret cover.  Ruin everything.\"  Salamander keyed open a glass container on the wall and flipped the switch inside.  The door flew open.\n" +
        "\n" +
        '"Doubt it.  Are you sure they can even speak they\'re own language?"\n' +
        "\n" +
        '"Language is language.  I guess it doesn\'t help either that we were tutored in the lexicon of 21st century American English.  "\n' +
        "\n" +
        "\"Yeah they're already going to think we're crazy.  But whatever.  After a few of these, I'm almost beginning to loose interest in the art of  it all.\"\n" +
        "\n" +
        'Salamander blew out. "Yeah right.  The art.  Good one."\n' +
        "\n" +
        '"Yeah.  Right."\n' +
        "\n" +
        "Once inside the room they stripped from their white jump suits and stepped into the showers.  Sigfried slammed his hand onto a button and they closed their eyes.  With a high pitched sound, a thousand subatomic sanitation capsules began their molecular fornication, splitting, exploding, and instantly covering them in a fine white powder.\n" +
        "\n" +
        'Sigfried opened his eyes back up, "yeah well, we\'ll only be dealing with Grey for the most part.  But lets keep it classy, he turned around to face Salamander with a hard winkish expression, wish I was the jovial one."\n' +
        "\n" +
        '"No way.  You had your chances.  Its my turn.  Plus, with how much experience you have with it, imagine how much better you\'ll do with the other!"  Said Salamander voluptuously, "and we also have to deal with Tatum this time.  So I got dibs."\n' +
        "\n" +
        "Sigfried's preparation for this one was pure documentation.  It still allowed for an equal performance to Salamander's; being directly conditioned through the eyes and experiences of human beings, but Sigfried's was still a more analytical one.  'Participation On Top Priority Of Importance.'  This was not his preferred rodeo.\n" +
        "\n" +
        "The refreshers had dried onto their skin and they turned to face the wall.  Spindly little metallic arms slithered out from countless invisible holes , clicking like little spiders and delicately peeled the waxy substance from their bodies like reptilian egg goo.  Standing there naked, shaven and dripping with excess refresher, they looked like a couple of clergy clones straight out of the bed.  \n" +
        "\n" +
        "They each stepped into one of the dozen follicle pods that lined the adjacent wall.  As the doors slammed shut, a soothing but relentless vapor filled the tiny rooms.  During their training, Salamander remembered, they had been adamant about making sure your eyes were closed during this part of the cleansing procedure.  But he had realized that if you look down at a certain angle, the retinas don't become irritated, and you get to see your hair grow back.  Salamander enjoyed the show, like plants growing in fast forward.\n" +
        "\n" +
        "The pod doors opened up and they each stepped out, rejuvenated, disinfected, and freshly furry with a specific calibration of body hair.  They stepped out and headed back into the locker room.\n" +
        "\n" +
        '"Alright Siggy," Salamander adjusted his shirt collar, "should we do some sight seeing first, or just get straight down to business?"\n' +
        "\n" +
        '"You know my answer.  I can\'t stand pre-dhonic human society.  Any period actually."\n' +
        "\n" +
        '"Oh c\'mon its fun.  Its like…"\n' +
        "\n" +
        '"Its like visiting your smelly old grandma\'s preserved vagina.  What are the coordinates?"\n' +
        "\n" +
        '"Alright.  Achille, Oklahoma.  40-00100.  33°50′5″N 96°23′25″W﻿ / ﻿33.83472°N 96.39028°W﻿ / 33.83472; -96.39028."\n' +
        "\n" +
        'Sigfried typed on the key board, it made bloopity bleep blop sounds. "Alright lets do this."  \n' +
        "\n" +
        "They stepped into the Fader and Disappeared.\n" +
        "\n" +
        "How to Disassemble a Plate\n" +
        "A naked women sat on the edge of the bed smoking a thin cigarette, bent like a string bean.  She let the smoke billow from her tiny nostrils and creased mouth, something Jimmy McKimberly couldn't stand.  He liked it when they blew it out their mouth as if blowing out a candle.  \n" +
        "\n" +
        '"Are you going to leave?"  He asked plainly, terse even.  The woman inhaled again and exhaled and said nothing, not that one should assume that she would have but maybe there are those that would.  "Come over here," he propositioned and shifted his weight beneath the covers, wrapping his own legs around one another, twisting about like a creature, fully aware of his own whiney tone as he spoke - a version of speech that contradicted his situationally effecting intentions.  A few moments passed and he could see into her now and he saw her sigh, inside.  Her mind was an abyss, gathering random fragments from the aether and piling them up until the tower of ideas was too high and massive for her to observe and ultimately gain anything from at all.  She laid back onto the bed with intent, exhausted and perhaps giving up.  Perhaps she had given up on her estranged emotional state, or perhaps not.  The room froze in an ice age.  \n' +
        "\n" +
        '"Do you ever think about what it would be like to be dead?"  She asked.\n' +
        "\n" +
        "A thousand ice ages.\n" +
        "\n" +
        "Jimmy McKimberly did not want his words to come across as stale or contrived or situationally appropriate or vague and searching, but rather, he wanted them to be profound, situationally unexpected, deliberate and brave.  \n" +
        "\n" +
        '"A thousand ice ages," he said, fuck thinking about it.\n' +
        "\n" +
        '"No more then?  Just a thousand," she said immediately, "not one ice age more even, or less?  \n' +
        "\n" +
        "He found himself thinking about fire escapes and images of what the society and media had told him regarding the subject of fire escapes filled his head.  He waited and listened to the silence, the words they had spoken earlier freezing in mid air and left to dangle about posthumously.  Other information blew through him but was incapable of enabling his mind to garner any immediate attention, for he was distracted by his own monologue that was sure to ensue and that would actually be more of a soliloquy than anything.\n" +
        "\n" +
        '"There was a goat right.  And he had a lot of friends.  His friends followed him around and respected the fact that he was born in a different country.  In other words, he had a foreign accent and everyone thought that was cool because they studied art.  The goat was not an artist though and he could never manage to get across to these people, his admirers, that he didn\'t know what the fuck he was talking about.  But every time he opened his mouth and said anything at all even, it just came across as satire; a joke played on the ineffectual by the super intellectual and in this case it was perceived conventionally as actually who he was.  The goat, himself however, never quite reached these levels of understanding regarding his own participation in this confused circus, but did understand at least enough of it to know the way out,"  Jimmy McKimberly paused waiting for a response of any kind and then sat up in the bed and stared at the back of her head, "the goat ,"  he paused, "hung himself in the back of a taxi cab."\n' +
        "\n" +
        "Another wayward silence was arrived at, but this time it was actually free of any discrepancy.  ",
    },
    {
      title: "A Familiar Poker Tournament",
      content:
        'I am here and thats all that matters. I don\'t know what it means but try and remember that.  My goddamn wife is on a plane with some professional poker player.  James Spellmaen.  They\'re going to Vegas for a tournament.  She is a statistics major, specializing in card game research and she needs sources for her thesis.  I was okay with it in the beginning, completely supportive and the like, like any good partner in foreverness.  "Forever", I said, "And always".   But I am beginning to think this is a one way train.  She is vey convincing in her behavior and  I would love to think she is not a manipulative piece of shit cunt but I am very sensitive to my surroundings and therefore I cannot avoid certain signs.  \n' +
        "\n" +
        "I am drunk in bar in the middle of a strange park in Antwerp.  It is actually the greatest thing I have ever witnessed.  Surrounding the park at every entrance is a team of drug dealing scoundrels, the nicest you have ever known.  They hail you but thats as far as it goes.  They don't follow you, they don't harass you, they are not demanding at all.  It helps that I don't speak the language but they don't know that.  The best part is that as soon as you break through the friendly shade and enter the park, which looks like some square in the projects on the East Side of New York, complete with graffiti on every surface and wandering miscreants looking for any available opportunity to ask you to buy or give them something, there are children playing.  Everywhere.  Families taking their kids out for a stroll and ice cream.  The weird mudslide that they see as a jurassic hill with eternity at the top.  Playing soccer with a goddamn crayon.  Having the time of their lives.\n" +
        "\n" +
        "I am not worried about my wife, but since she has been on her trip I have been to three different countries.  I went to Dublin for a while and then to London, might has well have it was only fifty bucks.  Now I'm in Wherever and it all feels exactly the same.  Sometimes I forget that I am waiting for my wife to come home.  I forget that I have sold our house and that there is no home to come back to.  Sometimes I forget how long it has been, and then I think that I am incapable of love.  But then I see a bird somehow spill into my smoking chamber and all I want to do is talk to it.  I want to listen to it and remember every conversation that we have ever had because all I want to do is be around it and help it clean up it's room and go shopping for groceries for it and take it to the orchestra and build a fire for it and build it a house and give it diamonds that I made out of couch cushions and show it what is real and not just a false representation of some imaginary gnome village but a real gnome village that I have built just for her.  Just for that little bird and then it flys away and I can never forget it.",
    },
    {
      title: "How to Disassemble a Plate",
      content:
        "A naked women sat on the edge of the bed smoking a thin cigarette, bent like a string bean.  She let the smoke billow from her tiny nostrils and creased mouth, something Jimmy McKimberly couldn't stand.  He liked it when they blew it out their mouth as if blowing out a candle.  \n" +
        "\n" +
        '"Are you going to leave?"  He asked plainly, terse even.  The woman inhaled again and exhaled and said nothing, not that one should assume that she would have but maybe there are those that would.  "Come over here," he propositioned and shifted his weight beneath the covers, wrapping his own legs around one another, twisting about like a creature, fully aware of his own whiney tone as he spoke - a version of speech that contradicted his situationally effecting intentions.  A few moments passed and he could see into her now and he saw her sigh, inside.  Her mind was an abyss, gathering random fragments from the aether and piling them up until the tower of ideas was too high and massive for her to observe and ultimately gain anything from at all.  She laid back onto the bed with intent, exhausted and perhaps giving up.  Perhaps she had given up on her estranged emotional state, or perhaps not.  The room froze in an ice age.  \n' +
        "\n" +
        '"Do you ever think about what it would be like to be dead?"  She asked.\n' +
        "\n" +
        "A thousand ice ages.\n" +
        "\n" +
        "Jimmy McKimberly did not want his words to come across as stale or contrived or situationally appropriate or vague and searching, but rather, he wanted them to be profound, situationally unexpected, deliberate and brave.  \n" +
        "\n" +
        '"A thousand ice ages," he said, fuck thinking about it.\n' +
        "\n" +
        '"No more then?  Just a thousand," she said immediately, "not one ice age more even, or less?  \n' +
        "\n" +
        "He found himself thinking about fire escapes and images of what the society and media had told him regarding the subject of fire escapes filled his head.  He waited and listened to the silence, the words they had spoken earlier freezing in mid air and left to dangle about posthumously.  Other information blew through him but was incapable of enabling his mind to garner any immediate attention, for he was distracted by his own monologue that was sure to ensue and that would actually be more of a soliloquy than anything.\n" +
        "\n" +
        '"There was a goat right.  And he had a lot of friends.  His friends followed him around and respected the fact that he was born in a different country.  In other words, he had a foreign accent and everyone thought that was cool because they studied art.  The goat was not an artist though and he could never manage to get across to these people, his admirers, that he didn\'t know what the fuck he was talking about.  But every time he opened his mouth and said anything at all even, it just came across as satire; a joke played on the ineffectual by the super intellectual and in this case it was perceived conventionally as actually who he was.  The goat, himself however, never quite reached these levels of understanding regarding his own participation in this confused circus, but did understand at least enough of it to know the way out,"  Jimmy McKimberly paused waiting for a response of any kind and then sat up in the bed and stared at the back of her head, "the goat ,"  he paused, "hung himself in the back of a taxi cab."\n' +
        "\n" +
        "Another wayward silence was arrived at, but this time it was actually free of any discrepancy.  \n" +
        "\n",
    },
    {
      title: "A-Priority",
      content:
        "Timothy Everett goes into Cafe'le Shoppe..  Before he even gets to the open door he is struck with a sudden fear followed by disgust at the awareness he has suddenly found of the place he had planned on going:  Cafe'le Shoppe.  Timothy Everet looks around at the outside of Cafe'le Shoppe and the one million people passing by.  Walking here for him had been stressful because of the joint he had smoked earlier with D.J. Dombowsky It made his mind become obsessed with the details, which ironically would have been the case anyways if he were not on drugs.  He looked at the Cafe'le Shoppe and saw the people that were hanging around instead of just passing by and he noticed a slight but obvious difference between the two.  He noticed that Cafe'le Shoppe (since he had been there last month) had developed into a sort of conglomeration of concentrated hip-sterdom paradisium.  A hang-out for the weird but quirky and yet comfortable (Timothy Everet of course, assumed) people.  A place where they could all go around spitting inane euphemisms and blatantly self conscious and obviously insecure but acceptable statements and, but truly, derived from and of, humanity's sexual impulses.  But hey, not only is this a place of peace, where happy people can go to feel comfortable and similar to others and be accepted for who one is or may be, it is also a place of demonic overflow, an ill-issued form of reality that plays off of your perception and prays on meaning.  There are a thousand places like this everywhere, Cafe'le Shoppe is only one of many.  There are actually a thousand of these places at every point in the Universe.  Probably more considering that Timothy Everet could never begin to comprehend the amount of points in the Universe let alone the places inside of them.\n" +
        "\n" +
        "A paranoia immediately sets in and Timothy Everet falls into Cafe'le Shoppe like something from a trebuchet operated by a confused psychedelic pirate, one who has been at sea for way too long and is very sick in every manner of human health that could possibly be imagined.  \n" +
        "\n" +
        "The hipsters are everywhere.  He's trying hard not to use the preconceived notions he has of the people he sees all the time as his lens- trying hard not to become obsessed with the concept of the hipster to where he cannot see anything else, and to where he himself and Timothy Everet would become a hip-ster.  'That would be Hell', he thinks…underneath and intellectually however, he sees It all as this natural development of human culture, this  postmodern necessity, his personal conceptualization of which makes him think of red and purple colored pomegranates.  \n" +
        "\n" +
        "Him and his friend, Fred, conceive of the whole concept as a natural desire of the human race to fit in or to constrain themselves inside of dimensional structures, if that makes any sense.  Timothy Everet knows theres more to it, 'this isn't our first Rodeo, Man,' he thinks and then thinks about socio-pedagogical evolution.\n" +
        "\n" +
        "Everything is in the details.  Only a fraction, maybe half of It though is not in the details, only the part you can see:  The beckoning of the sweet and inviting, tender, warm, juicy and perhaps mossy but, if if anything, undeniably desirable and violent, bloodthirsty, abusive, vicious, barbaric and poisonous but potentially lethal presentation of reality that we are all trying to deal with, 'mmmm Moist though I must say' thought Timothy Everet, 'like a television set-  Tiny, multicolored lights tweaked and programmed in a certain way to give you a beautiful screen that can hold beautiful things and give you beautiful emotions and present you with an infinite sea of jest and metaphysical logic and truth and a reality that is just so much like your own that you can't even help but to love and admire and prescribe to it', but, Timothy Everet thought as he stared at the tiny moving metropolis,  'if I get lost in the tiny little lights, I will never see the beautiful picture that is unfolding before me.  Or is it a lame and banal version of the experience we could be having? …considering that we are all into that type of thing… the tiny little lights thing…'\n" +
        "\n" +
        "People walk around, languid in their justification.  Their bellies protruding like misspelled vernacular, they speak of pregnancy as maturity; backs straight, hair tied; alien semantics…\n" +
        "\n" +
        "The happy hipster looks through the folk lens and into their own dreams.  What do they see in their wonders thinks Timothy Everet about his own self.  Is it empty?  Is it murky?  Is there a rusted and leaking bike in a tree?  None of it seems authentic or real, only a watered down version of something that, even in its random and original conception was not a very cool thing to begin with.  Like soccer.  It even has a different name somewhere else.\n" +
        "\n" +
        "People look at him, but he is content with his coffee and sits comfortably and feels as if he could be doing anything and he wouldn't have to worry about his hair or general appearance or whatever.  He, them, after all.\n" +
        "\n" +
        "When Timothy Everett sits down, the pain in his left shoulder subsides, he smokes profusely.  He thinks about how there are things you can do to distract people from their initial perception of you, which he had had mostly less than desirable results as of late.  These things you can do, he thought, make you look quirky instead of creepy, because at least you stand out, he thinks.  Or maybe they just assume you know what your doing because they are afraid of people who are out of control.  He thinks about how everybody probably thinks these things all the time.  He thinks about how he had encountered a writer he knew about ten minutes ago as he was walking conspicuously and stoned down the street.  He sees this guy about 3 times a week, which meant that he was part of the inner circle.  Maybe Timothy Everet thought of this but maybe not.  Crossing the street the Dwarf-Goblin figure addressed Timothy Everet and they exchanged only a few generalized and interactive concepts, normal conversational things and, as the writer, as he himself had stated, was on his way to work.  Timothy Everett notices something about the man's demeanor as he spoke despite all the reasons stated.  It was forced, the topics were happening to quickly.  Yes this man seems to be in a hurry to return to his work with money from the bank or something but there is a hidden sort of hatred. But then again maybe it was just stress.  Then again maybe nothing, and why should he even care.\n" +
        "\n" +
        "From here on out he sees omens.  A dead crow on the side walk that he almost stepped on.  A homeless biker with a missing left arm and a hook attached to the left handle of the bike.  A surfer dude filling out a W-2 tax form.  His hand is shaking and he closes his eyes behind thick shades, 'I am a monster among creatures of death.'  He yawns and he is not tired.  The surfer dude does hand stretches in unintentional carnations of the 'hang loose' signal, the ASL sign for 'hang loose' and maybe another thing.  Timothy Everett just remembers that he had taken a vallum over an hour ago.  \n" +
        "\n" +
        "Timothy Everett walks back into Cafe'le Shoppe and is standing behind a man at the counter.  The Keep addressees them both as if they were together, \"Hows it goin guys?\"  Timothy Everett takes this opportunity to smile and ask the man for a pen in the nicest way that he could have conceived of, the other man at the counter, turning slightly, perhaps put off, but Timothy Everet didn't care because his request would take an infinitely less amount of time than the other man's and that guy could just suck a dick.  Timothy Everett thinks the Keep does not even remember him because he looks at the cup in Timothy Everet's hand questioningly as though if to think, 'how dare this man ask for a pen if he didn't buy a drink.  Is that our signature cardboard twelve ounce coffee container or is it just another type of handheld containing device?  Water's not free you know.  And neither are pens!'  Timothy Everet thinks about how then the Keep probably didn't feel like an idiot for not noticing.  He takes the pen and leaves.\n" +
        "\n" +
        "A bird takes a shit on the umbrella of an unaware by-passer.  This is the type of degrading shit that really makes Timothy Everett chuckle inside or, in this case in particular, out loud.  The brutal type of human injury that does not directly effect the person like an old woman falling down the stairs or a douche-bag running a shopping cart off of a four story building into a human shit pit.  This is all in good fun but for Timothy Everet the psychological injury that potentially may occur (one, of course, that he will never see) when the person finds the bird shit on her umbrella after she has thrown it into her living room and the cat has gotten at it and spread it all over the carpet and whatever the hell else, which is not in good fun but completely infuriating and obsessively time consuming, leaving this person no option but to take the time that could have, relying on the individual's living arrangement and drive in general, been spent in a much more productive manor, will always tickle his nerves.\n" +
        "\n" +
        '"A guy as smart as you," said a guy at the bar next to Cafe\'le Shoppe, "needs to know where Croatia is."\n' +
        "\n" +
        '"Alright," said the guy sitting next to the Guy at the bar.\n' +
        "\n" +
        "\"Don't judge me,\" he would think later after the initial satisfaction of having his intelligence worshipped wore off, \"just because I work at a bar, and serve you holier-than-thou suburban folks with your fat chick pay checks, empty crowd stench and double crown's worth of empty threats, do not include me in the 'i work here because I'm too stupid to do anything else category' or 'i work here because I'm a stupid musician who can't do anything but write simple songs that are not catchy enough to make any money off of'\".  But you can, he thinks, because its all but hideously untrue and true and passe and not only is it not cute enough to be attractive but so cute that its not only attractive but irresistible.  No matter how many deadbeats fail at attempting to be gods, people will always love it.",
    },
    {
      title: "The Coward Adventurer",
      content:
        '"I think I\'m slowly growing a mustache that will conduct a transvestite orchestra."\n' +
        "\n" +
        'I looked at him briefly during the downwards arc of my glance, "well thats good", and I meant it sincerely, "because someones gotta do it. This bastard over here", I gestured towards the other room and through the doorway, "he\'s got slugs for days but wont grow the balls to commit."\n' +
        "\n" +
        'He sat  with his bass guitar, teeth clenched, managing a few acronyms "Ehh?" like a frantic centipede on his last legs, disregarding it all to return to some strange form of science.\n' +
        "\n" +
        '"No matter", I said, redirecting my attention towards the maniac trying to sleep at my feet, "I think you should cool your guns.  It happens, it happens.  You can\'t expect something to happen if it hasn\'t happened before.  Right?"\n' +
        "\n" +
        "In the beginning I was approached by Dynastic Industries to commission a musical piece based on the time I spent in Indonesia.  I was there initially to do some work for a successful blog I was a part of called Why Where and What the Fuck.    And why the fuck D.I. approached me or chose to employ me in any way or for any reason at all still bewilders me.  \n" +
        "\n" +
        "WWWF had initially hired me as a writer when they caught me on camera during a Turkish uprising kind of thing in Berlin dressed up as an Osama Bin Laden clown character and giving away free condoms to all the turkish children, or at least I told WWWF that this was my agenda and since then i've sort of become their mozart genius marionette. Letting them pay for me to travel around and be kind of an idiot in the process.  \n" +
        "\n" +
        "And one time they sent me to Indonesia. I had this guide named Yusef.  Yusef loved everything I did but all I really did was just get drunk the entire time I was there.  I think I managed some scribbles on the backs of other people's suicide notes or maybe I had etched a few artistically interpreted Sumarian glyphs on random pieces of pottery, maybe a few pages of notebooks here and there.  But certainly not anything at all to write home about;  Like literally no writing got home at all.  It wasn't even Youtubed.  They wrote the entire article from translations of the Yusef's journal.  I mean, Interpreting his dialect into a palpable demonstration of my experiences from the view point of a native who was also insane and spent most of our time sitting around trees while he wrote about eternal chaos and the derivatives of perspective in that goddamn journal is great but it may or may not say anything about what I was actually experiencing.    \n" +
        "\n" +
        "The whole time its just me, staring at him, wondering why I cant write a word. (….) I now realize its because I was watching myself write and there was nothing to add.  By being obsessively observational, I had become my own guide in my own right.  And I guess it panned out...\n" +
        "\n" +
        "Or maybe it didn't.  At this point I am completely unsure.  \n" +
        "\n" +
        "For example:  I don't have a lot of standards for living and still there are things now that are capable of disrupting what I have always thought to be eternal.  Because of the situation I have currently found myself in, I no longer feel as if I have a subtle and well conceived balance and I feel as if I have become a monster in trying to achieve such a thing even though I know it's already there and it's something that had been in front of me my entire life.   And here It's like I am constantly trying to balance the finite with the infinite and in the end all I am is shit and that's what I see.  It is what you become.  White drapes on white sheets with dirty boot scuffs on the trim and dirty oatmeal floors and moldy shower curtains, but everything set to a standard you have set either way.  And peoples' minds, constantly enforcing, even if they are rudimentary.   Especially so.  I had to say fuck it all or become it all.  To me it really has not or has ever made a difference at all which way I lean.  But of course this is my fault, and because of this perhaps I am a mutant, the holder of the all seeing hand, detached, and it's beckoning the circus freak inside to be let loose, and yet, to live this way is not out of pride or conviction, necessity or convenience and, quite possibly, not even out of lack of trying.  But because it is my basic human stigmatic function to build a home and relish in its 'my-ness'  whether its a shopping cart or a castle.  I have no choice.  I am driven to order and none of us can escape it.  Even the most avant-garde lifestyle is a victim.  Its a 12 tone composition gone wrong, or right, it no longer matters for there is always a boundary.  \n" +
        "\n" +
        'We were passing through the sewers.  Gulping sounds stuck out like we were being sucked into some undercurrent.  We came across a television stuck in the wall.  It was the "Old Last Time Agenda Variety Show"  and there was Razputin, the social phenomenon that was just recently resurfacing from a long term hibernation and public disappearance, his face always recognizable.  He stood with his guitar and legendary mustache, the orchestra moving with each flowing twitch.  As the bouncy music continues, the camera widened to show his famous and, although now sagging a bit, voluptuous breasts .  The dance number began and 2 women and a man appeared, they linked arms with Raz himself and tapped around each other to swaying rhythms and choreography patterns, like drunken swans.  The music began to swell and Razputin began to open chambers of his body like cupboards in german kitchen.  Hands appeared out of nowhere to reveal his various implants and gender surgery.  He revealed his cock, which was filleted into two pieces and inverted, exposed from the inside out.  He flicked it like a guitar string and smiled ferociously.  His mustache was now two huge, stretching arms.  Another drawer revealed what seemed to be his intestines.  His face became nontransparent and the music kept bouncing along.  He reached down and plucked his bloody coils like a harp, ruffing them up as if to break the strings and find some kind of new tonality, as if to say that none of this mattered, his martyrdom, strange that it was so accepted, but we all knew that this was big.\n' +
        '"Man, this will probably be on the news."\n' +
        '"Yeah of course it will.  This is huge."\n' +
        "He kept going at it like some kind of sexual torture, throwing his organs around inside of what was left of himself and still maintaining that maniacal grin.  The other dancers began to force him out,  concerned with the drunken patterns that he was disrupting.  But he kept on, his body now three times wider, revealing parts of himself that could not be contained.\n" +
        "Eventually he was forced off stage and everyone cheered.  I remember thinking that this was not something to take lightly as the dancers bowed and accolades were distributed.  This was not some typical piece of choreography to briefly consider and then forget.  \n" +
        "The haunting voices of the dead appeared again.\n" +
        '"Lets go,"  someone seemed to have said, and we were off, our feet like popcorn in a mushroom patch.  \n' +
        "Things stuck out to us then like blue flowers in a field of wilted dandelions.  Our senses were too abrupt.  We had found a church.\n" +
        "\n" +
        "Like ruins.",
    },
    {
      title: "This Life and Death",
      content:
        "Beating hearts drive my coma and there is a stench that fills my world.  I haven't come to agree with it but only live with it so i should be able to deal.  Each day I fill the water boiler as though it is a mechanism for my own sanity.  If I do not do this I do not know if reality will fall into place at all.  And when i say 'into place' I have no idea what I am talking about because nothing has its place anymore and it is all just a whimsical gesture towards some thing or the other; some desperate attempt at inspiration, at emotion, at desire or some human conviction or just something else that I cant understand.  The things that I want have become an esoteric and fluid standard that is as benign and meaningless as kicking a few stones into a pond.  They eventually settle and the act of it is fleeting, only worth something if I decide it is so.  And so in fact what I actually want is to not decide that certain things are worth anything at all.  So...  \n" +
        "\n" +
        "Some things in my life are eternal.  I will always have them;  music, my appreciation of raspberries and the love of one woman.  Other things appear to me as  circumstantial, perhaps even convenient.  My standards for living are very low and still these other things are capable of disrupting the things that are eternal.  It is a very subtle and ill conceived balance and I feel as if I have become a monster in trying to achieve it.  Constantly trying to balance the finite with the infinite and in the end all you have is shit.  It is what you become.  White drapes on white sheets with white trim, dirty floors and moldy shower curtains, everything set to a standard you have set either way.  I say fuck it all.  Or become it all.  It makes no difference at this point.  Yet, to live this way is not out of pride or conviction, necessity or convenience and, quite possibly, not even out of lack of trying.  But because you can have your little home with your things all in line to your standards, like we all do (none of us are complete scoundrels) we can have a little slice of life as we were meant to take.  It is our basic human function to build a home and relish in its 'our-ness'  whether its a shopping cart or a castle.  We have no choice.  We are drawn to order and none of us can escape it.  Even the most avant-garde lifestyle is a victim.  Its a 12 tone composition gone wrong, or right, it no longer matters for there is always a boundary.",
    },
    {
      title: "And Everything Else",
      content:
        "My name is Alberto and I live in Berlin.  My life has come to the point of complete desperation and illumination at every turn.  I have been both inspired and constricted in ways that I have never known.  I am rotting away like some diseased and forgotten character of a Dostoevsky novel and yet I feel confident in the fact that I could give a shit.  My power is unrestrained and I feed off of the chaos like an insect.  I am full of blood and mad about it.\n" +
        "\n" +
        "I have realized that I am not a man of patterns.  It only feels right for a few terms and then it just gets old.  Four days without a shower, and the privacy you feel when you are finally able to have one is only trumped by how clean you feel afterwards.  It is an amazing feeling.  It is, however, not real.  Because it is still a pattern.  And as long as it is happens within another pattern, you don't truly care.\n" +
        "\n" +
        "Interaction, like inspiration, is fleeting.  You cannot rely on it.   It is not a sandwich that you made.  People are horrible creatures.  And expectation is your enemy.  This is the crippling factor, the main offender, the circumstances of which you wish direly to take leave of but somehow cannot, and somehow, in some forgotten universe that you are capable of strangle holding, you think that you may be able to just walk on by without noticing whats happening around you or even giving a shit, yeah right.  Its just the foreboding awkwardness.  Just focus.  You are going to commit to something and as long as it isn't abandonment, I don't believe you should loose what little faith you have in what you are doing at the moment because it is right.  You are doing it are you not?  Don't believe those outsiders, they are mindless.  They are simpletons, awaiting some awakening of their souls like peasants await a free ticket to the circus.  They don't even recognize that they don't want a part of this.  They just want to be recognized and when you deliver they are right there with you, riding you like a horse on fire to the oasis of the mind that would quench their thirst forever.  And they will never learn because it's all about Everything with these people.  Or maybe its not.  The simplicity is mindless and annoying or maybe its not.  For me at least it is infinitely dysfunctional and incongruent;  like a wrong algorithm or a misplaced cobblestone.  And maybe you fall on your face, disfiguring it to no recourse.   But maybe its right.  \n" +
        "\n" +
        "Maybe its the language barrier, maybe I am just to insecure.  I like to think its the former because even when I am able to broach the barrier of insecurity, I am still just left alone and embarrassed…like an innocent faun in the forest or an insect, ready to go to sleep or drink milk or whatever.  At this state I have to reach the point of rehabilitation 23 or I am stuck at 19.  And we all know what thats like.  Ha.  Don't take me to seriously or your bound to interpret it for your own insincerity..  \n" +
        "\n" +
        "--\n" +
        "\n" +
        "Yankee tribute.  Expat hipsters, the lost and forgotten, obsessive, ungrateful hypocrites.  Wandering about life in a city of lost children.   Trapped in whatever form they are trying to escape.  Not once have I not seen a pattern.",
    },
    {
      title: "A Capitalized Question Mark",
      content:
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; He handed me back my wallet.</p>\n' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; "You can\'t have these on you when you cross the border."</p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; I looked at what he had in his hand, "What, stamp cards?"</p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; "Yeah that type of marketing technology doesn\'t exist there and they don\'t want the local businesses to get any ideas."</p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; "Really?<span class="Apple-converted-space">&nbsp; </span>Aren\'t you just being paranoid?<span class="Apple-converted-space">&nbsp; </span>I mean things happen pretty quickly, so they\'re bound to find out or whatever sooner or later."<span class="Apple-converted-space">&nbsp;</span></p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; He looked at me with eyes that neither understood or saw through me. Just dead.<span class="Apple-converted-space">&nbsp; </span>Like a stool cushion.</p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; "So they confiscate them, so what."</p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; "No", he said, "they\'ll label you a terrorist.<span class="Apple-converted-space">&nbsp; </span>They\'ll think your trying to corrupt their system."</p>' +
        '<p class="p1">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; I handed him my stamp cards, relinquishing any hopeful attempt for future free pizza at P.C.C. and stepped through the gates of hell.</p>',
    },
    {
      title: "Problem Solvers!",
      content:
        "\"If its not my problem, we'll handle it.  If its your problem and potentially ours, we got it!  If it isn't your problem but it might be and definitely isn't ours, we'll sort it out free of charge.  If it's not our problem, well, it might as well be because, don't worry,  we got that covered.  And if it's definitely not my problem and its definitely yours, but it is in some sort of shared non not-my-problem capacity, my problem, then we may or may not be able to provide you with a cake to subdue the effects of the problem as it is to occur later in your everyday life.\"\n" +
        "\n" +
        "-Show cake here.-\n" +
        "\n" +
        "Welcome to Shadow Cake.  We are a subsidiary of basic everyday life that caters specifically to the deranged and completely psychotic variety of your -insert species variety here- catalogue.  \n" +
        "\n" +
        "Those of you who walk the streets and ride the trains, you know what i'm talking about.  It happens as sudden as pudding, where you don't notice that its done until it's already been done for too long, and now you can't enjoy it.    But this is only one of the many offers we have available in our \"Features Catalogue\".  Others include, but are not, of course, limited to:\n" +
        "\n" +
        "- The Happy Dance\n" +
        "\n" +
        ":a movement back and forth to portray an understanding of some esoteric beat that may or may not give you a vindication that lines up with the preconceived notions you have of your surroundings, in particular, when they involve music of some sort.  \n" +
        "\n" +
        "-The Deranged General\n" +
        "\n" +
        ": Most often accompanied by a satiric thumbs up or finger gun but always with a slow and mind numbingly patient wink and overall scrunching of the face.  \n" +
        "\n" +
        "-The Mocking Mirror  \n" +
        "\n" +
        ":The feeling you get when your defense mechanisms are in full effect and the only comfort you feel from others is through your mockery of them.  \n" +
        "\n" +
        "-The Mocking Mirror of Mockery\n" +
        "\n" +
        ":When sarcasm begins to fail and everyone has to look inside for a brief moment to rediscover who they are only to discover that they are a mockery of what they are mocking.\n" +
        "\n" +
        "-The Smoker\n" +
        "\n" +
        ":Its just so cool and everyone calls you on the phone sometimes.\n" +
        "\n" +
        "-The Something Inside\n" +
        "\n" +
        ":We've all got it, just let it be, leave to us to let it be free. **  \n" +
        "\n" +
        "-The Happiness\n" +
        "\n" +
        ":'Don't Worry Were All Gunna Make It, Don't Worry I Repeat. '***  Complete with the box set version of, 'Don't Worry I Will Repeat This Again In Whatever Way Is Deemed Appropriate By Whatever You Seem To Want To Hear And Other Things Of Infinitum And Forever Like For Eternity Is What I Mean.'",
    },
    {
      title: "Floating",
      content:
        "He drinks it all.  That's the way he operates.  He doesn't think about doing it, it just happens.  If he thought about it, well, I personally think he might die.  Its like a song that you know.  It doesn't have to make sense but it has a beat.  Its not my fault he's this way, it's just misplaced circumstance.  In other words its probably God's fault.  The bastard.  Intervening at the most appropriately inopportune times.  What a dick.    Its certainly not my fault that opportunity didn't wear a condom.  \n" +
        "\n" +
        "In the end I don't care.  The things that matter just float along and I'm just a wandering and random snag on the line.  The only real vindication I get that something matters is from outside of myself.  The only thing I know is that once in a while theres a fucking taste in my mouth.  A taste that will always remain the same.  It goes away and thats fine.  But then it's back and….  It's weird that I can't smell it but again, it's just a taste.  I certainly can't touch it but…(\"He said,\")…I've seen it all…I've heard it, I've felt it.   But this taste doesn't care like he does.  This taste doesn't fluctuate accordingly.  It is parameterless and also it spills out without warning.  \n" +
        "\n" +
        "I CANT SEEM TO GET IT OUT OF MY MIND.  \n" +
        "\n" +
        "Well thats unfortunate, maybe you should consult a higher authority on the subject.\n" +
        "\n" +
        "ON THE SUBJECT?\n" +
        "\n" +
        "Well yeah like, whatever it is your tripping about, unless you can define it in a  fashion that in some way represents a resolution, is something completely unbeknownst to me on pretty much every level.  Its esoteric bro.  \n" +
        "\n" +
        "BUT ITS SO INTENSE.\n" +
        "\n" +
        "So explain it.\n" +
        "\n" +
        "WELL IT ALL STARTED BACK ON THE FARM.  I WAS RAISED IN A CESSPOOL LIKE EVERYONE ELSE BUT I SOMEHOW MANAGED TO LEARN THINGS EXCLUSIVELY FROM MY IMMEDIATE AND PHYSICAL INTERACTION WITH INFORMATION AS IT EFFECTED THE SENSORY RECEPTORS IN MY BRAIN.  ITS ALMOST LIKE I LACKED THE ABILITY TO DIFFERENTIATE BETWEEN WHAT I SAW WITH MY NORMAL EYES AND WHAT I SAW FROM THE OTHER ONES.  THE ONES THAT SEE EVERYTHING.  ANYWAYS I DONT KNOW WHAT THAT MEANS BUT AS I GREW OLDER I HAD ALL KINDS OF CRAZY EXPERIENCES THAT IF I ELABORATED ON TO YOU YOU WOULD PROBABLY BE ABLE TO PLACE ME APPROPRIATELY IN SOME CATEGORY OR ANOTHER.  BUT THAT'S OKAY BECAUSE YOU ALREADY HAVE AND I DONT CARE BECAUSE I'VE DECIDED THAT I SHOULDN'T AND THERES ALL THE VINDICATION IN THE WORLD  TO SUPPORT THAT AND THE REST OF MY BULLSHIT.  \n" +
        "\n" +
        "My god that is interesting.  Please tell me more.\n" +
        "\n" +
        "WELL I DON'T KNOW ANYTHING REALLY BUT IT SOUNDS LIKE I KNOW WHAT I'M TALKING ABOUT BECAUSE I TALK SO MUCH.\n" +
        "\n" +
        "Right.  Have you thought about that?\n" +
        "\n" +
        "ABOUT WHAT?\n" +
        "\n" +
        "About how you should maybe stop thinking, shut up and listen once in a while?  I mean i'm not your therapist or anything.\n" +
        "\n" +
        "WELL MAYBE YOU SHOULD SHUT UP AND ANYWAYS I TALK SO MUCH BECAUSE I THINK.  AND I THINK BECAUSE I THINK THAT ITS MORE IMPORTANT TO THINK THAN TO OBSERVE.  \n" +
        "\n" +
        "…\n" +
        "\n" +
        "I ALSO HAVE KNOWLEDGE.\n" +
        "\n" +
        "Oh.\n" +
        "\n" +
        "ABOUT STUFF. I'VE READ THINGS.\n" +
        "\n" +
        "Right.\n" +
        "\n" +
        "The words that i'm trying to write are going to be read later I promise.  I also promise that it has been read before.  \n" +
        "\n" +
        "We're all just going to freeze to death. Like Hunger's teeth.  That selfish bastardo.  He can't  help but take it all.  He's wandering down the fishing line with no regard for simple principle or even a little curtsy to let us know he's alive or let alone a little courtesy to let us know that he gets it.  Don't even tell me I have a problem right now because the torches that light the way are dissociative.  But they taste like salt.  And so I pursue them.\n" +
        "\n" +
        "I show up with convictions that would have derailed my confidence if I wasn't so completely mislead by my own awkwardness.  \n" +
        "\n" +
        "this goes here",
    },
    {
      title: "SOLVENT OF THE UNCLEAN",
      content:
        "My pajama brain took a turn this morning when i became an octopus  \n" +
        "\n" +
        "It wasn't my true brain but just the opposite\n" +
        "\n" +
        "Flamboyant figurines can cram a stamp onto flaccid stanzas\n" +
        "\n" +
        "My brain just went fluorescent, and sat\n" +
        "\n" +
        "Like dreams and you cant react\n" +
        "\n" +
        "But thats just my fan base, a wheel\n" +
        "\n" +
        "The colors not real, not likely, satirically flat\n" +
        "\n" +
        "It wasn't the same\n" +
        "\n" +
        "But not bright and sparkly\n" +
        "\n" +
        "Not like my name\n" +
        "\n" +
        "More like frog shavings and barley\n" +
        "\n" +
        "Potatoes and small cloven hedge groves just to maintain\n" +
        "\n" +
        "Hand shoes grab ya\n" +
        "\n" +
        "I limit my intake to suffer through\n" +
        "\n" +
        "like shrooms on the moon\n" +
        "\n" +
        "and smoke filters in Johnny's star tribute panorama to soon.  \n" +
        "\n" +
        "Theres plants in every corner\n" +
        "\n" +
        "some are warmer\n" +
        "\n" +
        "some are dead and loving it\n" +
        "\n" +
        "some are just matchsticks that wont light\n" +
        "\n" +
        "some are lists of things afraid to be things\n" +
        "\n" +
        "some are just things, pretending to be bright\n" +
        "\n" +
        "Some ring and are.\n" +
        "\n" +
        "Some are pathetic and raunchy\n" +
        "\n" +
        "Sometimes its rotten and for\n" +
        "\n" +
        "Some its the stars.\n" +
        "\n" +
        "Sometimes potatoes.\n" +
        "\n" +
        "Sometimes its a pleasing aesthetic\n" +
        "\n" +
        "Somewhere its fate\n" +
        "\n" +
        "though embryonic, it tastes like I care\n" +
        "\n" +
        "Getting comfortable is like getting plastic surgery.  \n" +
        "\n" +
        "You have the earth against me\n" +
        "\n" +
        "You personally are the one\n" +
        "\n" +
        "I'm on your team but I'm not your average Jim\n" +
        "\n" +
        "otherwise I would be presenting this soliloquy:\n" +
        "\n" +
        '"Hey there hows it goin? really great, do you wanna play some jazz later in my basement?  More pitch?  I don\'t know the reference, is it him?"\n' +
        "\n" +
        "Its just him\n" +
        "\n" +
        "And we would continue on like spindles\n" +
        "\n" +
        "We run loose like mother goose and trip out on loosing shit\n" +
        "\n" +
        "But mending the fender of your fucked out standard has got me given tips to accolades of the hideous and sick\n" +
        "\n" +
        "Like forensics could do triple bypass back flips\n" +
        "\n" +
        "Or an escalade on drip\n" +
        "\n" +
        "It will eventually become the thing\n" +
        "\n" +
        "And at that point you just try and do whatever you were gunna do\n" +
        "\n" +
        "Because your doorbell wont ring if you don't want it to.\n" +
        "\n",
    },
    {
      title: "Any Bar At All",
      content:
        "My friend from Miami was in town for a few days around Christmas.  It was pretty cold so I was hesitant to go out but I was bored out of my mind and he was in town so I took him up on the offer.  We met up at some little coffee shop where the walls had pictures of African people sifting through beans.  They were in time lapse columns from top to bottom.  I sat there and waited for ten minutes.  I thought about the pictures a little and decided they were OK because Africa has good beans, or so I was being led to believe.  I considered asking the barista, some guy with a flailing pompadour who seemed like way too hip to be considered even a person, whether or not Africa had good beans because I'd never really thought of Africa as a being all about beans or whatever but decided not to ask because I didn't really care all that much and I didn't really want to talk to anybody.  A few seconds later I realized that maybe it was Costa Rica and that I'm probably a secret racist or that there is probably an ambiguous line between being oblivious and insensitive.  I seem to ride that line drunkenly on a unicycle with a flat tire.  \n" +
        "\n" +
        'I drank three cups of coffee while I waited, heavy on the cream so that they would go down easier.  When I went up to ask for my first refill and the barista, now suddenly a woman with a crow face wearing a Freddy Kruger sweater, informed me that the only given refills were ones in cups that are not to-go cups and that it was protocol, and that this time since no one told me it was OK.  I said OK and thank you and she said it was 50 cents and pressed the button that makes the ding and I said I only have a card and I hope thats OK.  "Wow, this transaction is just getting sadder and sadder," she said.  That was pretty funny so I laughed and didn\'t say anything witty in response like, "You think thats bad, I only have 48 cents on my card so can I give you 2 cents and you put the rest on my card?"  What I did say though, forgetting entirely that at this point in the game that she was doing me a favour was, "can I put it into a for-here cup?"  Stumbling with the proper way to describe a cup that is not “to-go”.  I don\'t know why I said this and she was like, "well I guess so," and then, as she reached for the cup, the reality of the situation hit me and I said, "no wait never mind." -gesturing awkwardly-  And then it was awkward and I laughed about this to myself several times throughout the night.  \n' +
        "\n" +
        "After about and maybe around the third cup of 50 cent favours I found myself in a cripplingly manic state.   When I get into this state, however often it is, I do things like scream deeply inside, harsh meditation and contort my face in strange ways according to random firings of thoughts in my mind.  I also do crazy stare into space without blinking.  I dunno, I'm probably not as weird as I want to appear.  \n" +
        "\n" +
        "I was listening to the faux rap beats playing throughout the room when my friend walked through the door.  He was all smiles, like a king in court, like the kind of smiles that happen when your attached to congress.  His hair was cut shorter than I remember, almost some sort of mohawk deal and he was wearing a sweater and leather gloves and a long brown coat, scarf and skinny tight pants.  There was another shorter guy behind him who I came to realise was actually with my friend and not just some other dude wanting some favours as the ones I had been gifted.  His name was Tim for some reason.  I gave my friend a hug and for some reason gave one to Tim as well.  He was dressed in similar attire but had hair like a goth wig and bright red sneakers and his facial hair was a perfect goatee.  \n" +
        "\n" +
        "My friend told me that Tim and him had flown here together on some sort of strategy consultant oriented business or something, I wasn't really listening.  These are the aspects of people I tend to not care about.  For the most part, as a rule, the harder I stare into someone's eyes while they are talking the less I am actually hearing anything they say.  \n" +
        "\n" +
        "We talked in this way for a bit.  I did find out that Tim was from here originally, that he used to be a visual artist in college, that my Friend was going to have a short story published in the online version of Vice Magazine.  I told them that my girlfriend used to be a stripper and now she was working as an intern at a radio station while I payed the bills which was a lie, I didn't even have a girlfriend.  \n" +
        "\n" +
        "We talked about everything but myself and once the smiles and banter started to loose their fervency, it was Tim who said we should go to a bar.  He kind of looked around and smiled.  I thought that was a pretty good idea and laid out some suggestions.  I suggested Millie's, which I used to go to because they had a deck where you could smoke and drink at the same time or Jacko's where there was always a good show or the Madre Bistro.  There seemed, however, to be a mutual lack of enthusiasm between the two of them.  There was also Von's, I kept suggesting, a sports bar with an ethnic vibe right around the corner, and Laguna's Brewery and Tim's Tom Ding Dong and Fray the Eclipse and Fang Chia and the Mac Store had a bar and Ballet Shoes for Pets and I just kept going and getting nothing but apathy and sullen glances of distain from the other end of the table.  \n" +
        "\n" +
        '"Hmmm, I just really want to go to a bar."  He kept saying and I gave him a frustrated glance.\n' +
        "\n" +
        '"Ok, well we could go to Fremont there\'s bars there..."\n' +
        "\n" +
        '"Yeah but I bet we could find a bar right around here that would be good."\n' +
        "\n" +
        'For godssake, I thought and kind of fell into the table, alright "do you guys have something in mind?"\n' +
        "\n" +
        'Tim and my friend looked at each other and my friend said, "yeah I have an idea of where we should go."\n' +
        "\n" +
        "We all got up and left that silly coffee shop and went to a bar.",
    },
    {
      title: "The World Is a Coed Bathroom",
      content:
        "Before I died I used to be involved with a PR firm in Los Angeles.  I had a good thing going for me, all that you would possibly be entertained by by imagining.  And now all I want to do is water plants.  \n" +
        "\n" +
        "It all started when I took a piss outside a bar one night.  I was tired of the music playing and the conversations I would get involved with about the music that was or was not playing, and I just went outside to smoke a cigarette.  I went around the corner and pissed on the the wall, noticing that I was pissing all over the little signs of what ever plants were expected to grow next spring, months away.  I must be helping these little creatures in some way, I thought, there must be something inside my recycled nutrients that will, if anything, secure a cozy and rich bed for these plants to get freaky.  If not now than at least at some time in the future.  After seven or eight of these plant pissing escapades, I realized that there was an art to the spray and I started watering plants int this way every where I could.  I would carry a pitcher with me on drunken ventures or if I was really inspired by the night, and if I ran out of water for my pitcher, I would sneak into peoples yards and use their hoses to water the plants that they had left in abandonment.  \n" +
        "\n" +
        "My agenda for this didn't have anything to do with seeing the plants through until fertilization, this much I knew was as impossible as me watching a bug live out it's entire life, and so, for my own well being I would never water the same \"lawn\" twice.  And maybe this would be my eventual downfall.  Maybe I was looking for a secret and immediate outcome.  But maybe the eventuality was enough for me to get off on.\n" +
        "\n",
    },
    {
      title: "Unsaveables",
      content:
        "Just to write another sonnet.  A ballad that obtains not what is wished for throughout but what is necessitated inside.  There are no future holdings for those that heed warnings.  Only a draft, a breeze that will graft them into the sublime.  But what of these times?  When, at once one is thrust into the holdings of a dark realm only to feel the tears of angels weeping on their shoulder?Is this the bountiful melancholy that we at once have seen between our seems?  Is the pattern of our filth a substitute for our dreams?  Why then forever do we peel back the layers of our mind only to find a burned out shadow of who we once thought we were?  These times are no different.  It remains a metaphor for the future, we will only tolerate so much before we realize that that is exactly all we can do.  In response to any unveiling, our body can take only what our mind is willing.  For once we may feel as if it is the parameters by which we are succumbed, surrounded.  And only this once will we be given the chance to heed forth and occupy that which we will forever see in the darkness of our blight.\n" +
        "Are we truly free?  Are we free to grow despite our insight?  Is this form we take a desire or an anvil?  I will congratulate he who does not wish for himself a plethora of reactions to himself but only a will forward.  A wish to move, to react to himself, one reaction to behold.\n" +
        "We are confined in our literature, our art, our music, our destiny is stable, our actions unique.  There is but one outcome, a simple and rational retaliation  that will effect us without repercussions for we will not be here too witness it.  But alas, there will be nothing to witness but our own futility.  A reaction to the fraction of reality to which we pay our dearest respects without even trying.  There is a brief clandestine response by which the fuel of  our souls is triumphant.  A bonding sapphire of light bearing its deliberate fortitude upon us.\n" +
        "But of what are we catalysts?  Do the renegade thinkers bear upon us a delinquent fortitude, while the rest are ushered into the sublime; thoughtlessly, unbearably.  We are shocked at the principles, the prophets, the pronouns; yet we aquire what is beyond the behemoth.  The baphomet of nothing.  The timeless timepiece that we grant illuminous.  To see only that which is not dark is to withdraw ourselves from poignancy and from the accuracy of our account that denies us reflection.  The seas of delicacy fleet against, a fleeting flood that captures the wholesome. \n" +
        "But what of the sorrowful?  What of the pure and the dead?  And the living!?  What of the women that are directed so forcefully into the earth that they cannot derive a star from the treacherous?  Will they understand the terraforming?  When we are privileged to be the mail-carriers of celestial civilization, what will become of the worshipped?  The wanting?  The Absolute?\n" +
        "We are inspired by what we see.  Do not think it juvenile to think spontaneously of what you are directly observing.  Creation is the cousin of observation.  Art is the WELL of life.  We read the patterns to desire and fathom.  \n" +
        "Semblance response - syntactical lighting, bring forth harmony and deceiving what is considered bland.  Misconstrue eternity to understand the time sand. \n" +
        "These fearless brigades deny a deliberation.  We sink into ourselves when one of us stands out.  Can we not break this incompatibility?  Why is the tolerance of our fathers a genetic trait?  Can we not synthesize our minds?  Why are we hidden from that which makes us great? Communication is the tabernacle of our existence.  For if it were to come to death, our species would die with it.  So why is it that we are forced into ourselves, and our reality as it stands:  Seperated from the macro cosm.  We no nothing.\n" +
        '"And there is nothing to know!"  You might say.  Or me, what matter is who it is as long as it were said.  Shohuld we all feel as if we would be willing to die in order to save a more "insert term for socially appropriate"  individual?  Is this the social hive I require?  Must we sink to "second level", become one mind and sacrifice our individuality simply to communicate?  But what is communication?  Is it that which enables an appropriate act to be performed fluently to achieve a specific goal?  One that may be too much of a task for one person?  If this is the case than communication its self is selfish.  However, someone in the back speaks up, one must sacrifice a bit of their own motives and methods in order to achieve the desire of the group.  And to that I say, only to compromise, and that person will see to it that his portion of the rewards is not compromised.\n' +
        "This all seems evil, dark, sadistic.  Perhaps there are those that are fueled by light and will perform as Jesus supposedly did.  But, and here may be my point, would they if there very life were at risk?  When one is faced with this life threatening danger, one is exposed to the marrow.  A side of themselves they have never seen is shown.  They may not even see it.  In fact in the heat of the moment they will not see it, but it will be clearly visible to others.\n" +
        "Withering willows, the fire of an orchestra, the multiplication tables.  My organs control my mind.  I wish only to reproduce, and I have to deal with that everyday.  Its like a curse.  Its a burden.  But what if I could not?\n" +
        "Is this morning business a sonata of silence?  What if they were watching anyways.  Abandon this lucifer principle, only then can we begin to attach a semblance of meaning to work.  To be proud of what we have done, to bring forth a vision of art that allows a reverse transmission.  To teach, one must provide pride.  To teach we must learn.  And to learn we must teach. \n" +
        'This will not ben encyclopedia of the deep or a twisted format for the wise.  Wisdom remains hidden in the eye inside my head.  Filtering her breath and proud of her words.  An illusion that is tamed by reality.  An illusion that this will become.  A scent, the aroma that encases, encapsulates.  This will not be an encyclopedia of delicious treats, snacks of the chamber.  It will not be what it is not.  What it is will not become a stream.  Not a stem that breeds proof of its fruits.  At the end of this branch a looming creature dwells.  "But this is poetry!"  you scream, a dying wail as you pass on into the thickness.  The heat is overwhelming as you awaken into your dream.  Are we approaching the flowering city?  To coincide with denial and bring into us a jewish melody.  Or is it Russian?  I trouble myself with thinking to know what I think and then applying it to itself.  Is that  all?  Is that that in which we are hazy?For which we trail-blazey?  I have shaven the unsaveables.  beaten the ideas into the ground to recreate and reproach.  We are sick of ranting and through with the disabilities of looking back and seeing our work as something that we did not do, which is barely seeing anything, as if it were someone else entirely!\n' +
        "Mainframe.  Sustain the shimmsham shamanism of silliness.   \n" +
        "This is not deep.  This is not beautiful.  This is not real.\n" +
        "The underground whispers desire the troubadours of hostility.  Yet, to be hospitable in its purest sense, one must be acting through pure vision.  This may not be likened to altruism for that term has become the saddest debate of psychology and philosophy, but rather to act kindly to one another human being is to see the universal need for action and to act accordingly.  Frequently it is the case that that which will grant fortune to those receiving the action of other people may not appear as immediately positive.  However, further down the road, that which one has experienced will reconcile into a montage of familiarity and bring them into that space which is there immediate life.  This granted, if one has been denied a negative experience, it may for example have taught them something that they otherwise would have lost to the sands. The reverse is also apparent.  It is often the case that people strive to be nice, which in itself has differing levels of purity.  It is not always the case that individuals even require that people be nice to them.  In fact, it may even be such that obviously false niceties will foster inside someone the hatred and spite necessary to create hanus actions within the universe. \n" +
        "Really the only choice we have is to act or not act.\n" +
        "We will act, however, regardless if we do or not.  Its simply the level of productivity that accompanies the action.  Doing nothing is an action but when faced with a stimulus it becomes non action due to the requirement of the action within the situation.\n" +
        'What would be if Jesus Christ had not died for our sins, our precious sins.  Would we not have sinned as much?  Within the Jesus Paradigm, we are saved, protected.  Our sins are forgiven, therefore we have no responsibility for them.  Its simply, "not our fault".  However, without the Jesus paradigm, we are our own saviors and each of us is a child of God.  How is it to become that Jesus is the only one?  Did he hear the voice speak to him?  Or did he just decide one day to be the nicest guy ever?  I feel left out. And, otherwise, our sins are really all we have.\n' +
        "Its right here.  To hear and to see, up the right tree, to feel our significance.  The progressive similarity.\n" +
        "\n" +
        "\n" +
        "Was this finished?  A progoessive unit , delinquent.  We find a pattern to observe that clinging, warped foundation of our history.  It.  Is.  A trapdoor.  A cinematic soar, sour in advantage.  Aged to illiteration.  Fermented by felines fondling feathers.  Odd metered meat mantles.  If only you could see me doing this, spirit is a sentimental sound, seething, teething, teathered.  You must bring to manifestation your immediate sensation  I am in a different place, a continuum that must be replenished.  Not stopping but not moving forward.  Toward infinity, the only direction we can move. It is only proved by the scheming saturation of the system.  It works and this playback scenario stands alone as a complex conundrum.\n" +
        "Enough of the strings, only entrails bring things to sing before our dreams, lingering beneath the streets of Montagonu Calibu.  It is not me but a person of integrity. A seemingly soft denial of intensity.  A coward before immensity, but delusional, illusions of integrity.  Only deranged flames may tame the strange and bring blame to the insane.  Strike now before the shuddering lament of crimes intent ferment the sent of calypso cement.  In touch with it, as much.  But it may be a crutch so be wary.  Inside the bride is the false fairy.  Do not commit before you can admit. \n" +
        "We will all cause fits.  A bat in the layer.  It throbs with darkness, pierces the nerves with shallow needles",
    },
  ]
  writing.forEach(story => {
    const node = {
      title: story.title,
      content: story.content,
      id: createNodeId(`Project-${story.title}`),
      internal: {
        type: "Writing",
        contentDigest: createContentDigest(story),
      },
    }
    actions.createNode(node)
  })
}
