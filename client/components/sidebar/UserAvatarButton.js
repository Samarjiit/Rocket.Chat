import React from 'react';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';

import { useUser } from '../../contexts/UserContext';
import { popover, modal, AccountBox } from '../../../app/ui-utils';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { UserStatus } from '../basic/UserStatus';
import { userStatus } from '../../../app/user-status';
import { callbacks } from '../../../app/callbacks';
import UserAvatar from '../basic/avatar/UserAvatar';

const setStatus = (status, statusText) => {
	AccountBox.setStatus(status, statusText);
	callbacks.run('userStatusManuallySet', status);
	popover.close();
};

const onClick = (e, t, allowAnonymousRead) => {
	if (!(Meteor.userId() == null && allowAnonymousRead)) {
		const user = Meteor.user();
		const STATUS_MAP = [
			'offline',
			'online',
			'away',
			'busy',
		];
		const userStatusList = Object.keys(userStatus.list).map((key) => {
			const status = userStatus.list[key];
			const name = status.localizeName ? t(status.name) : status.name;
			const modifier = status.statusType || user.status;
			const defaultStatus = STATUS_MAP.includes(status.id);
			const statusText = defaultStatus ? null : name;

			return {
				icon: 'circle',
				name,
				modifier,
				action: () => setStatus(status.statusType, statusText),
			};
		});

		const statusText = user.statusText || t(user.status);

		userStatusList.push({
			icon: 'edit',
			name: t('Edit_Status'),
			type: 'open',
			action: (e) => {
				e.preventDefault();
				modal.open({
					title: t('Edit_Status'),
					content: 'editStatus',
					data: {
						onSave() {
							modal.close();
						},
					},
					modalClass: 'modal',
					showConfirmButton: false,
					showCancelButton: false,
					confirmOnEnter: false,
				});
			},
		});

		const config = {
			popoverClass: 'sidebar-header',
			columns: [
				{
					groups: [
						{
							title: user.name,
							items: [{
								icon: 'circle',
								name: statusText,
								modifier: user.status,
							}],
						},
						{
							title: t('User'),
							items: userStatusList,
						},
						{
							items: [
								{
									icon: 'user',
									name: t('My_Account'),
									type: 'open',
									id: 'account',
									action: () => {
										FlowRouter.go('account');
										popover.close();
									},
								},
								{
									icon: 'sign-out',
									name: t('Logout'),
									type: 'open',
									id: 'logout',
									action: () => {
										Meteor.logout(() => {
											callbacks.run('afterLogoutCleanUp', user);
											Meteor.call('logoutCleanUp', user);
											FlowRouter.go('home');
											popover.close();
										});
									},
								},
							],
						},
					],
				},
			],
			currentTarget: e.currentTarget,
			offsetVertical: e.currentTarget.clientHeight + 10,
		};

		popover.open(config);
	}
};

const LoggedUserAvatarButton = React.memo(({ user }) => {
	const t = useTranslation();

	const {
		status,
		username,
		avatarETag,
	} = user;

	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	const handleClick = useMutableCallback((e) => onClick(e, t, allowAnonymousRead));

	return <Box position='relative' onClick={handleClick} className={css`cursor: pointer;`}>
		<UserAvatar size='x24' username={username} etag={avatarETag}/>
		<Box className={css`bottom: 0; right: 0;`} position='absolute' p='x2' bg='neutral-200' borderRadius='full' mie='neg-x2' mbe='neg-x2'>
			<UserStatus status={status} size='x8'/>
		</Box>
	</Box>;
});

const AnonymousUserAvatarButton = () => <Box position='relative'>
	<UserAvatar size='x24' username={'Anonymous'}/>
	<Box className={css`bottom: 0; right: 0;`} position='absolute' p='x2' bg='neutral-200' borderRadius='full' mie='neg-x2' mbe='neg-x2'>
		<UserStatus status='online' size='x8'/>
	</Box>
</Box>;

export default function({ user }) { return user ? <LoggedUserAvatarButton user={user} /> : <AnonymousUserAvatarButton />; }
