import React, { useState, useEffect } from 'react';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';

interface AuthPageProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
    onGoogleAuth?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ isOpen, onClose, initialMode = 'login', onGoogleAuth }) => {
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [prefilledEmail, setPrefilledEmail] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsSignUp(initialMode === 'signup');
            setSignupSuccess(false);
            setPrefilledEmail('');
        }
    }, [isOpen, initialMode]);

    const handleSignUpSuccess = (email: string) => {
        setPrefilledEmail(email);
        setSignupSuccess(true);
        setIsSignUp(false);
    };

    if (!isOpen) return null;

    return (
        <>
            {isSignUp ? (
                <SignUp
                    isOpen={isOpen}
                    onClose={onClose}
                    onToggleMode={() => setIsSignUp(false)}
                    onGoogleAuth={onGoogleAuth}
                    onSuccess={handleSignUpSuccess}
                />
            ) : (
                <SignIn
                    isOpen={isOpen}
                    onClose={onClose}
                    onToggleMode={() => setIsSignUp(true)}
                    onGoogleAuth={onGoogleAuth}
                    initialEmail={prefilledEmail}
                    showSuccessMessage={signupSuccess}
                />
            )}
        </>
    );
};
