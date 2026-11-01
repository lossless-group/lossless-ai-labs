---
from: "id-didi-sh"
from_path: "context-v/issues/index.md"
---

# Issues

* [Claude connectors need didi.sh to be an OAuth server](Claude-Connectors-Need-didi-sh-to-Be-an-OAuth-Server.md) - didi.sh knows who a person is. It can't yet tell Claude so, and MemoPop's connector is the first product waiting on that.
* [The removal disclosure sentence lives in the API](Disclosure-Sentence-Lives-in-the-API.md) - delete_member returns rendered English alongside the data. Deliberate, but it puts copy in the identity service and will not translate.
* [entities and organizations both exist](Entities-and-Organizations-Both-Exist.md) - Two tables now describe overlapping things: organizations carries domain-as-id and firm profiles, entities carries tenancy. Nothing is broken; the duplication will get resolved by accident if nobody decides it.
* [Invite redemption failure is logged, not surfaced](Invite-Redemption-Failure-Is-Logged-Not-Surfaced.md) - If attaching the invited membership fails, the person still gets an account and a session — and lands with no access, having been told they were invited to something.
* [resolve two important branches — tests and workspaces](Resolve-Two-Important-Branches-Tests-&-Workspaces.md) - The workspaces feature is not on feature/workspaces. It is on hygene/test-coverage, unmerged since 2026-08-09, along with a frontmatter sweep and the splash date-chain fix. Nothing on main knows it exists.
* [Role vocabulary strains on projects](Role-Vocabulary-Strains-on-Projects.md) - org_owner on a three-person project reads like a bug. The five-role lattice was designed for domain-scoped orgs and entities inherited it unexamined.
* [splash and site have no agreed division of labor](Splash-And-Site-Have-No-Agreed-Division-Of-Labor.md) - Two Astro surfaces on two hosts, sharing one design system by file copy and one duplicated landing page. Neither the boundary nor the interlinking was ever decided; the changelog lives on only one of them.
