import React, { useState } from 'react';
import LeftNav from '../LeftNav';
import { useDispatch, useSelector } from 'react-redux';
import UploadImg from './UploadImg';
import { updateBio } from '../../actions/user.actions';
import { dateParser } from '../Utils';
import FollowHandler from './FollowHandler';
const UptdateProfil = () => {
    const [bio, setBio] = useState("");
    const [updateForm, setUpdateForm] = useState(false);
    const userData = useSelector((state) => state.userReducer);
    const usersData = useSelector((state) => state.usersReducer);
    const error = useSelector((state) => state.errorReducer.userError);
    const dispatch = useDispatch();
    const [followingPopup, setFollowingPopup] = useState(false);
    const [followersPopup, setFollowersPopup] = useState(false);

    const handleUpdate = () => {
        dispatch(updateBio(userData._id, bio));
        setUpdateForm(false);
    }
    return (
        <div className="profil-container">
            <LeftNav />
            <h1>Profil de {userData.pseudo}</h1>
            <div className="update-container">
                <div className="left-part">
                    <h3>photo de profil</h3>
                    <img src={userData.picture} alt='user-pic' />
                    <UploadImg />
                    <p>{error.format}</p>
                    <p>{error.maxSize}</p>
                </div>
                <div className="right-part">
                    <div className="bio-update">
                        <h3>Bio</h3>
                        {updateForm === false && (
                            <>
                                <p onClick={() => setUpdateForm(!updateForm)}>{userData.bio}</p>
                                <button onClick={() => setUpdateForm(!updateForm)}>Modifier bio</button>
                            </>
                        )}
                        {updateForm && (
                            <>
                                <textarea type='text' defaultValue={userData.bio} onChange={(e) => setBio(e.target.value)}></textarea>
                                <button onClick={handleUpdate}>Valider modifications</button>
                            </>
                        )}
                    </div>
                    <h4>Membre depuis le : {dateParser(userData.createdAt)}</h4>
                    <h5 onClick={() => setFollowingPopup(true)}>Abonnement : {userData.following ? userData.following.length : ""}</h5>
                    <h5 onClick={() => setFollowersPopup(true)}>Abonnés : {userData.followers ? userData.followers.length : ""}</h5>
                </div>
            </div>
            {followingPopup && ( // si jamais il est sur true
                <div className="popup-profil-container">
                    <div className="modal">
                        <h3>Abonnements</h3>
                        <span className='cross' onClick={() => setFollowingPopup(false)}>&#10005;</span>
                        <ul>

                            {React.Children.toArray(usersData.map((user) =>
                                userData.following.find(
                                    (followers) => followers === user._id,
                                ) ? (
                                    <li key={user._id}>
                                        <img
                                            src={user.picture}
                                            alt="user-pic"
                                        />
                                        <h4>{user.pseudo}</h4>
                                        <div className="follow-handler">
                                            <FollowHandler idToFollow={user._id} type={'suggestion'} />
                                        </div>
                                    </li>
                                ) : (
                                    <></>
                                ),
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            {followersPopup && ( // si jamais il est sur true
                <div className="popup-profil-container">
                    <div className="modal">
                        <h3>Abonné</h3>
                        <span className='cross' onClick={() => setFollowersPopup(false)}>&#10005;</span>
                        <ul>
                            {React.Children.toArray(usersData.map((user) =>
                                userData.followers.find(
                                    (following) => following === user._id,
                                ) ? (
                                    <li key={user._id}>
                                        <img
                                            src={user.picture}
                                            alt="user-pic"
                                        />
                                        <h4>{user.pseudo}</h4>
                                        <div className="follow-handler">
                                            <FollowHandler idToFollow={user._id} type={'suggestion'} />
                                        </div>
                                    </li>
                                ) : (
                                    <></>
                                ),
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div >
    );
};

export default UptdateProfil;