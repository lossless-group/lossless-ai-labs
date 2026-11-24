---
title: "tests/ — test suite"
lede: "The pytest suite, 18 files; every test is tagged with the spec ID it proves, so status is derived, not claimed."
publish: true
date_created: 2026-11-22
date_modified: 2026-11-22
date_authored_initial_draft: 2026-11-22
date_authored_current_draft: 2026-11-22
date_authored_final_draft:
date_mirrored: 2026-11-22
mirrors: "corpora-builder/tests"
authors:
  - Michael Staton
augmented_with:
  - Claude Code on Claude Opus 5.5
at_semantic_version: 0.0.0.1
status: Current
category: Mirror
type: Mirrors
tags:
  - Mirror
  - Testing
  - Pytest
site_uuid: 4721cf77-f47f-4244-9725-f8fe201ca109
hex_code: cc8oyu
summary: "Mirror of tests/. Never weaken a test to make it pass (see CLAUDE.md). Live R2 and proving-corpus tests are gated."
from: "corpora-builder"
from_path: "context-v/mirrors/tests/index.md"
---
# tests/ — test suite

> [!info] Mirror of `corpora-builder/tests`, taken 2026-11-22 at commit `3a3021e`.
> It reports what the code is and does today. When it drifts, re-take it; don't edit it from memory.

Each test is marked with spec IDs (for example `STORE-11`); `conftest.py`
records them and `scripts/spec_status.py` joins them to outcomes. Tests run
under `tmp_path` with no network; tests against live R2 or the real proving
corpus are gated and report `GATED` when their prerequisites are missing.

## Files

### Test setup

`tests/conftest.py` · 69 lines

Shared test setup that also records which spec requirement each test proves.

**Interface**

- `pytest_configure(config: pytest.Config) -> None`
- `pytest_collection_modifyitems(items: list[pytest.Item]) -> None` — Map every collected test to the spec IDs it claims.
- `pytest_runtest_logreport(report: pytest.TestReport) -> None` — Record the worst outcome seen across setup/call/teardown for each test.
- `pytest_sessionfinish() -> None` — Join outcomes onto spec IDs and write the results file.
- constants: `RESULTS_PATH`

### Missing address fill tests

`tests/test_backfill.py` · 194 lines

Checks filling in tidy web addresses on older source files, byte for byte.

**Interface**

- `test_the_normalised_form_is_derived_with_no_network() -> None` — Every one of reach-edu's 737 filed sources carries a `url:`, so identity is available for nothing — 511 of them lack only this.
- `test_a_file_that_needs_nothing_is_skipped_with_a_reason(text: str, reason: str) -> None` — A stated reason, not a silent pass. The unclosed-fence case matters most: that is a damaged file, and a backfill should not be the first thing to write to one.
- `test_exactly_one_line_changes_and_nothing_else_does() -> None` — The whole value of this operation is that a client can read the diff.
- `test_a_second_pass_writes_nothing(tmp_path: Path) -> None`
- `test_a_dry_run_changes_nothing(tmp_path: Path) -> None` — Planning reads. Only `apply` writes — asserted on the bytes, because 'the dry run is safe' is exactly the claim nobody wants to take on trust.
- `test_the_generation_a_key_counts_as_a_url() -> None` — **Found by running it, not by a fixture.** A dry run against reach-edu reported "590 no url" for a corpus where every source has one: 589 of 832 carry the Generation-A key `exact_url:`, and a literal `^url:` sees none of them. The key list is derived from `FIELD_ALIASES` so it cannot drift.
- `test_the_canonical_key_wins_when_a_file_carries_both() -> None` — 47 files in reach-edu carry `exact_url`, `url` and `normalized_url` at once. A file mid-migration follows the parser's rule: canonical wins.
- constants: `WITH_URL`, `ALIASED`

### Large file tests

`tests/test_binary.py` · 621 lines

Checks content-based names, PDF shrinking and when it refuses, two-place storage and moving PDFs over.

**Interface**

