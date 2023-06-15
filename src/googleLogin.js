// GoogleSignInButton.js (Client Side)

import React, { useState } from 'react';
import { GoogleLogin } from 'react-google-login';
import axios from 'axios';

function GoogleSignInButton() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const clientId = "803137367147-ju4cmttatlrl6q9928mg4bgs3rdo2au3.apps.googleusercontent.com";

    const handleLoginSuccess = (response) => {
        console.log("Login Success", response);
        setIsLoggedIn(true);
        // Send token to your server here
        axios.post('/api/auth', {
            token: response.tokenId
        }).then(res => {
            // You can save the user data here
            console.log(res.data);
        }).catch(err => {
            // Handle error here
            console.error(err);
        });
    };

    const handleLoginFailure = (response) => {
        console.log("Login Failure", response);
        setIsLoggedIn(false);
    };

    return (
        <GoogleLogin
            clientId={clientId}
            onSuccess={handleLoginSuccess}
            onFailure={handleLoginFailure}
            cookiePolicy={"single_host_origin"}
            render={(renderProps) => (
                <button
                    className="Google-Signin"
                    onClick={renderProps.onClick}
                    disabled={renderProps.disabled}
                >
                    <img
                        src="/google.png"
                        alt="Google Logo"
                        className="google-logo"
                    />
                    {isLoggedIn ? "Logout" : "Login with Google"}
                </button>
            )}
        />
    );
}

export default GoogleSignInButton;
