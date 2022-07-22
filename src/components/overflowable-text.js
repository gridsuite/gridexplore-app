import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';

const overflowStyle = (theme) => ({
    overflow: {
        display: 'inline-block',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
    },
    tooltip: {
        whiteSpace: 'nowrap',
        width: 'fit-content',
        maxWidth: 'fit-content',
    },
});

const useStyles = makeStyles(overflowStyle);

export const OverflowableText = ({
    text,
    tooltipStyle,
    className,
    children,
    ...props
}) => {
    const element = useRef();
    const classes = useStyles();

    const [overflowed, setOverflowed] = useState(false);

    const checkOverflow = useCallback(() => {
        if (!element.current) return;
        setOverflowed(
            element.current.scrollWidth > element.current.clientWidth
        );
    }, [setOverflowed, element]);

    useEffect(() => {
        checkOverflow();
    }, [checkOverflow, text]);

    return (
        <Tooltip
            title={text || ''}
            disableHoverListener={!overflowed}
            classes={{ tooltip: tooltipStyle ? tooltipStyle : classes.tooltip }}
        >
            <div
                {...props}
                ref={element}
                children={children || text}
                className={clsx(className, classes.overflow)}
            />
        </Tooltip>
    );
};

OverflowableText.propTypes = {
    children: PropTypes.array,
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.node,
    ]),
    tooltipStyle: PropTypes.string,
    className: PropTypes.string,
};

export default OverflowableText;
