import { getFileIcon } from '@gridsuite/commons-ui';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';

const styles = {
    icon: (theme) => ({
        marginRight: theme.spacing(2),
        width: '18px',
        height: '18px',
    }),
    grid: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
    },
    grid2: (theme) => ({
        marginRight: theme.spacing(2),
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        color: 'grey',
    }),
};

function HighlightedText({ text, highlight }) {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} style={{ fontWeight: 'bold' }}>
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
}

function SearchItem({ matchingElement, inputValue, ...othersProps }) {
    return (
        <li {...othersProps}>
            <>
                <span>{getFileIcon(matchingElement.type, styles.icon)}</span>
                <Grid container>
                    <Grid item xs={11} sx={styles.grid}>
                        <HighlightedText
                            text={matchingElement.name}
                            highlight={inputValue}
                        />
                    </Grid>
                    <Grid item sx={styles.grid2}>
                        <Typography>
                            <FormattedMessage id="path" />
                            {matchingElement.pathName?.join(' / ')}
                        </Typography>
                    </Grid>
                </Grid>
            </>
        </li>
    );
}

export default SearchItem;