- `migrate_tree_with(store: BinStore, root: Path, compress) -> list` — `migrate_tree` with an injected compressor, so idempotence can be proven by counting invocations rather than by trusting a timing side effect.
- `fake_pdf(body: str=PROSE, padding: int=4096) -> bytes` — Bytes that stand in for a PDF. Content is what matters, not structure.
- `extractor(mapping: dict[bytes, str])` — A text extractor with known answers, so invariants are exercisable.
- `shrinker(out: bytes)`
- `exploder(_: bytes) -> bytes`
- **class `CountingStore`**(`LocalFsStore`) — Counts reads so a cache hit can be proven to touch no remote.
  - `__init__(self, root: Path) -> None`
  - `read(self, key: str) -> bytes`
- `binstore(tmp_path: Path) -> BinStore`
- `test_the_key_is_the_content_hash_with_a_two_hex_fan_out() -> None`
- `test_the_same_bytes_under_two_names_are_one_object(binstore: BinStore) -> None`
- `test_an_optimized_pdf_is_stored_smaller_and_marked_optimized(binstore: BinStore) -> None`
- `test_optimization_preserves_the_text_layer(binstore: BinStore) -> None`
- `test_optimization_that_costs_text_is_rejected_and_the_original_stored(binstore: BinStore) -> None`
- `test_a_scanned_pdf_is_never_optimized(binstore: BinStore) -> None`
- `test_an_optimized_ingest_records_what_the_publisher_served(binstore: BinStore) -> None`
- `test_a_verbatim_ingest_reports_one_identity_and_optimized_false(binstore: BinStore) -> None`
- `test_verification_reads_no_object_bytes(binstore: BinStore) -> None`
- `test_a_referenced_but_absent_object_reports_missing_rather_than_raising(binstore: BinStore) -> None`
- `test_altered_bytes_are_reported_as_a_hash_mismatch(binstore: BinStore) -> None`
- `test_an_uncached_binary_reports_not_downloaded_and_fetches_nothing(binstore: BinStore) -> None`
- `test_fetching_a_not_downloaded_binary_makes_it_present_and_intact(binstore: BinStore) -> None`
- `test_eviction_frees_the_local_copy_and_a_later_fetch_restores_it(binstore: BinStore) -> None`
- `test_eviction_is_refused_when_the_remote_cannot_be_confirmed(binstore: BinStore) -> None`
- `test_migration_writes_the_pointer_onto_each_wrapper_and_deletes_nothing(binstore: BinStore, tmp_path: Path) -> None` — The promise is *object AND wrapper*. The first version of this test checked only the object, which is how 24 orphans reached a client bucket.
- `test_migration_is_idempotent_on_the_optimized_path(binstore: BinStore, tmp_path: Path) -> None` — The first version ran with optimize=False, the one path where idempotence was already free. This one proves it where it was actually false.
- `test_the_configured_compressor_is_deterministic() -> None` — Ghostscript embeds a timestamp, an /ID and XMP unless told not to, which makes an optimized object's identity unreproducible. Skipped when gs is absent — the flags are what is under test, not our fakes.
- `test_an_already_mapped_binary_is_skipped_and_never_recompressed(binstore: BinStore, tmp_path: Path) -> None`
- `test_a_changed_source_is_re_ingested_and_the_pointer_updated(binstore: BinStore, tmp_path: Path) -> None`
- `test_patching_a_wrapper_changes_only_the_lines_it_adds(tmp_path: Path) -> None` — The gate. Re-serializing a real wrapper produced 250 discrepancies across 34 files; this asserts the inverse property holds instead.
- `test_the_publishers_original_is_stored_alongside_the_optimized_copy(binstore: BinStore, tmp_path: Path) -> None`
- `test_a_second_corpus_referencing_the_same_binary_hits_the_shared_cache(tmp_path: Path) -> None`
- `test_clearing_the_cache_is_lossless(binstore: BinStore) -> None`
- `test_a_missing_optimizer_degrades_rather_than_failing(binstore: BinStore) -> None`
- `test_every_store_satisfies_the_same_binary_contract(build, tmp_path: Path) -> None`
- constants: `PROSE`

### Browsing tests

`tests/test_browse.py` · 269 lines

Checks the source list, filters and that unreadable files still appear with their error.

**Interface**

