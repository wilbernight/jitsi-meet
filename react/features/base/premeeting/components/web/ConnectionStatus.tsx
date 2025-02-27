import { Theme } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { IState } from '../../../../app/types';
import { translate } from '../../../i18n/functions';
import Icon from '../../../icons/components/Icon';
import { IconArrowDownSmall, IconWifi1Bar, IconWifi2Bars, IconWifi3Bars } from '../../../icons/svg';
import { connect } from '../../../redux/functions';
import { PREJOIN_DEFAULT_CONTENT_WIDTH } from '../../../ui/components/variables';
import { CONNECTION_TYPE } from '../../constants';
import { getConnectionData } from '../../functions';

interface Props extends WithTranslation {

    /**
     * List of strings with details about the connection.
     */
    connectionDetails: string[];

    /**
     * The type of the connection. Can be: 'none', 'poor', 'nonOptimal' or 'good'.
     */
    connectionType: string;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        connectionStatus: {
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            letterSpacing: '0.16px',
            lineHeight: '16px',
            position: 'absolute',
            width: '100%',

            [theme.breakpoints.down(400)]: {
                margin: 0,
                width: '100%'
            },

            '@media (max-width: 720px)': {
                margin: `${theme.spacing(4)} auto`,
                position: 'fixed',
                top: 0,
                width: PREJOIN_DEFAULT_CONTENT_WIDTH
            },

            // mobile phone landscape
            '@media (max-height: 420px)': {
                display: 'none'
            },

            '& .con-status-header': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                alignItems: 'center',
                display: 'flex',
                padding: '14px 16px'
            },

            '& .con-status-circle': {
                borderRadius: '50%',
                display: 'inline-block',
                padding: theme.spacing(1),
                marginRight: theme.spacing(3)
            },

            '& .con-status--good': {
                background: '#31B76A'
            },

            '& .con-status--poor': {
                background: '#E12D2D'
            },

            '& .con-status--non-optimal': {
                background: '#E39623'
            },

            '& .con-status-arrow': {
                marginLeft: 'auto',
                transition: 'background-color 0.16s ease-out'
            },

            '& .con-status-arrow--up': {
                transform: 'rotate(180deg)'
            },

            '& .con-status-arrow > svg': {
                cursor: 'pointer'
            },

            '& .con-status-arrow:hover': {
                backgroundColor: 'rgba(1, 1, 1, 0.1)'
            },

            '& .con-status-text': {
                textAlign: 'center'
            },

            '& .con-status-details': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderTop: '1px solid #5E6D7A',
                padding: theme.spacing(3),
                transition: 'opacity 0.16s ease-out'
            },

            '& .con-status-details-visible': {
                opacity: 1
            },

            '& .con-status-details-hidden': {
                opacity: 0
            }
        }
    };
});

const CONNECTION_TYPE_MAP: {
    [key: string]: {
        connectionClass: string;
        connectionText: string;
        icon: Function;
    };
} = {
    [CONNECTION_TYPE.POOR]: {
        connectionClass: 'con-status--poor',
        icon: IconWifi1Bar,
        connectionText: 'prejoin.connection.poor'
    },
    [CONNECTION_TYPE.NON_OPTIMAL]: {
        connectionClass: 'con-status--non-optimal',
        icon: IconWifi2Bars,
        connectionText: 'prejoin.connection.nonOptimal'
    },
    [CONNECTION_TYPE.GOOD]: {
        connectionClass: 'con-status--good',
        icon: IconWifi3Bars,
        connectionText: 'prejoin.connection.good'
    }
};

/**
 * Component displaying information related to the connection & audio/video quality.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
function ConnectionStatus({ connectionDetails, t, connectionType }: Props) {
    const { classes } = useStyles();

    const [ showDetails, toggleDetails ] = useState(false);
    const arrowClassName = showDetails
        ? 'con-status-arrow con-status-arrow--up'
        : 'con-status-arrow';
    const detailsText = connectionDetails.map(d => t(d)).join(' ');
    const detailsClassName = showDetails
        ? 'con-status-details-visible'
        : 'con-status-details-hidden';

    const onToggleDetails = useCallback(e => {
        e.preventDefault();
        toggleDetails(!showDetails);
    }, [ showDetails, toggleDetails ]);

    const onKeyPressToggleDetails = useCallback(e => {
        if (toggleDetails && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            toggleDetails(!showDetails);
        }
    }, [ showDetails, toggleDetails ]);

    if (connectionType === CONNECTION_TYPE.NONE) {
        return null;
    }

    const { connectionClass, icon, connectionText } = CONNECTION_TYPE_MAP[connectionType];

    return (
        <div className = { classes.connectionStatus }>
            <div
                aria-level = { 1 }
                className = 'con-status-header'
                role = 'heading'>
                <div className = { `con-status-circle ${connectionClass}` }>
                    <Icon
                        size = { 16 }
                        src = { icon } />
                </div>
                <span
                    aria-hidden = { !showDetails }
                    className = 'con-status-text'
                    id = 'connection-status-description'>{t(connectionText)}</span>
                <Icon
                    ariaDescribedBy = 'connection-status-description'
                    ariaPressed = { showDetails }
                    className = { arrowClassName }
                    onClick = { onToggleDetails }
                    onKeyPress = { onKeyPressToggleDetails }
                    role = 'button'
                    size = { 24 }
                    src = { IconArrowDownSmall }
                    tabIndex = { 0 } />
            </div>
            <div
                aria-level = { 2 }
                className = { `con-status-details ${detailsClassName}` }
                role = 'heading'>
                {detailsText}</div>
        </div>
    );
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IState): Object {
    const { connectionDetails, connectionType } = getConnectionData(state);

    return {
        connectionDetails,
        connectionType
    };
}

export default translate(connect(mapStateToProps)(ConnectionStatus));
