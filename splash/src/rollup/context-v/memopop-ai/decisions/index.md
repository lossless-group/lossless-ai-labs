---
from: "memopop-ai"
from_path: "context-v/decisions/index.md"
---

# Decisions

* [Host the Connector on Railway at memopop.didi.sh](Host-the-Connector-on-Railway-at-memopop-didi-sh.md) - The connector gets its own subdomain pointed straight at Railway. No domain to buy, and no proxy in front of streaming.
* [No Tool Ships Without Its Docs and Tests](No-Tool-Ships-Without-Its-Docs-and-Tests.md) - MemoPop's connector is our first API, so it sets the habit: every tool has docs written for agents, CI tests, and a live health check.
* [One Workspace per Firm, with a Private Bucket](One-Workspace-Per-Firm-With-a-Private-Bucket.md) - Each client firm gets one workspace on our server holding all its deals, plus a private bucket of its own for originals and backups.
* [Sign In Through didi.sh OAuth](Sign-In-Through-didi-sh-OAuth.md) - Partners sign in once with their didi.sh account, and the token says which firm they belong to. didi.sh has to grow OAuth first.
* [The Client's Claude Does the Work](The-Clients-Claude-Does-the-Work.md) - In v1 we pay for almost no model calls. The partner's own Claude writes the memo; MemoPop supplies the method and keeps the work.
* [The Server Hands Claude the Method One Step at a Time](The-Server-Hands-Claude-the-Method-One-Step-at-a-Time.md) - Claude never holds the whole pipeline. It asks for the next step, does it, hands back the artifact, and asks again.
* [Three Kinds of Error, and Optional Steps Never Block](Three-Kinds-of-Error-and-Optional-Steps-Never-Block.md) - A blocked memo is the worst outcome. Every error says whether MemoPop is down, the request is wrong, or the step can be skipped.
* [jj Versions Text, and a Save Snapshots to the Bucket](jj-Versions-Text-and-Saves-Snapshot-to-the-Bucket.md) - Every draft is versioned without the client touching version control, and a single save backs the whole workspace up.