- `store(tmp_path: Path) -> LocalFsStore`
- `test_listing_carries_the_display_fields(store: LocalFsStore) -> None`
- `test_listing_filters_by_domain_prefix(store: LocalFsStore) -> None`
- `test_a_damaged_file_appears_with_its_error(store: LocalFsStore) -> None` — 13 sources once vanished from a count. A tidy-looking listing is worse.
- `test_search_matches_title_and_excerpt_case_insensitively(store: LocalFsStore) -> None`
- `test_listing_is_newest_fetch_first(store: LocalFsStore) -> None`
- `test_loading_one_source_returns_it_unmodified(store: LocalFsStore) -> None`
- `test_a_traversing_path_is_refused(store: LocalFsStore) -> None`
- `test_excerpt_falls_back_to_body_prose(store: LocalFsStore) -> None` — reach-edu's 845 files predate the excerpt field entirely.
- `test_domain_handles_both_corpus_layouts(store: LocalFsStore) -> None` — corpora-builder writes live/<type>/<slug>/sources/; reach-edu predates it.
- **class `CountingStore`**(`LocalFsStore`) — Counts body reads, so "does this open the file" is an assertion.
  - `__init__(self, root) -> None`
  - `read(self, key: str) -> bytes`
- `test_meta_derives_count_and_domains_without_reading_any_file(tmp_path: Path) -> None` — Reading all 845 sources to answer this took 20.6s cold against R2, which is what a window stuck on 'Starting the backend…' actually was.
- `test_an_unsearched_page_reads_only_that_page(tmp_path: Path) -> None`
- `test_a_search_still_reads_everything_because_it_has_to(tmp_path: Path) -> None`
- `test_filtering_by_domain_is_independent_of_the_storage_layout(tmp_path: Path) -> None` — Two layouts exist in the wild and a domain name belongs to neither.
- `test_a_domain_filter_ending_in_a_slash_widens_instead_of_emptying(tmp_path: Path) -> None` — `funders/` is a legal filter value, not a malformed one.

### Adding a link tests

`tests/test_capture.py` · 396 lines

Checks turning a link into a source file, the excerpt, and that broken links are still recorded.

**Interface**

- **class `FakeFetcher`** — Returns a scripted `FetchResult`, and records what it was asked for.
  - `__init__(self, result: FetchResult) -> None`
  - `fetch(self, url: str, full: bool=False) -> FetchResult`
- `store(tmp_path: Path) -> LocalFsStore`
- `test_add_writes_a_source_file_under_its_domain(store: LocalFsStore) -> None`
- `test_no_domain_lands_in_the_inbox(store: LocalFsStore) -> None` — The inbox is capture-first staging, and the richest bucket.
- `test_origin_and_fetched_at_are_recorded(store: LocalFsStore) -> None`
- `test_a_bare_add_stores_metadata_only(store: LocalFsStore) -> None` — Grounding cost is spent on survivors, never on candidates.
- `test_fetch_pulls_the_full_body(store: LocalFsStore) -> None`
- `test_excerpt_is_capped(store: LocalFsStore) -> None`
- `test_a_duplicate_normalised_url_writes_nothing(store: LocalFsStore) -> None`
- `test_normalized_url_is_canonical_while_url_is_verbatim(store: LocalFsStore) -> None`
- `test_a_name_collision_from_a_different_url_gets_a_suffix(store: LocalFsStore) -> None`
- `test_an_unreachable_url_still_produces_a_file(store: LocalFsStore) -> None` — A source that 404s is how you learn a citation rotted.
- `test_capture_never_writes_an_analyst_verdict(store: LocalFsStore) -> None` — Reachability is not approval — permanently, on every path.
- `test_a_pdf_is_filed_into_bin_and_pointed_at_not_copied_beside(store: LocalFsStore, tmp_path: Path) -> None`
- `test_the_same_pdf_in_two_domains_is_one_object(store: LocalFsStore, tmp_path: Path) -> None`
- `test_a_failed_pdf_download_is_still_recorded(store: LocalFsStore) -> None` — Absence cannot distinguish 'never tried' from 'tried and got a 403'.
- `test_jina_preamble_is_separated_from_the_body() -> None` — The preamble is blank-line separated, so 'stop at the first blank' finds only the title — the bug that put 'URL Source: …' in the first excerpt.
- `test_excerpt_skips_navigation_chrome() -> None` — An excerpt reading 'Skip to main content' teaches analysts to ignore excerpts.
- `test_a_new_source_states_its_own_status(store: LocalFsStore) -> None` — A fresh file omitting `status: candidate` is not stating its lifecycle.
- `test_the_excerpt_never_repeats_the_title() -> None` — Seen across reach-edu, and visible the moment results were rendered under the search box: every card read
- constants: `NOW`, `TODAY`, `JINA_RESPONSE`

