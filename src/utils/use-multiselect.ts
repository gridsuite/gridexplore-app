import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to deal with list of checkboxes
 * @param elementIds list of all ids used for selection, whether they are selected or not
 * for "handleShiftAndCtrlClick" to work, this list needs to be sorted in the same order as it is displayed
 */
export const useMultiselect = (elementIds: string[]) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    // used for shift clicking selection, stores last clicked element for selection
    const [lastSelectedElementId, setLastSelectedElementId] =
        useState<string>();

    useEffect(() => {
        setSelectedIds(new Set());
        setLastSelectedElementId(undefined);
    }, [elementIds]);

    /**
     * toggle selection for one element
     * @param elementId id of element to toggle
     * @param forceState if defined, it will force element state instead of toggling (false -> unselect element ; true -> select element)
     */
    const toggleSelection = useCallback(
        (elementId: string, forceState?: boolean) => {
            let element = elementIds?.find((id) => id === elementId);
            if (element === undefined) {
                return;
            }
            let newSelection = new Set(selectedIds);

            if (forceState === undefined) {
                if (!newSelection.delete(elementId)) {
                    newSelection.add(elementId);
                }
            } else {
                if (forceState) {
                    newSelection.add(elementId);
                } else {
                    newSelection.delete(elementId);
                }
            }
            setSelectedIds(newSelection);
            setLastSelectedElementId(elementId);
        },
        [selectedIds, elementIds]
    );

    const selectElements = useCallback(
        (elementToSelectIds: string[]) => {
            const newSelection = new Set(selectedIds);

            elementToSelectIds.forEach((elementToSelectId) => {
                let element = elementIds?.find(
                    (id) => id === elementToSelectId
                );
                if (element !== undefined) {
                    newSelection.add(elementToSelectId);
                }
            });
            setSelectedIds(newSelection);
        },
        [selectedIds, elementIds]
    );

    const unselectElements = useCallback(
        (elementsToUnselectIds: string[]) => {
            const newSelection = new Set(selectedIds);

            elementsToUnselectIds.forEach((id) => {
                newSelection.delete(id);
            });
            setSelectedIds(newSelection);
        },
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

            if (selectedIds.has(clickedElementId)) {
                // if clicked element is checked, we unchecked all elements between last clicked element and clicked element
                unselectElements(elementsToToggle);
            } else {
                // if clicked element is unchecked, we check all elements between last clicked element and clicked element
                selectElements(elementsToToggle);
            }
            setLastSelectedElementId(clickedElementId);
        },
        [
            elementIds,
            lastSelectedElementId,
            selectedIds,
            selectElements,
            unselectElements,
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
            // nothing else happens, hence the return right after
            toggleSelection(clickedElementId);
            return;
        }
    };

    /**
     * toggle selection for all element depending on current selectedIds
     * @param elementsToSelectIds if defined, it will toggle only elementsToSelectIds instead of all elementIds
     * @param forceSelectedIds if true, it will set selection to elementsToSelectIds/elementIds without checking current selectedIds
     */
    function toggleSelectAll(
        elementsToSelectIds?: string[],
        forceSelectedIds = false
    ) {
        if (selectedIds.size === 0 || forceSelectedIds) {
            setSelectedIds(new Set(elementsToSelectIds ?? elementIds));
        } else {
            setSelectedIds(new Set());
        }
    }

    return [
        selectedIds,
        toggleSelection,
        toggleSelectAll,
        handleShiftAndCtrlClick,
    ];
};
