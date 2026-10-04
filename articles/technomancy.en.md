# Technomancy

I made a digital divination tool with Stable Diffusion 2.1. The model is imperfect enough to produce strange, ambiguous pictures quite often. That suits this task: the harder it is to tell what a picture shows, the more room there is for your own reading.

The setup is simple. We take between 256 and 1008 bits of entropy from the person doing the reading, use them to build random prompts, and generate three images. These form a triptych. Under each picture goes one word from a chosen triad: a set of three related ideas. Together, the pictures and captions give us something to interpret.

I like the size of this “deck.” With 1008 bits, there are 2¹⁰⁰⁸ possible inputs, many orders of magnitude more than there are atoms in the universe. Of course, that doesn't mean every picture will be distinct or interesting. But you can't go through the deck in advance and learn what all the cards mean. Each time, you have to look at what came up and work it out for yourself.

Technomancy can mean divination using computers: algorithms, random generators, neural networks. The method is familiar. In ordinary divination, people toss coins, roll dice, or shuffle cards. Here, random data passes through a generative model and becomes images.

SD 2.1 often confuses objects, combines things that don't belong together, and draws things that are hard to name. Usually, that is a flaw. Here, it gives us material to interpret. A clear picture already comes with a story. A strange one makes you look more closely: is that a passage or a wall? Is someone leaving or coming back? Why does that particular detail seem important?

A diffusion model learns to remove noise. When generating an image, it starts with a random array of numbers and gradually turns it into a picture, guided by a text prompt. The result depends on the starting noise, the prompt, and patterns learned during training.

In my tool, the initial entropy determines what happens next: which prompts are produced and which noise the generation starts from. With the same inputs, settings, and computing conditions, the result can be repeated. Something can be unpredictable to the participant while the program still follows definite rules.

You could simply give the model your question. But I find it more interesting to leave part of the process to chance. When you choose every word of the prompt yourself, it is easy to shape the answer in advance. A random combination of images gives you a reason to think about something you hadn't planned to ask.

Marie-Louise von Franz has a related idea in *Divination and Synchronicity*: when turning to divination, you need to leave room for an answer you don't control. I like the practical side of this. You ask a question, then briefly give up choosing the material you will receive to think about.

That is why the person doing the reading takes part in the procedure. For example, they can press keys erratically, and the program uses those actions to produce its input. This connects the spread to a particular action by a particular person at a particular moment.

The body, attention, and habits all play a part in the rhythm of those movements and keystrokes. Poetically, you can see a trace of your state in them. But calling the resulting bits a record of the subconscious would be a stretch. For the practice itself, it is enough that the person helps choose the spread without knowing what they are choosing.

The model contributes, too. It was trained on images and text, so familiar objects, scenes, and visual associations appear in its output. A random prompt brings them together in combinations you might not have thought of while considering the question in the usual way. Then it becomes interesting to watch which connections a person finds between them.

This is a little like looking at stains or clouds. We recognize something familiar in an ambiguous shape and try to work out what it resembles. If a question is on our mind, our associations may connect to it.

One person sees loneliness in an empty room; another sees a chance to finally be alone. Sometimes the most useful thing is to notice your first response. What caught your eye right away? Why did the picture feel unsettling? Which detail did you want to ignore?

Three images add a little structure. You can read them as thesis, antithesis, and synthesis: state your usual explanation of a situation, look for an objection, then try to bring both views together. But I use other triads in the captions, too. For example, “PREDATOR — PREY — WITNESS” or “MAP — TERRITORY — TOURIST.”

I collect these triads in advance. The program chooses one whole set from the list using the same input data used for generation. Its words become the captions under the three panels, from left to right. They are not part of the prompts: a picture captioned “witness” may show nothing you immediately recognize as a witness. Then you have to look for a connection between the word, the image, and your question.

I especially like triads where the third word changes the relationship between the first two. Predator and prey are a familiar pair, but a witness adds someone's point of view: who is watching, are they involved, can they intervene? In “Symmetry — Flaw — Signature,” the flaw can be read as a distinctive feature. Add a tourist to map and territory, and you also have a question about who uses them and why.

The caption guides your attention, but you still have to connect it to what you see. The same blot under the words “threat,” “gift,” or “toy” would bring up different associations. Neighboring panels make you look for relationships: what is threatening whom, where did the gift come from, who is playing with what? The pictures don't have to form a convincing story. Sometimes the effort to connect them helps you put something vague into words.

Chance is useful here because it is indifferent. It has no advice it wants to give. Still, the model is limited by its training data, and the person brings their own expectations to the spread. Divination doesn't remove bias, but it can help you notice some familiar habits of thought.

Meaning appears as you look. You might find a useful association, argue with your first reading, or decide that nothing interesting came of it. Not every spread needs to be treated as profound.

In arguments about Tarot, skeptical criticism often focuses on whether the cards can predict events. If someone promises a reliable forecast, asking for evidence is entirely fair. But that argument can make it easy to overlook what happens during a reading. What does the participant do? How do they approach their question? Why do they pause at one image and skip another? Saying, “It's random, and you made up the meaning yourself,” leaves most of this unexplored. What interests me is how a person makes up that meaning and what they notice along the way.

Esoteric thinkers are partly responsible for this attitude. When personal experience is presented as knowledge about how the world works, and symbolic connections are explained through energies, frequencies, or quantum physics, the discussion naturally moves into science. There, claims need to be testable. Mixing these languages also makes it harder to discuss the experience itself: it can seem as though rejecting a doubtful explanation means rejecting the whole activity.

Yet divination has a sequence of actions we can readily observe. First, you put your concern into words. Then you do something whose outcome you don't choose, wait for the spread, and treat the images as a possible answer. This sequence involves anticipation, surprise, and an attempt to recognize your situation in something unrelated. You can understand where the pictures came from and still experience that moment. Knowing the rules of a game doesn't stop you from playing it.

In technomancy, I want to keep this experience of divination while removing the need to accept an ancient view of the world and the explanations that have built up around it. This is part of what I write about in [*Computational Sublime*](/articles/sublime.en): we can explore what a ritual does to a participant's attention and expectations, and create our own forms for doing so. Here, the material is chance, the workings of a generative model, new images, and combinations of words. You can examine the rules of the program, then try it yourself: ask a question, get a spread, and see what happens as you read it.

I have no reason to expect a reliable forecast from this kind of divination. But it may help me understand how I see a situation right now: what I expect, what I fear, which possibilities I even notice.

Sometimes we want to know the future simply because it is hard to make a decision without guarantees. A spread offers no guarantees. But if reading it helps you name a doubt more clearly or see another possible action, that is enough to make the activity useful.

It takes a little willingness to play. Much like seeing a face in a pattern or making up a story from a random photograph. You can try an association for a while, see where it leads, then decide whether it fits.

The future remains unknown. But sometimes it becomes a little clearer what to do now.