### Capture from the app tests

`tests/test_capture_api.py` · 118 lines

Checks adding a link through the local server, including refusal when writing is off.

**Interface**

- **class `FakeFetcher`**
  - `__init__(self, result: FetchResult) -> None`
  - `fetch(self, url: str, full: bool=False) -> FetchResult`
- `client(tmp_path: Path, writable: bool) -> TestClient`
- `test_posting_a_url_creates_a_source(tmp_path: Path) -> None`
- `test_a_read_only_server_refuses_and_writes_nothing(tmp_path: Path) -> None` — The first target this surface ever had was a client corpus.
- `test_a_duplicate_reports_the_existing_path(tmp_path: Path) -> None`
- `test_meta_reports_whether_capture_is_enabled(tmp_path: Path) -> None` — So the page never offers an action that will fail.
- `test_a_failed_fetch_still_creates_and_reports(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None`
- `test_filing_into_a_new_domain_is_not_an_error(tmp_path: Path) -> None`
- constants: `OK`

### Change list tests

`tests/test_feed.py` · 411 lines

Checks change records, reading git history and both ways of showing changes.

**Interface**

- `repo(tmp_path: Path) -> Path`
- **class `FakeChangeSource`**(`ChangeSource`) — An in-memory source, so `FEED-14` has a second implementation to run the same suite against without inventing a whole backend.
  - `__init__(self, changes: list[Change]) -> None`
  - `changes(self, prefix: str='', limit: int=20) -> ChangePage`
- `test_a_change_carries_identity_authorship_and_four_path_lists(repo: Path) -> None`
- `test_counts_and_bytes_are_derived_from_the_path_lists(repo: Path) -> None`
- `test_the_lossless_header_splits_into_verb_scope_and_sentence(subject: str, verb: str, scope: str | None, sentence: str) -> None`
- `test_a_subject_outside_the_convention_becomes_the_whole_sentence() -> None`
- `test_a_commit_touching_nothing_under_the_prefix_is_absent_entirely(repo: Path) -> None`
- `test_a_straddling_commit_carries_only_the_paths_inside_the_prefix(repo: Path) -> None`
- `test_commits_authored_in_another_timezone_come_back_as_utc(repo: Path) -> None`
- `test_changes_are_ordered_newest_first(repo: Path) -> None`
- `test_binaries_appear_alongside_markdown(repo: Path) -> None`
- `test_a_moved_file_is_a_rename_not_a_delete_plus_an_add(repo: Path) -> None`
- `test_a_modified_file_is_changed_and_neither_added_nor_removed(repo: Path) -> None`
- `test_a_capped_page_returns_the_limit_and_says_it_was_capped(repo: Path) -> None`
- `test_a_long_path_list_states_how_many_it_omitted(repo: Path) -> None`
- `test_a_change_with_no_usable_reason_renders_without_one_and_invents_nothing(repo: Path) -> None`
- `test_json_round_trips_the_record_and_rendering_writes_nothing(repo: Path) -> None`
- `test_every_change_source_satisfies_the_same_contract(build, tmp_path: Path) -> None`

### Topic focus tests

`tests/test_focus.py` · 454 lines

Checks that focusing on a topic orders sources by it without hiding others.

**Interface**

