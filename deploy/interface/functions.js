import { store } from '../store';
import { user_Info, user_Website, user_Name, user_Photo, user_ID } from './settings_state';
import { p_contractorInfo, p_contractorWebsite, p_contractorName, p_contractorPhoto, p_publishContractor } from './public_state';
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
export const _publicProfile = (user) => {
    const articleData = [];
    const contractorRef = firestore
        .collection('contractors')
        .doc(user);
    contractorRef
        .get({ source: 'server' })
        .then((doc) => {
        if (doc.exists) {
            articleData.push(doc.data());
            store.dispatch(user_ID(articleData[0].id));
            store.dispatch(p_publishContractor(articleData[0].publishContractor));
            store.dispatch(p_contractorInfo(articleData[0].contractorInfo));
            store.dispatch(p_contractorWebsite(articleData[0].contractorWebsite));
            store.dispatch(p_contractorName(articleData[0].contractorName));
            store.dispatch(p_contractorPhoto(articleData[0].contractorPhoto));
        }
    }).catch((error) => { console.log("Error getting user data:", error); });
};
export const _privateContractor = (user) => {
    const articleData = [];
    const contractorRef = firestore
        .collection("users")
        .doc(user);
    contractorRef
        .get({ source: 'server' })
        .then((doc) => {
        if (doc.exists) {
            articleData.push(doc.data());
            store.dispatch(user_ID(articleData[0].id));
            store.dispatch(user_Info(articleData[0].contractorInfo));
            store.dispatch(user_Website(articleData[0].contractorWebsite));
            store.dispatch(user_Name(articleData[0].contractorName));
            store.dispatch(user_Photo(articleData[0].contractorPhoto));
        }
    }).catch((error) => { console.log("Error getting user data:", error); });
};
