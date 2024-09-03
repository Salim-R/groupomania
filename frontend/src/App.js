import React, { useEffect, useState } from 'react';
import Routage from '../src/components/Routes/index';
import { UidContext } from './components/AppContext';
import axios from 'axios';
import { useDispatch } from "react-redux";
import { getUser } from './actions/user.actions';
const App = () => {
  const [Uid, setUid] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}jwtid`, { withCredentials: true });
        setUid(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchToken();
    if (Uid) dispatch(getUser(Uid));
  }, [Uid, dispatch]);

  return (
    <UidContext.Provider value={Uid}>
      <Routage />
    </UidContext.Provider>
  );
};

export default App;