- `store(tmp_path: Path) -> LocalFsStore` — Three strategy sources, one topic source, and two untagged funder sources.
- `test_the_tag_is_searchable_text(store: LocalFsStore) -> None` — The needle must exist ONLY in the tag.
- `test_focusing_narrows_the_listing(store: LocalFsStore) -> None` — Only the focus's sources come back, newest first.
- `test_a_narrowed_list_says_what_it_is_a_subset_of(store: LocalFsStore) -> None` — "2 in Workforce Development · 7 in the corpus" — never just "2 sources".
- `test_the_narrowed_page_is_newest_first(store: LocalFsStore) -> None` — Two untagged sources are the NEWEST in the fixture, so a narrowing that leaked would put them first and be caught here rather than looking plausible.
- `test_without_a_focus_nothing_changes(store: LocalFsStore) -> None` — Newest first, as before — the feature is additive.
- `test_a_source_tagged_outside_its_folder_is_found_once_indexed(store: LocalFsStore) -> None` — **Inverted 2026-08-23.** This test used to assert the miss.
- `test_the_type_vocabulary_is_read_from_the_corpus_not_assumed(tmp_path: Path) -> None` — No rule maps a tag to a folder, so the corpus is asked.
- `test_a_nested_or_unfamiliar_type_focuses_like_any_other(tmp_path: Path) -> None` — The whole point of reading the vocabulary: `thesis` works with no code change.
- `test_a_shorter_chain_reaches_everything_beneath_it(tmp_path: Path) -> None` — The cascade is invoked, not stored.
- `test_the_match_is_on_the_separator_never_the_string(tmp_path: Path) -> None` — `strategy` must not match `strategy-two:…`.
- `test_a_tag_is_never_a_scope(tmp_path: Path) -> None` — Two fields, two conventions, and only one of them is a scope.
- constants: `WRAPPER`, `FOCUS`

### Header tests

`tests/test_header_chrome.py` · 78 lines

Checks the workspace details the local server gives the app header.

**Interface**

- `test_a_display_name_is_derived_from_the_slug() -> None` — `display_name` used to default to the slug, which is how the header came to read `reach-edu (reach-edu)` — a slug printed twice.
- `test_a_configured_name_beats_the_derived_one() -> None` — No rule turns `ncad-forge` into `NCAD-Forge`.
- `test_meta_hands_over_fields_not_a_rendered_label(tmp_path) -> None` — A server that pre-renders a label has made a layout decision for the client and taken away the only thing the client is for. The header wants the name in the trigger and the slug in the dropdown; only the client knows that.
- `test_meta_still_answers_without_a_workspace(tmp_path) -> None` — A local `--local <dir>` run has no workspace. It must still paint.

### Catalogue tests

`tests/test_index.py` · 445 lines

Checks building and reading the source catalogue.

**Interface**

- **class `CountingStore`**(`LocalFsStore`) — Counts body reads, so "does this open the file" is an assertion.
  - `__init__(self, root) -> None`
  - `read(self, key: str) -> bytes`
- `store(tmp_path: Path) -> CountingStore` — Six sources, one of them tagged into a strategy it does not live under.
- `test_an_indexed_search_reads_only_the_manifest(store: CountingStore) -> None` — The measured claim: 845 reads become one.
- `test_an_indexed_page_load_reads_only_the_manifest(store: CountingStore) -> None`
- `test_a_damaged_file_is_indexed_with_its_error(store: CountingStore) -> None` — The ImmuneCo rule, carried into the index.
- `test_indexed_and_unindexed_listings_are_identical(store: CountingStore) -> None` — Every field, both modes.
- `test_the_stored_excerpt_is_the_one_a_direct_read_computes(store: CountingStore) -> None` — reach-edu's 845 files carry no `excerpt:` — they predate the field — so a listing falls back to the body and search matches THAT. Storing anything else would silently change what search finds the day a corpus got indexed.
- `test_capture_updates_one_entry_and_reads_no_source(store: CountingStore) -> None` — A capture that triggered a rebuild would cost more than the index saves.
- `test_keys_the_manifest_has_never_seen_are_read_and_reported(store: CountingStore) -> None` — Drift repairs itself incrementally: five captures behind costs five reads.
- `test_a_key_removed_from_the_store_leaves_the_listing(store: CountingStore) -> None`
- `test_an_edit_in_place_is_the_case_a_key_comparison_cannot_see(store: CountingStore) -> None` — The named limit, asserted rather than hoped about.
- `test_an_unindexed_corpus_behaves_exactly_as_before(store: CountingStore) -> None` — No manifest is a real answer, not an error. Whether a corpus is indexed stays an explicit `reindex`, so nothing that has never been indexed changes.
- `test_binary_presence_is_a_fact_about_this_machine(tmp_path: Path) -> None` — The manifest is shared; a download is not.
- `test_nothing_derived_is_a_source_or_appears_in_the_tree(store: CountingStore) -> None` — The blueprint's test is not "is this internal?" but "does this level tell the reader anything?" A derived cache does not.
- `test_rebuilding_an_unchanged_corpus_is_byte_identical(store: CountingStore) -> None` — Which is why the manifest carries no timestamp.
- `test_a_damaged_line_costs_one_source_not_the_manifest(store: CountingStore) -> None`
- `test_an_empty_corpus_round_trips(tmp_path: Path) -> None`
- constants: `WRAPPER`, `BODY`

