export const firebaseUser = () => { return firebase.auth().currentUser; };
export const deleteDoc = (collect, item) => { return firestore.collection(collect).doc(item).delete(); };
export const deleteUser = () => { return firebase.auth().currentUser.delete(); };
export const logOut = () => { return firebase.auth().signOut(); };
export const anonUser = () => { return firebase.auth().isAnonymous; };
export const googleSignIn = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    firebase
        .auth()
        .signInWithRedirect(provider);
    firebase
        .auth()
        .getRedirectResult()
        .then((result) => {
        if (result.credential) {
            const token = result.credential.accessToken;
            console.log("Google Token", token);
        }
    }).catch((error) => { console.log('Sign in error: ', error); });
};
export const _listImages = () => {
    const storageRef = firebase
        .storage()
        .ref();
    const listRef = storageRef
        .child('images/');
    listRef
        .listAll()
        .then((res) => {
        console.log('res:', res);
        res
            .prefixes
            .forEach((folderRef) => {
            console.log('folderRef: ', folderRef);
        });
        res
            .items
            .forEach((itemRef) => {
            console.log('itemRef: ', itemRef);
        });
    }).catch((error) => { console.log("Could not get storage items: ", error); });
};
export const _restCode = () => {
    let x = document.querySelector('.resetEmail');
    let email = x.value;
    let actionCodeSettings = {
        url: 'https://www.contractorscentre.com',
        handleCodeInApp: true
    };
    firebase
        .auth()
        .sendPasswordResetEmail(email, actionCodeSettings)
        .catch((error) => { console.log(error); });
};
