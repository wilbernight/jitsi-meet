import { FlagGroupContext } from '@atlaskit/flag/flag-group';
import { AtlasKitThemeProvider } from '@atlaskit/theme';
import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { IState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import { hideNotification } from '../../actions';
import { areThereNotifications } from '../../functions';

// @ts-ignore
import Notification from './Notification';

interface Props extends WithTranslation {

    /**
     * Whether we are a SIP gateway or not.
     */
    _iAmSipGateway: boolean;

    /**
     * Whether or not the chat is open.
     */
    _isChatOpen: boolean;

    /**
     * The notifications to be displayed, with the first index being the
     * notification at the top and the rest shown below it in order.
     */
    _notifications: Array<{
        props: Object;
        uid: number;
    }>;

    /**
     * JSS classes object.
     */
    classes: any;

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: Function;

    /**
     * Whether or not the notifications are displayed in a portal.
     */
    portal?: boolean;
}

const useStyles = (theme: Theme) => {
    return {
        container: {
            position: 'absolute' as const,
            left: '16px',
            bottom: '90px',
            width: '400px',
            maxWidth: '100%',
            zIndex: 600
        },

        containerPortal: {
            maxWidth: 'calc(100% - 32px)'
        },

        transitionGroup: {
            '& > *': {
                marginBottom: '20px',
                borderRadius: '6px!important', // !important used to overwrite atlaskit style
                position: 'relative'
            },

            '& div > span > svg > path': {
                fill: 'inherit'
            },

            '& div > span, & div > p': {
                color: theme.palette.field01
            },

            '& div.message > span': {
                color: theme.palette.link01Active
            },

            '& .ribbon': {
                width: '4px',
                height: 'calc(100% - 16px)',
                position: 'absolute',
                left: 0,
                top: '8px',
                borderRadius: '4px',

                '&.normal': {
                    backgroundColor: theme.palette.link01Active
                },

                '&.error': {
                    backgroundColor: theme.palette.iconError
                },

                '&.success': {
                    backgroundColor: theme.palette.success01
                },

                '&.warning': {
                    backgroundColor: theme.palette.warning01
                }
            }
        }
    };
};

/**
 * Implements a React {@link Component} which displays notifications and handles
 * automatic dismissal after a notification is shown for a defined timeout
 * period.
 *
 * @augments {Component}
 */
class NotificationsContainer extends Component<Props> {
    _api: Object;
    _timeouts: Map<string, number>;

    /**
     * Initializes a new {@code NotificationsContainer} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._timeouts = new Map();

        // Bind event handlers so they are only bound once for every instance.
        this._onDismissed = this._onDismissed.bind(this);

        // HACK ALERT! We are rendering AtlasKit Flag elements outside of a FlagGroup container.
        // In order to hook-up the dismiss action we'll a fake context provider,
        // just like FlagGroup does.
        this._api = {
            onDismissed: this._onDismissed,
            dismissAllowed: () => true
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (this.props._iAmSipGateway) {
            return null;
        }

        return (
            <AtlasKitThemeProvider mode = 'light'>
                {/* @ts-ignore */}
                <FlagGroupContext.Provider value = { this._api }>
                    <div
                        className = { clsx(this.props.classes.container, {
                            [this.props.classes.containerPortal]: this.props.portal
                        }) }
                        id = 'notifications-container'>
                        <TransitionGroup className = { this.props.classes.transitionGroup }>
                            {this._renderFlags()}
                        </TransitionGroup>
                    </div>
                </FlagGroupContext.Provider>
            </AtlasKitThemeProvider>
        );
    }

    /**
     * Emits an action to remove the notification from the redux store so it
     * stops displaying.
     *
     * @param {string} uid - The id of the notification to be removed.
     * @private
     * @returns {void}
     */
    _onDismissed(uid: string) {
        const timeout = this._timeouts.get(`${uid}`);

        if (timeout) {
            clearTimeout(timeout);
            this._timeouts.delete(`${uid}`);
        }

        this.props.dispatch(hideNotification(uid));
    }

    /**
     * Renders notifications to display as ReactElements. An empty array will
     * be returned if notifications are disabled.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderFlags() {
        const { _notifications } = this.props;

        return _notifications.map(notification => {
            const { props, uid } = notification;

            // The id attribute is necessary as {@code FlagGroup} looks for
            // either id or key to set a key on notifications, but accessing
            // props.key will cause React to print an error.
            return (
                <CSSTransition
                    appear = { true }
                    classNames = 'notification'
                    in = { true }
                    key = { uid }
                    timeout = { 200 }>
                    <Notification
                        { ...props }
                        id = { uid }
                        onDismissed = { this._onDismissed }
                        uid = { uid } />
                </CSSTransition>
            );
        });
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IState) {
    const { notifications } = state['features/notifications'];
    const { iAmSipGateway } = state['features/base/config'];
    const { isOpen: isChatOpen } = state['features/chat'];
    const _visible = areThereNotifications(state);

    return {
        _iAmSipGateway: Boolean(iAmSipGateway),
        _isChatOpen: isChatOpen,
        _notifications: _visible ? notifications : []
    };
}

export default translate(connect(_mapStateToProps)(withStyles(useStyles)(NotificationsContainer)));