### Spec checklist tests

`tests/test_loop_harness.py` · 104 lines

Checks the logic that matches spec requirements to tests.

**Interface**

- `test_marked_test_binds_to_its_id_with_its_outcome() -> None`
- `test_active_ids_are_parsed_from_the_tests_table(tmp_path: Path) -> None`
- `test_struck_ids_are_retired_not_active(tmp_path: Path) -> None`
- `test_unclaimed_id_is_missing() -> None`
- `test_worst_outcome_wins_across_tests_claiming_one_id() -> None` — One failing claimant makes the ID red, however many others pass.
- `test_tests_section_ends_at_the_next_heading(tmp_path: Path) -> None`

### Real corpus round-trip tests

`tests/test_proving_corpus.py` · 58 lines

Saves and reloads the real test corpus through storage to prove nothing changes.

**Interface**

- `test_proving_corpus_round_trips_byte_identical(tmp_path: Path) -> None` — Every file in, every file out, same bytes, same count.
- constants: `CORPUS_ENV`

### Real corpus reading tests

`tests/test_proving_corpus_parse.py` · 60 lines

Reads every real source file in the test corpus to prove none fail to parse.

**Interface**

- `test_every_real_markdown_file_parses() -> None` — Every file, no exceptions swallowed, failures named rather than counted.
- constants: `CORPUS_ENV`

### Search index tests

`tests/test_ranked_search.py` · 237 lines

Checks building and storing the search index.

**Interface**

- `store(tmp_path: Path) -> LocalFsStore`
- `test_building_the_index_writes_only_derived_keys(store: LocalFsStore) -> None` — A search index that could modify a source would be a browse tool with a hidden write path — the exact accident `--writable` exists to prevent.
- `test_a_rebuild_leaves_no_orphans_behind(store: LocalFsStore) -> None` — Pagefind chunks its index by content, so a rebuild after a deletion can produce fewer files than the last one. Anything left over is a chunk the runtime would happily fetch and read as current.
- `test_a_rebuild_resends_only_what_is_not_content_addressed(store: LocalFsStore) -> None` — Measured on an 845-source corpus: the bundle is 866 objects, because Pagefind writes one fragment per record. Rewriting all of them on every rebuild is ~1,700 operations against a client's bucket for a corpus that may have gained a single source.
- `test_the_bundle_records_the_manifest_it_was_built_from(store: LocalFsStore) -> None` — A content fingerprint, not a clock: reindexing an unchanged corpus must not make every bundle look stale.
- `test_no_node_is_a_skip_with_a_reason_not_a_failure(store: LocalFsStore, monkeypatch: pytest.MonkeyPatch) -> None` — `scripts/check.sh` already skips its Node rungs rather than failing, so the Python side stays runnable on a machine that has never built the frontend. Reindexing does the same — and the manifest, which is what the listing actually depends on, is still written.
- `test_a_build_that_runs_and_fails_is_not_a_skip(store: LocalFsStore, monkeypatch: pytest.MonkeyPatch) -> None` — The two must not be confused. A skip means "nothing tried"; a failure means "tried, and the index is not there" — and only one of them should ever be quiet.
- `test_the_sidecar_serves_the_bundle_with_usable_content_types(store: LocalFsStore) -> None` — The WebAssembly module is the one that matters: a browser refuses to stream-compile anything not served as `application/wasm`, and Pagefind's fallback is slower and quieter about it.
- `test_a_path_escaping_the_bundle_is_refused(store: LocalFsStore) -> None`
- `test_reindex_is_writable_only(store: LocalFsStore) -> None` — Gated exactly like capture: it reads every source and writes into the corpus, and the first thing this surface was ever pointed at was a client corpus on the RED list.
- constants: `SOURCE`

### Server PDF and changes tests

`tests/test_sidecar_binaries_and_feed.py` · 191 lines

