---
name: nlq
description: "Find each unanswered NLQ (Next Logical Question), the question a context-less reader asks right after a sentence, and rewrite so the sentence itself or the very next one answers it in concrete terms. Use when reviewing a draft a reader follows in order (reply, PR body, doc, README), or when the user asks: 'NLQ', 'next logical question', '다음 질문', '흐름 체크', '글 흐름 봐줘', 'does this flow', 'what will the reader ask next'."
---

# NLQ: Next Logical Question

An unanswered NLQ (Next Logical Question) marks a spot where a reader would have to guess. Treat it as a clarity defect, not a prompt to defend the wording. Check the text being worked on, or your last reply when none is named.

1. Name each sentence's NLQ: the question a context-less reader asks right after that sentence (usually about a word they can't picture or a skipped step). Start with the question the reader opens the text with; in long text, check headings and paragraph leads first.
2. Mark **PASS** when the sentence itself or the very next one answers it in concrete terms, otherwise **FAIL**.
3. Rewrite each FAIL so the sentence itself or the very next one answers it, using facts from the conversation or repo; mark "needs answer" when none exist. Swapping in a synonym doesn't count.
4. Re-check the rewritten sentences. Done when every row passes or is marked.

Show the ledger (sentence, NLQ, PASS/FAIL) before the rewrite, so the user can contest an NLQ.
