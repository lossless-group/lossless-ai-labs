---
from: "studies/conversational-ui-and-native-shells"
from_path: "context-v/profiles/index.md"
---

# Profiles

* [5ire — Profile](Profile__5ire.md) - 5ire's MCP layer has no apply button — editing a server row in PGlite makes the client reconnect via the live-query changefeed.
* [Agent-Native — Profile](Profile__Agent-Native.md) - The chat isn't bolted onto the app. The app's operations are one action registry that the UI, the agent, MCP, A2A and the CLI all call, and the conversation is just one more caller.
* [AnythingLLM — Profile](Profile__Anything-LLM.md) - A "workspace" is a config row over one always-shared backend: the chat provider varies per workspace, the vector DB never can.
* [Dive — Profile](Profile__Dive.md) - Two native shells, neither containing a line of agent logic — both are thin supervisors spawning the same Python subprocess.
* [Kaas — Profile](Profile__Kaas.md) - Every credential, provider quirk, and even context assembly lives in Rust; React gets typed `invoke()` calls and nothing else.
* [Open Vibe — Profile](Profile__Open-Vibe.md) - One real OS child process per workspace — but only ever one binary. What varies per workspace is the invocation, not the backend.
* [OpenAgent — Profile](Profile__Openagent.md) - Delegation recursion is prevented not by a depth counter but by never registering `spawn_agent` on the child's tool server.
* [Routa — Profile](Profile__Routa.md) - The swappable unit turns out to be the session, not the workspace: two sessions in one workspace can run two different agent CLIs.