Checks the local server serving stored PDFs and the change list.

**Interface**

- `wired(tmp_path: Path) -> tuple[TestClient, BinStore, str]` — A store holding one source whose binary is really in `bin/`.
- `test_a_row_reports_its_binary_key_and_whether_the_bytes_are_here(wired: tuple[TestClient, BinStore, str]) -> None`
- `test_the_change_feed_is_served_as_the_same_records_the_cli_renders(wired: tuple[TestClient, BinStore, str], tmp_path: Path) -> None`
- `test_a_path_that_is_not_a_repository_is_a_client_error_not_a_crash(wired: tuple[TestClient, BinStore, str], tmp_path: Path) -> None`
- `test_fetching_a_binary_works_on_a_read_only_server_and_writes_only_the_cache(wired: tuple[TestClient, BinStore, str]) -> None`
- `test_a_key_outside_bin_is_refused(wired: tuple[TestClient, BinStore, str], key: str) -> None`
- `test_an_older_binary_asset_spelling_still_reports_a_size(tmp_path: Path) -> None` — reach-edu carries at least three `binary_asset` shapes. Uploaded PDFs use `bytes`/`original_bytes`/`compressed`; fetched ones use `size_bytes`. A row that renders 0 B because it met the wrong synonym is a bug the reader sees.
- constants: `PDF`, `WRAPPER`

### Source file tests

`tests/test_source_file_model.py` · 347 lines

Checks reading and writing source files and their header fields.

**Interface**

- `test_a_fully_populated_source_round_trips() -> None`
- `test_unknown_frontmatter_keys_survive() -> None` — An older reader must never delete a newer writer's fields.
- `test_fetched_at_and_published_at_stay_distinct() -> None`
- `test_status_and_content_pulled_are_independent() -> None` — Promoted with nothing fetched yet is a real, expressible state.
- `test_frontmatter_keys_follow_field_order() -> None` — Fixed order so a diff shows what changed, not a reshuffle.
- `test_machine_verdict_never_becomes_an_analyst_verdict() -> None` — Reachability is not approval. 34 sources once said otherwise.
- `test_extracts_body_survives_a_rewrite_byte_identical() -> None`
- `test_a_failed_download_is_recorded_not_omitted() -> None`
- `test_url_only_frontmatter_is_valid() -> None`
- `test_sensitivity_survives_a_caller_that_never_mentions_it() -> None` — The exact 2026-08-08 failure: eight sources silently downgraded.
- `test_stranded_frontmatter_raises_rather_than_hiding() -> None` — ImmuneCo, 2026-07-14: 13 of 93 sources invisible for three weeks.
- `test_a_horizontal_rule_in_the_body_is_not_stranded_content() -> None` — Prose legitimately contains `---`. Only orphaned key: value lines count.
- `test_a_file_with_no_frontmatter_parses_as_all_body() -> None`
- `test_slugify(raw: str, expected: str) -> None`
- `test_filename_is_date_underscore_slug() -> None`
- `test_untitled_falls_back_to_the_url_not_to_untitled() -> None`
- `test_collisions_gain_a_numeric_suffix_and_binaries_share_the_stem() -> None`
- `test_cosmetic_url_differences_collapse_to_one_key() -> None`
- `test_meaningful_query_parameters_are_not_collapsed() -> None` — Over-collapsing loses evidence — two articles becoming one source.
- `test_generation_a_aliases_populate_the_canonical_fields() -> None` — 637 of 845 real files use `exact_url`. A reader blind to it is blind.
- `test_aliases_are_re_emitted_under_their_original_key() -> None` — Reading a file is not consent to migrate its schema.
- `test_plain_markdown_does_not_acquire_frontmatter_on_rewrite() -> None` — A corpus directory holds READMEs and notes too. Do not graft onto them.
- `test_parsing_then_rendering_does_not_accrete_defaults() -> None` — `status: candidate` on a file that said `inbox_status: discarded` is an assertion the file never made.

### Storage tests

`tests/test_storage_seam.py` · 341 lines

Checks every storage option behaves the same.

**Interface**

