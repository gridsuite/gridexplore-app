import { useSelector } from 'react-redux';
import React, {
    useRef,
    useEffect,
    useCallback,
    useState,
    MutableRefObject,
} from 'react';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { fetchElementsInfos } from '../utils/rest-api';
import { UUID } from 'crypto';
import { AgGridReact } from 'ag-grid-react';
import { IElement, IElementMetadata, ReduxState } from '../redux/reducer.type';

type useDirectoryContentReturnType = [
    data: IElement[],
    childrenMetadata: Record<UUID, IElementMetadata>
];
export const useDirectoryContent = (
    gridRef: MutableRefObject<AgGridReact>,
    setIsMissingDataAfterDirChange: React.Dispatch<
        React.SetStateAction<boolean>
    >
): useDirectoryContentReturnType => {
    const currentChildren = useSelector(
        (state: ReduxState) => state.currentChildren
    );
    const [childrenMetadata, setChildrenMetadata] = useState({});
    const { snackError } = useSnackMessage();

    const [data, setData] = useState(currentChildren);
    const previousData = useRef<IElement[]>();
    previousData.current = currentChildren;

    const handleError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    useEffect(() => {
        if (!currentChildren?.length) {
            setChildrenMetadata({});
            setIsMissingDataAfterDirChange(false);
            return;
        }

        let metadata: Record<UUID, IElementMetadata> = {};
        let childrenToFetchElementsInfos = Object.values(currentChildren)
            .filter((e) => !e.uploading)
            .map((e) => e.elementUuid);
        if (childrenToFetchElementsInfos.length > 0) {
            fetchElementsInfos(childrenToFetchElementsInfos)
                .then((res) => {
                    res.forEach((e: IElementMetadata) => {
                        metadata[e.elementUuid] = e;
                    });
                })
                .catch((error) => {
                    if (
                        previousData.current &&
                        Object.keys(previousData.current).length === 0
                    ) {
                        handleError(error.message);
                    }
                })
                .finally(() => {
                    // discarding request for older directory
                    if (previousData.current === currentChildren) {
                        setChildrenMetadata(metadata);
                        setIsMissingDataAfterDirChange(false);
                    }
                });
        }
    }, [handleError, currentChildren, setIsMissingDataAfterDirChange]);

    useEffect(() => {
        setData(currentChildren);
    }, [currentChildren, gridRef]);

    return [data, childrenMetadata];
};
