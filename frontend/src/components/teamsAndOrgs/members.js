import React, { useState, useCallback } from 'react';
import { Link } from '@reach/router';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import AsyncSelect from 'react-select/async';

import messages from './messages';
import { UserAvatar } from '../user/avatar';
import { EditModeControl } from './editMode';
import { Button } from '../button';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';

export function Members({ addMembers, removeMembers, saveMembersFn, members, type }: Object) {
  const token = useSelector(state => state.auth.get('token'));
  const [editMode, setEditMode] = useState(false);
  let roleQueryParam = 'role=ADMIN,PROJECT_MANAGER';
  let selectPlaceHolder = <FormattedMessage {...messages.searchManagers} />;
  let title = <FormattedMessage {...messages.managers} />;
  if (type === 'members') {
    roleQueryParam = '';
    selectPlaceHolder = <FormattedMessage {...messages.searchUsers} />;
    title = <FormattedMessage {...messages.members} />;
  }

  const submitMembers = () => {
    if (saveMembersFn) {
      saveMembersFn();
    }
    setEditMode(false);
  };
  const promiseOptions = inputValue =>
    new Promise(resolve => {
      setTimeout(async () => {
        const result = await fetchLocalJSONAPI(
          `users/?username=${inputValue}&${roleQueryParam}`,
          token,
        );
        resolve(result.users);
      }, 1000);
    });

  return (
    <>
      <div className={`bg-white b--grey-light pa4 ${editMode ? 'bt bl br' : 'ba'}`}>
        <div className="cf db">
          <h3 className="f3 blue-dark mt0 fw6 fl">{title}</h3>
          <EditModeControl editMode={editMode} switchModeFn={setEditMode} />
        </div>
        <div className="cf mb1">
          {editMode && (
            <AsyncSelect
              isMulti
              cacheOptions
              defaultOptions
              placeholder={selectPlaceHolder}
              isClearable={false}
              getOptionLabel={option => option.username}
              getOptionValue={option => option.username}
              loadOptions={promiseOptions}
              onChange={values => addMembers(values || [])}
              className="z-2"
            />
          )}
        </div>
        <div className="cf db mt3">
          {members.map((user, n) => (
            <UserAvatar
              key={n}
              username={user.username}
              picture={user.pictureUrl}
              size="large"
              colorClasses="white bg-blue-grey"
              removeFn={members.length > 1 && removeMembers}
              editMode={members.length > 1 && editMode}
            />
          ))}
        </div>
      </div>
      {editMode && (
        <div className="cf pt0">
          <div className="w-70-l w-50 fl tr dib bg-grey-light">
            <Button className="blue-dark bg-grey-light h3" onClick={() => setEditMode(false)}>
              <FormattedMessage {...messages.cancel} />
            </Button>
          </div>
          <div className="w-30-l w-50 fr dib">
            <Button className="white bg-red h3 w-100" onClick={() => submitMembers()}>
              <FormattedMessage {...messages.done} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function JoinRequests({ requests, teamId, addMembers, updateRequests }: Object) {
  const token = useSelector(state => state.auth.get('token'));

  const acceptRejectRequest = useCallback(
    (user, action) => {
      const payload = JSON.stringify({
        username: user.username,
        role: 'MEMBER',
        type: 'join-response',
        action: action,
      });
      pushToLocalJSONAPI(`teams/${teamId}/actions/join/`, payload, token, 'PATCH').then(res => {
        if (action === 'accept') {
          addMembers([user]);
        }
        updateRequests(requests.filter(i => i.username !== user.username));
      });
    },
    [teamId, requests, updateRequests, addMembers, token],
  );

  return (
    <div className="bg-white b--grey-light pa4 ba blue-dark">
      <div className="cf db">
        <h3 className="f3 blue-dark mt0 fw6 fl">
          <FormattedMessage {...messages.joinRequests} />
        </h3>
      </div>
      <div className="cf db mt3">
        {requests.map((user, n) => (
          <div className="cf db pt2" key={n}>
            <div className="fl pt1">
              <UserAvatar
                username={user.username}
                picture={user.pictureUrl}
                colorClasses="white bg-blue-grey"
              />
              <Link to={`/users/${user.username}`} className="v-mid link blue-dark">
                <span>{user.username}</span>
              </Link>
            </div>
            <div className="fr">
              <Button
                className="pr2 blue-dark bg-white"
                onClick={() => acceptRejectRequest(user, 'reject')}
              >
                <FormattedMessage {...messages.reject} />
              </Button>
              <Button
                className="pr2 bg-red white"
                onClick={() => acceptRejectRequest(user, 'accept')}
              >
                <FormattedMessage {...messages.accept} />
              </Button>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="tc">
            <FormattedMessage {...messages.noRequests} />
          </div>
        )}
      </div>
    </div>
  );
}
