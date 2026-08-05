/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { RefCallback, useCallback, useRef } from 'react';

const RECHECK_INTERVAL_MS = 100;
const MAX_CHECKS = 20;
// Consecutive quiet samples required to declare the layout settled: a single quiet interval can
// just be a lull between two async shifts (a transition ending, then a fetch response inserting
// rows), two in a row make that much less likely.
const QUIET_SAMPLES_TO_SETTLE = 2;

/**
 * Returns a callback ref that, once its element is attached to the DOM, waits for the surrounding
 * layout to settle and then scrolls the element into view (centered).
 *
 * Scrolling to an element that appears asynchronously (deep link at load, search, breadcrumb…)
 * cannot be done from a state-driven effect: the element may enter the DOM ticks after the state
 * that caused it is applied (e.g. MUI group transitions mount their children later), so no React
 * state change signals "the element now exists".
 *
 * @param isScrollTarget whether the element owning the ref is the one to scroll to
 * @param onScrolled called after the scroll has been issued
 */
export function useScrollIntoViewRef(isScrollTarget: boolean, onScrolled?: () => void): RefCallback<HTMLElement> {
    const pendingScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    return useCallback(
        (element: HTMLElement | null) => {
            clearTimeout(pendingScrollTimeoutRef.current);
            if (!element || !isScrollTarget) {
                return;
            }
            // The nearest ancestor that actually scrolls. Not needed to scroll — scrollIntoView finds its own —
            // but as the frame of reference for the position below: measured within that ancestor's content, the
            // position is invariant under scrolling, so a manual user scroll doesn't read as the layout moving.
            let scrollParent: HTMLElement | null = element.parentElement;
            while (scrollParent && !/auto|scroll/.test(getComputedStyle(scrollParent).overflowY)) {
                scrollParent = scrollParent.parentElement;
            }
            const contentPosition = () => {
                const { top } = element.getBoundingClientRect();
                return scrollParent
                    ? {
                          top: top - scrollParent.getBoundingClientRect().top + scrollParent.scrollTop,
                          scrollHeight: scrollParent.scrollHeight,
                      }
                    : { top, scrollHeight: 0 };
            };
            /* Why wait: transitions and pending fetches are still moving things, so a scroll issued now would aim at
               a stale position — and a smooth animation cannot track a moving target: restarting it stutters, fixing
               it afterwards double-jumps. Hence sample until the position holds still (or the budget runs out), then
               scroll once. setTimeout gives the fixed sampling interval — and unlike requestAnimationFrame it
               still fires in a hidden tab. */
            let previous: { top: number; scrollHeight: number } | undefined;
            let quietSamples = 0;
            let remainingChecks = MAX_CHECKS;
            const scrollOnceLayoutSettles = () => {
                if (!element.isConnected) {
                    return; // the element left the DOM; a later ref attachment will retry
                }
                const current = contentPosition();
                if (previous !== undefined) {
                    const quiet = current.top === previous.top && current.scrollHeight === previous.scrollHeight;
                    quietSamples = quiet ? quietSamples + 1 : 0;
                }
                previous = current;
                remainingChecks -= 1;
                if (quietSamples >= QUIET_SAMPLES_TO_SETTLE || remainingChecks <= 0) {
                    element.scrollIntoView({
                        // A smooth scroll is animated by the rendering pipeline, which is paused in
                        // a hidden tab (e.g. a link opened in a background tab): it would never move.
                        behavior: document.visibilityState === 'hidden' ? 'auto' : 'smooth',
                        block: 'center',
                        inline: 'nearest',
                    });
                    onScrolled?.();
                    return;
                }
                pendingScrollTimeoutRef.current = setTimeout(scrollOnceLayoutSettles, RECHECK_INTERVAL_MS);
            };
            scrollOnceLayoutSettles();
        },
        [isScrollTarget, onScrolled]
    );
}
