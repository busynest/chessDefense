import { store } from '../store';
import { user_contract, user_Info, user_Website, user_Name, user_Photo, user_ID } from './settings_state';
import { p_contractorInfo, p_contractorWebsite, p_contractorName, p_contractorPhoto, p_publishContractor } from './public_state';
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
            store.dispatch(user_contract(articleData[0].publishContractor));
            store.dispatch(user_Info(articleData[0].contractorInfo));
            store.dispatch(user_Website(articleData[0].contractorWebsite));
            store.dispatch(user_Name(articleData[0].contractorName));
            store.dispatch(user_Photo(articleData[0].contractorPhoto));
        }
    }).catch((error) => { console.log("Error getting user data:", error); });
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
            .forEach((folderRef) => { console.log('folderRef: ', folderRef); });
        res
            .items
            .forEach((itemRef) => { console.log('itemRef: ', itemRef); });
    }).catch((error) => { console.log("Could not get storage items: ", error); });
};
export const alertEmail = (error) => { console.log('Problem: ' + error); };
export const updateEmail = (email) => {
    const user = firebase
        .auth()
        .currentUser;
    user
        .updateEmail(email.value)
        .then(() => { console.log("Email update successful!"); })
        .catch((error) => { alertEmail(error); console.error('Error writing new message to Firebase Database', error); });
    user
        .sendEmailVerification()
        .then(() => { console.log("Email Verification successful!"); })
        .catch((error) => { alertEmail(error); console.error('Error writing new message to Firebase Database', error); });
};
export const alertPassword = (error) => { console.log("Problem: " + error.messge); };
export const updatePassword = (newPassword) => {
    const user = firebase
        .auth()
        .currentUser;
    user
        .updatePassword(newPassword.value)
        .then(() => { console.log("Password successful!"); })
        .catch((error) => { alertPassword(error); });
};
export const alertDelete = () => {
    deleteUser();
};
export const deleteUser = () => {
    const d = confirm("Delete Account?");
    if (d == true) {
        firebase.auth().currentUser.delete();
    }
};
