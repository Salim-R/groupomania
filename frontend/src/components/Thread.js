import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPosts } from "../actions/post.actions";
import Card from "./Post/Card";
import { isEmpty } from "./Utils";

const Thread = () => {
    const [loadPost, setLoadPost] = useState(true); //si jamais l'autre post et sur true tu me l'affiche pour pas qu'il pop 2fois
    const [count, setCount] = useState(5);
    const dispatch = useDispatch(); //envoyer une action
    const posts = useSelector((state) => state.postReducer); // récuper les donées d'un store

    const loadMore = () => {
        if (window.innerHeight + document.documentElement.scrollTop + 1 > document.scrollingElement.scrollHeight) {
            setLoadPost(true);
        }
    }

    useEffect(() => {
        if (loadPost) {
            dispatch(getPosts(count));
            setLoadPost(false);// pour ne plus relancer l'action 
            setCount(count + 5);
        }

        window.addEventListener('scroll', loadMore);
        return () => window.removeEventListener('scroll', loadMore);
    }, [loadPost, dispatch, count]); // a chaque fois que quelque chose évolue

    return (
        <div className="thread-container">
            <ul>
                {!isEmpty(posts[0]) && // si post est true affiche moi la suite
                    posts.map((post) => {
                        return <Card post={post} key={post._id} />; //map tt les posts jusq'a qu'il n'y est plus d'id
                    })}
            </ul>
        </div>
    );
};

export default Thread;