- `store(request: pytest.FixtureRequest, tmp_path: Path)` — One conformance run per backend.
- `test_written_bytes_read_back_identical(store: CorpusStore) -> None`
- `test_reading_a_missing_key_raises(store: CorpusStore) -> None` — Never empty bytes. A silent empty read is how a corrupt corpus looks fine.
- `test_exists_flips_on_write(store: CorpusStore) -> None`
- `test_list_filters_by_prefix_and_sorts(store: CorpusStore) -> None`
- `test_list_is_recursive_and_returns_full_keys(store: CorpusStore) -> None` — Not a directory listing — one level down or ten, you get the whole key.
- `test_delete_removes_the_key(store: CorpusStore) -> None`
- `test_stat_reports_size_and_a_content_sensitive_hash(store: CorpusStore) -> None`
- `test_overwrite_replaces_without_error(store: CorpusStore) -> None`
- `test_non_utf8_binary_round_trips(store: CorpusStore) -> None` — PDFs ride alongside their markdown as citable artifacts. Not hypothetical.
- `test_non_ascii_and_spaced_keys_round_trip(store: CorpusStore) -> None`
- `test_every_concrete_backend_is_covered_by_the_conformance_fixture() -> None` — Adding a backend without adding it to BACKENDS fails here.
- **class `CountingStore`**(`LocalFsStore`) — A `LocalFsStore` that records how often the backing read was reached.
  - `__init__(self, root: Path) -> None`
  - `read(self, key: str) -> bytes`
- `test_repeat_read_does_not_reach_the_backing_store(tmp_path: Path) -> None`
- `test_write_through_the_cache_invalidates_it(tmp_path: Path) -> None` — A stale cache must never win.
- `test_static_resolver_returns_its_configured_workspace() -> None`
- `test_workspace_carries_its_own_storage_location() -> None` — The bucket is a fact on the record, not a derivation.
- `test_a_new_workspace_gets_the_default_bucket_convention() -> None` — The derivation survives, but only for buckets nobody has made yet.
- `test_store_prefix_is_transparent_above_the_seam(tmp_path: Path) -> None` — A prefixed store behaves exactly like an unprefixed one to its caller.
- `test_r2store_has_no_default_bucket() -> None` — No call site may carry a literal bucket name.
- constants: `BACKENDS`, `TEST_BUCKET`, `LIVE`, `PARAMS`

### Folder tree tests

`tests/test_tree.py` · 198 lines

Checks building the folder tree from file names.

**Interface**

- `find(nodes: list, path: str)` — Depth-first lookup by path, so assertions can name a node directly.
- `test_nesting_follows_the_key_structure() -> None`
- `test_a_folder_counts_every_file_beneath_it_not_its_children() -> None` — `funders/` has two immediate children and three files under it.
- `test_folders_sort_before_files_and_each_group_alphabetically() -> None`
- `test_a_files_path_is_its_key_and_a_folders_path_ends_in_a_slash() -> None`
- `test_a_key_with_no_slash_is_a_root_level_file() -> None`
- `test_an_empty_corpus_yields_an_empty_tree() -> None`
- `test_the_content_addressed_store_is_shown_not_hidden() -> None` — `bin/` holds 92 PDFs under names no one can read.
- **class `CountingStore`**(`LocalFsStore`) — A store that remembers how many file bodies were opened.
  - `read(self, key: str) -> bytes`
- `test_painting_the_tree_reads_no_file_bodies(tmp_path: Path) -> None` — The promise measured in the only terms that survive a faster laptop.
- `test_the_content_addressed_fan_out_is_collapsed_but_the_key_is_not() -> None` — `bin/` shards by the first two hex characters so one directory never holds thousands of entries. Drawn literally that is 55 folders called `00`, `05`, `09` holding one file each — and since `bin` sorts before `live`, it is the first thing anyone sees. The level is a storage optimisation, not information.
- constants: `KEYS`

## How to re-take this mirror

Don't edit this page from memory. When the code changes, re-take it:

1. Refresh the floorplan (ask an agent to "update the floorplan"), which re-reads
   only what changed and updates `floorplan/descriptions/*.json`.
2. Regenerate the interfaces from source: every Python signature here is read
   with `ast`, not typed. TypeScript, Svelte and Rust surfaces are read from
   their `export` lines, `Props` interfaces and `fn` definitions.
3. Bump `date_mirrored` and the commit in the header.

Taken at commit `3a3021e` on `development`.
