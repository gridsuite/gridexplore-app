import { useImperativeHandle } from 'react';
import { useWatch } from 'react-hook-form';

const TableCellWrapper = ({ agGridRef, name, ...props }) => {
    const watchValues = useWatch({
        name,
    });

    useImperativeHandle(
        agGridRef,
        () => {
            return {
                getValue: () => {
                    return watchValues;
                },
            };
        },
        [watchValues]
    );

    return <>{props.children}</>;
};

export default TableCellWrapper;
