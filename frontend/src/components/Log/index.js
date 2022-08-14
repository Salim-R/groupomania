import React, { useState } from 'react';
import SingUpForm from './SingUpForm';
import SignInForm from './SignInForm'

const Log = (props) => {
    const [signUpModal, setSignUpModal] = useState(props.signup);
    const [signInModal, setSignInModal] = useState(props.signin);

    const handleModals = (e) => {
        if (e.target.id === "register") {
            setSignInModal(false);
            setSignUpModal(true);
        } else if (e.target.id === "login") {
            setSignUpModal(false);
            setSignInModal(true);
        }
    };
    return (
        <div className='connection-form'>
            <div className="form-countainer">
                <ul>
                    <li
                        onClick={handleModals}
                        id="register"
                        className={signUpModal ? "active-btn" : null}
                    >
                        S'inscrire
                    </li>
                    <li
                        onClick={handleModals}
                        id="login"
                        className={signInModal ? "active-btn" : null}
                    >
                        Se connecter
                    </li>
                </ul>
                {signUpModal && <SingUpForm />}
                {signInModal && <SignInForm />}
            </div>
        </div >
    );
};

export default Log;