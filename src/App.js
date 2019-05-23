import Amplify from 'aws-amplify';
import awsmobile from './aws-exports';
import {VerifyContact,SignIn,TOTPSetup,ConfirmSignUp,withAuthenticator} from 'aws-amplify-react';
import React from "react";

Amplify.configure(awsmobile);

const App = () => (
    <div>{`Hello world!`}</div>
);

export default withAuthenticator(App, {
    includeGreetings: true,
    //authenticatorComponents: [ConfirmSignUp],
    signUpConfig: {
        hiddenDefaults: ["phone_number"]
    }
});
