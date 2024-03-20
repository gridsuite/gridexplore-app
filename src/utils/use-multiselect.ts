/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to deal with list of checkboxes
 * @param elementIds list of all ids used for selection, whether they are selected or not
 * for "handleShiftAndCtrlClick" to work, this list needs to be sorted in the same order as it is displayed
 */
export const useMultiselect = (elementIds: string[]) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    // used for shift clicking selection, stores last clicked element for selection
    const [lastSelectedElementId, setLastSelectedElementId] = useState<
        string | null
    >(null);

    const clearSelection = () => {
        setSelectedIds([]);
    };

    useEffect(() => {
        clearSelection();
        setLastSelectedElementId(null);
    }, [elementIds]);

    /**
     * toggle selection for one element
     * @param elementId id of element to toggle
     * @param forceState if defined, it will force element state instead of toggling (false -> unselect element ; true -> select element)
     */
    const toggleSelection = useCallback(
        (elementToToggleId: string) => {
            let element = elementIds?.find((id) => id === elementToToggleId);
            if (element === undefined) {
                return;
            }

            selectedIds.indexOf(elementToToggleId);
            const elementToToggleIdIndex =
                selectedIds.indexOf(elementToToggleId);
            // if element to toggle is not selected, we select it
            if (elementToToggleIdIndex < 0) {
                selectedIds.push(elementToToggleId);
            } else {
                selectedIds.splice(elementToToggleIdIndex, 1);
            }

            setSelectedIds([...selectedIds]);
            setLastSelectedElementId(elementToToggleId);
        },
        [selectedIds, elementIds]
    );

    const addElementsToSelection = useCallback(
        (elementsToSelectIds: string[]) => {
            elementsToSelectIds
                .filter(
                    (elementToSelectId) =>
                        !selectedIds.includes(elementToSelectId)
                )
                .forEach((elementToSelectId) => {
                    selectedIds.push(elementToSelectId);
                });
            setSelectedIds([...selectedIds]);
        },
        [selectedIds]
    );

    const removeElementsFromSelection = useCallback(
        (elementsToUnselectIds: string[]) =>
            setSelectedIds([
                ...selectedIds.filter(
                    (id) => !elementsToUnselectIds.includes(id)
                ),
            ]),
        [selectedIds]
    );

    const handleShiftClick = useCallback(
        (clickedElementId: string) => {
            // remove text selection due to shift clicking
            window.getSelection()?.empty();

            // sorted list of displayed elements
            const lastSelectedIdIndex = lastSelectedElementId
                ? elementIds.indexOf(lastSelectedElementId)
                : -1;
            const clickedElementIdIndex = elementIds.indexOf(clickedElementId);

            // if no lastSelectedId is found (first click, or unknown id), we only toggle clicked element
            if (lastSelectedIdIndex < 0) {
                toggleSelection(clickedElementId);
                return;
            }

            // list of elements between lastClickedElement and clickedElement, both included
            const elementsToToggle = elementIds.slice(
                Math.min(lastSelectedIdIndex, clickedElementIdIndex),
                Math.max(lastSelectedIdIndex, clickedElementIdIndex) + 1
            );

            if (selectedIds.includes(clickedElementId)) {
                // if clicked element is checked, we unchecked all elements between last clicked element and clicked element
                removeElementsFromSelection(elementsToToggle);
            } else {
                // if clicked element is unchecked, we check all elements between last clicked element and clicked element
                addElementsToSelection(elementsToToggle);
            }
            setLastSelectedElementId(clickedElementId);
        },
        [
            elementIds,
            lastSelectedElementId,
            selectedIds,
            addElementsToSelection,
            removeElementsFromSelection,
            toggleSelection,
        ]
    );

    const handleShiftAndCtrlClick = (
        clickEvent: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        clickedElementId: string
    ) => {
        if (clickEvent.shiftKey) {
            // if row is clicked while shift is pressed, range of rows selection is toggled, depending on clicked element state
            handleShiftClick(clickedElementId);
            // nothing else happens, hence the return
            return;
        }

        if (clickEvent.ctrlKey) {
            // if row is clicked while ctrl is pressed, row selection is toggled
            toggleSelection(clickedElementId);
            // nothing else happens, hence the return
            return;
        }
    };

    /**
     * toggle selection for all element depending on current selectedIds
     * @param elementsToSelectIds if defined, it will toggle only elementsToSelectIds instead of all elementIds
     * @param forceSelectedIds if true, it will set selection to elementsToSelectIds/elementIds without checking current selectedIds
     */
    function toggleSelectAll() {
        if (selectedIds.length === 0) {
            setSelectedIds(elementIds);
        } else {
            setSelectedIds([]);
        }
    }

    return {
        selectedIds,
        toggleSelection,
        toggleSelectAll,
        clearSelection,
        handleShiftAndCtrlClick,
    };
};
