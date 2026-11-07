---
name: recall-learnings
description: "Review what the user learned earlier by recalling before revealing: each takeaway is quizzed from a spaced-review log, graded against the takeaway and its caveat, and rescheduled. Also saves takeaways (each with its caveat) at the end of a learning session, catches up a day's learnings from past Claude Code sessions, or quizzes from any source the user points at. Use when: '복습하자', '어제 배운 거', '배운 거 저장해줘', '이거 기억해둬', '퀴즈 내줘', 'review what I learned', 'what did I learn yesterday', 'quiz me on this', 'save takeaways', 'spaced review'."
---

# Recall Learnings

Make learnings stick by retrieving them, not rereading them. Every review has the user recall a takeaway before seeing it, gives a hint before the answer, follows each recall with feedback, and spaces each takeaway out by how well it was recalled. The evidence behind each move is at the end.

## Leading words

- **Takeaway:** one sentence that changes what the user does or predicts. Trivia and records of what was done are not takeaways.
- **Caveat:** where the takeaway stops being true, stated separately, so recalling the takeaway alone earns a ~.
- **Title:** names the topic, never the claim, and is unique in the log: "Free-fall acceleration", not "Mass doesn't change fall speed".
- **Recall:** the user's answer from memory, written before anything is revealed.
- **Hint:** a nudge toward the missing piece that still leaves the user to produce it.
- **Due:** a takeaway whose review date has arrived.

## The log

`~/.claude/learnings.md` (`$CLAUDE_CONFIG_DIR/learnings.md` when that variable is set), created on the first write. One entry per takeaway; the heading line carries the title, the due date, and the run of grades:

```markdown
## Free-fall acceleration · due 2026-11-09 · ✓
- takeaway: Every object falls with the same acceleration, whatever its mass.
- caveat: Only where air resistance is negligible; a flat sheet of paper falls slower than the same sheet crumpled.
- source: rebuild-mental-model session, 2026-11-05
- added: 2026-11-05
```

- `grep -n '^## ' <log>` lists every entry's title, due date, and grades.
- Fetch entries with the Read tool (offset and limit from the grep), not Bash, so their text stays out of visible command output before a recall.
- Change the log only by appending entries (`cat >> <log>`) and by one-line Edits of a heading; leave the rest of the file as it is.
- Write entries in the language the user's instructions set for written notes; otherwise in the conversation's language.

**Grades:** ✓ the takeaway and its caveat, without a hint. ~ everything right only after the hint, the takeaway without its caveat, or the gist with a wrong detail. ✗ the takeaway still missing or wrong after the hint, or a skipped cue.

**Scheduling:** an entry saved without a review is due the next day, with no grades yet. After a ✓, count the consecutive ✓ at the end of its grades, including this one: 1 → due in 3 days, 2 → 7, 3 → 14, 4 → 30, 5 or more → 60. After ~ or ✗, it is due tomorrow. The user may tune the intervals; keep them expanding.

## Save takeaways

For the end of a learning session, "save takeaways", "이거 기억해둬", or a recap block from another skill.

1. Extract takeaways from the conversation or the named source, each with a caveat and a source (including any citations the source gives). Mark a caveat the source doesn't state as inferred, and keep any inference label the source attached to a claim.
2. Show them as a numbered list; the user keeps, edits, or drops each. Seeing them now is fine: the first review is a day away.
3. Check titles against the log. On a clash, show both entries; the user replaces the old one (grades reset, due tomorrow) or retitles the new one.
4. Append the kept entries.

Done when the log holds the kept entries; report how many and when the first is due.

A `rebuild-mental-model` recap maps as: the rebuilt model and each rule become takeaways, its Exceptions line supplies caveats for the rules it covers, and its Sources go into `source`.

## Review

For "복습하자", "review", "quiz me", or a named day, topic, or source already in the log.

