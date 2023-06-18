// GoogleSignInButton.js (Client Side)
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function GoogleSignInButton() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const clientId = "803137367147-ju4cmttatlrl6q9928mg4bgs3rdo2au3.apps.googleusercontent.com";
    const loginUri = "http://localhost:3000/api/auth";

    // Load the Google's library in your component
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                cancel_on_tap_outside: false,
            });
            window.google.accounts.id.renderButton(
                document.getElementById("Google-Signin"),
                {
                    theme: 'outline',
                    size: 'large',
                    locale: 'en',
                    width: '240px',
                    height: '50px',
                }
            );
            window.google.accounts.id.prompt();
        }
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, []);

    const handleCredentialResponse = (response) => {
        console.log('Credential Response:', response);
        setIsLoggedIn(true);
        // Send token to your server here
        axios.post('/api/auth', {
            token: response.credential
        }).then(res => {
            // You can save the user data here
            console.log(res.data);
        }).catch(err => {
            setIsLoggedIn(false);
            // Handle error here
            console.error(err);
        });
    };

    return (
        <div id="Google-Signin" />
    );
}

export default GoogleSignInButton;
