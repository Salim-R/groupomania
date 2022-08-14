import React, { useEffect, useContext, useState } from 'react';
import { UidContext } from '../AppContext';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { useDispatch } from "react-redux";
import { likePost, unlikePost } from "../../actions/post.actions"
const LikeButton = ({ post }) => {
    const [liked, setLiked] = useState(false);
    const Uid = useContext(UidContext);
    const dispatch = useDispatch();

    const like = () => {
        dispatch(likePost(post._id, Uid))
        setLiked(true);
    };

    const unlike = () => {
        dispatch(unlikePost(post._id, Uid))
        setLiked(false);
    };

    useEffect(() => {
        if (post.likers.includes(Uid)) setLiked(true);
        else setLiked(false);
    }, [Uid, post.likers, liked]);

    return (
        <div className="like-container">
            {Uid === null && (
                <Popup
                    trigger={<img src="./img/icons/heart.svg" alt="like" />}
                    position={["bottom center", "bottom right", "bottom left"]}
                    closeOnDocumentClick
                >
                    <div>Connectez-vous pour aimer un post !</div>
                </Popup>
            )}
            {Uid && liked === false && (
                <img src="./img/icons/heart.svg" onClick={like} alt="like" />
            )}
            {Uid && liked && (
                <img src="./img/icons/heart-filled.svg" onClick={unlike} alt="unlike" />
            )}
            <span>{post.likers.length}</span>
        </div>
    );
};

export default LikeButton;