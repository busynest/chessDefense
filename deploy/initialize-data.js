import { store } from './store';
import { current_User, user_ID, user_Name, user_Email, user_Photo, user_Info, user_Website, accountAnon } from './interface/settings_state';
import { closeDrawer } from './interface/drawer_state';
const _demoData = () => {
    store.dispatch(user_ID('guest'));
    store.dispatch(current_User(false));
    store.dispatch(user_Name('John Doe'));
    store.dispatch(user_Email('email@domain.com'));
    store.dispatch(user_Photo('/images/manifest/logo-48.png'));
};
export const _initializeData = () => {
    const articleData = [];
    return firebase
        .auth()
        .onAuthStateChanged((user) => {
        if (user) {
            store.dispatch(closeDrawer(false));
            store.dispatch(current_User(true));
            store.dispatch(user_ID(user.uid));
            store.dispatch(accountAnon(user.isAnonymous));
            const userDocument = usersCollection.doc(user.uid);
            userDocument
                .get({ source: 'server' })
                .then((doc) => {
                if (doc.exists) {
                    articleData.push(doc.data());
                    console.log('articleData', articleData);
                    store.dispatch(user_ID(articleData[0].userID));
                    store.dispatch(user_Name(articleData[0].contractorName));
                    store.dispatch(user_Photo(articleData[0].contractorPhoto));
                    store.dispatch(user_Info(articleData[0].contractorInfo));
                    store.dispatch(user_Website(articleData[0].contractorWebsite));
                    return articleData;
                }
                else {
                    const newDocument = {
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        userID: user.uid,
                        inital: 'introduction',
                        action: '',
                        lat: '',
                        lng: '',
                        location: window.location.host,
                        timeZone: '',
                        publishContractor: true,
                        displayName: user.displayName,
                        photoURL: '',
                        user_FullName: '',
                        user_Info: '',
                        user_Website: '',
                        user_Photo: user.photoURL,
                        user_Email: user.email,
                        user_Phone: user.phoneNumber
                    };
                    userDocument
                        .set(newDocument);
                    store.dispatch(user_ID(newDocument.userID));
                    store.dispatch(user_Info(newDocument.contractorInfo));
                    store.dispatch(user_Website(newDocument.contractorWebsite));
                    store.dispatch(user_Name(newDocument.contractorName));
                    store.dispatch(user_Photo(newDocument.contractorPhoto));
                    console.log('Initial Search Results: ', articleData[0]);
                    return articleData.push(newDocument);
                }
            }).catch((error) => { console.log("Error getting user data:", error); });
        }
        else {
            _demoData();
            store.dispatch(closeDrawer(false));
        }
    });
};
