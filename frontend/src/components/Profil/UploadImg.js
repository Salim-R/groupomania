import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadPicture } from '../../actions/user.actions';

const UploadImg = () => {

    const [file, setFile] = useState();
    const dispatch = useDispatch();
    const UserData = useSelector((state) => state.userReducer);
    const handlePicture = (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', UserData.pseudo);
        data.append('userId', UserData._id);
        data.append('file', file);
        dispatch(uploadPicture(data, UserData._id));
    }
    return (
        <form action="" onSubmit={handlePicture} className='upload-pic'>
            <label htmlFor="file">Changer d'image</label>
            <input type="file" id='file' name='file' accept='.jpg, .jpeg, .png'
                onChange={(e) => setFile(e.target.files[0])} />
            <br />
            <input type="submit" value='Envoyer' />
        </form>
    );
};

export default UploadImg;