1. **Select** due entries from the grep index, oldest due first, or the entries matching what the user named; then read them and interleave sources so entries from one session don't answer each other. Take up to 5 and say how many more are due. With no log or nothing due, say so, give the next due date, and offer catch-up.
2. **Cue** one entry per turn with a fresh question or small case built from it, from a new angle each time: explain it, predict a case, find where it breaks, apply it to the user's own work. Every cue is answerable from the stored takeaway and caveat alone and uses none of their wording. End the turn.
3. **Hint** once when the recall misses the takeaway or its caveat, including a blank or "I don't know". End the turn for a second try.
4. **Reveal and grade:** show the stored takeaway and caveat, name what matched, what was missing, and why it matters, and give the grade. Record it at once with a one-line Edit of the heading (new due date, grade appended), so a review stopped halfway keeps its progress. Put the next cue in the same message.
5. **Close** with a summary table: entry, grade, next due.

- A skipped cue moves the review on. "Just show me" ends recall: the remaining selected entries appear as a plain summary and keep their grades and due dates, since nothing was recalled.
- A grade the user overrides replaces today's grade rather than adding one; then repeat the pending cue.
- When a recall suggests the stored entry is wrong, change it only on evidence (its source, a citation, or a check the user runs), then grade against the corrected entry.

## Catch up from past sessions

For "what did I learn yesterday?" or a requested day with no entries in the log. The script reads Claude Code sessions only; other tools keep their own transcripts.

1. Dispatch one subagent per day. Give it the script's absolute path (`scripts/sessions.py` under this skill's base directory), the date, and the titles already in the log. Brief it to run `python3 <path> <YYYY-MM-DD> > <scratch file>`, read that file to the end (a busy day runs to hundreds of thousands of characters), and return candidates as `title | takeaway | caveat | source (project · session title · date)`. Candidates are what the user learned: concepts explained to them, their misconceptions corrected, reasoning they can reuse. It skips task chatter, titles already in the log, review sessions from this skill, and anything resembling credentials, tokens, or personal data. Titles name the topic, never the claim.
2. Show the user only the candidate titles, grouped by session, and let them pick. The bodies stay out of the chat because the user is about to recall them.
3. Run Review steps 2 to 5 on the first 5 picks. At each reveal, append that entry with its grade and the due date it earned, instead of editing a heading. At close, append any further picks with no grades, due tomorrow.

When the script reports no session activity, give both causes (no Claude Code sessions that day, or transcripts already deleted: Claude Code removes them after 30 days by default, via `cleanupPeriodDays`) and offer Any source. Run the script for any requested day; the user's retention setting may be longer.

Done when every pick is in the log, or the user picks none.

## Any source

For "quiz me on this" with a file, a folder, a URL, or pasted text. Read the source and extract titled takeaways with caveats, keeping them out of the chat. Run Review steps 2 to 5 on them with grades kept in chat, then offer to save: each saved entry carries today's grade and the due date it earned.

## When to skip

The user wants to understand something new, or suspects their understanding is wrong: that's `rebuild-mental-model`.

## Evidence

- **Recall first, spaced:** practice testing and distributed practice topped Dunlosky et al., "Improving Students' Learning With Effective Learning Techniques" (*Psychological Science in the Public Interest*, 2013), and still lead its re-analysis in Donoghue and Hattie, "A Meta-Analysis of Ten Learning Techniques" (*Frontiers in Education*, 2021).
- **Feedback after every recall:** Yang et al., "Testing (Quizzing) Boosts Classroom Learning: A Systematic and Meta-Analytic Review" (*Psychological Bulletin*, 2021), lists corrective feedback among the effect's moderators.
- **Hints before answers:** in Bastani et al., "Generative AI Without Guardrails Can Harm Learning: Evidence from High School Mathematics" (*PNAS*, 2025), students given an unrestricted chatbot scored worse once it was gone, while a tutor limited to incremental hints avoided the drop.
