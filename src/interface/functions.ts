
import { store } from '../store';

// Contractor Article
import {
  // user_contract,
  user_Info,
  user_Website,
  user_Name,
  user_Photo,
  user_ID
} from './settings_state';

import {
  p_contractorInfo,
  p_contractorWebsite,
  p_contractorName,
  p_contractorPhoto,
  p_publishContractor
} from './public_state';
  
// @ts-ignore - External Resources
export const firebaseUser = () => { return firebase.auth().currentUser ; };
// @ts-ignore
export const deleteDoc    = (collect: any, item: any) => { return firestore.collection(collect).doc(item).delete() };
// @ts-ignore
export const deleteUser   = () => { return firebase.auth().currentUser.delete() };
// @ts-ignore
export const logOut       = () => { return firebase.auth().signOut(); };
// @ts-ignore
export const anonUser     = () => { return firebase.auth().isAnonymous;}
// const storage               = firebase.storage();
// const storageRef            = storage.ref();

export const googleSignIn = () => {

  // @ts-ignore
  const provider:any = new firebase.auth.GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  // provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
/*
  // auth2.grantOfflineAccess().then(signInCallback);
  var signInFlow = 'popup';
  // For iOS full screen apps we use the redirect auth mode.
  if (('standalone' in window.navigator)
      && window.navigator.standalone){
    signInFlow = 'redirect';
  }
*/
  // @ts-ignore
  firebase
    .auth()
    .signInWithRedirect(provider);

  // @ts-ignore 
  firebase
    .auth()
    .getRedirectResult()
    .then( (result: any) => {
    if (result.credential) { /*Access Token to access Google API */
    const token = result.credential.accessToken; console.log("Google Token", token); }
    // The signed-in user info.
    // const firebaseUser = result.firebaseUser;
  }).catch( (error:any) => { console.log('Sign in error: ', error); } );

  // GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);

};


// Reference the total number of existing images
export const _listImages = () => {

    // @ts-ignore -- Reference to project's storage bucket.
    const storageRef:any  = firebase
      .storage()
      .ref();
  
    // Reference to list
    const listRef = storageRef
      .child('images/'); // .child('images/'+this._userID+'/'+);
  
      // Find all the prefixes and items.
      listRef
        .listAll()
        .then( (res:any) => {
  
          console.log('res:', res);
  
          res
            .prefixes
            .forEach( (folderRef:any) => {
              console.log('folderRef: ', folderRef);
             }); // You may call listAll() recursively on them. // All the prefixes under listRef.
  
          res
            .items
            .forEach( (itemRef:any) => {
              console.log('itemRef: ', itemRef);
            });
          
          }).catch( (error:any) => { console.log("Could not get storage items: ", error)});
  }

  
  export const _restCode = () => {
    let x:any = document!.querySelector('.resetEmail')!
    let email = x.value

    let actionCodeSettings = {
      url: 'https://www.contractorscentre.com',
      handleCodeInApp: true
    };

    // @ts-ignore
    firebase
      .auth()
      .sendPasswordResetEmail( email, actionCodeSettings )
      .catch( (error:any) => { console.log(error); } );
  }

// Standalone App
/*
@media all and (display-mode: standalone) {
  /* Here goes the CSS rules that will only apply if app is running standalone 
}

function isRunningStandalone() {
  return (window.matchMedia('(display-mode: standalone)').matches);
}

if (isRunningStandalone()) {
  /* This code will be executed if app is running standalone 
}
*/


// Initiate profile document data.
export const _publicProfile = ( user:any ) => {

  const articleData:any   = [];

  // @ts-ignore ---source--data--- 
  const contractorRef:any = firestore
    .collection   ( 'contractors' ) // "contractors"
    .doc          ( user );

    contractorRef
    .get    ( { source: 'server' } )
    .then   ( ( doc: any ) => {
      if    ( doc.exists ) {

        // Add document data into Array
        articleData.push( doc.data() ); // console.log('Contractor Info: ', articleData);

        // Dispatch Data into Redux State
        store.dispatch( user_ID                   ( articleData[0].id ) );
        store.dispatch( p_publishContractor       ( articleData[0].publishContractor ) );
        store.dispatch( p_contractorInfo          ( articleData[0].contractorInfo ) );
        store.dispatch( p_contractorWebsite       ( articleData[0].contractorWebsite ) );
        store.dispatch( p_contractorName          ( articleData[0].contractorName ) );
        store.dispatch( p_contractorPhoto         ( articleData[0].contractorPhoto ) );
      }
  
    }).catch( (error: any) => { console.log("Error getting user data:", error); }); //CLOSE -- Promise document data from article/settings.
  

}

  export const _privateContractor = ( user:any ) => {

    // const identity:any      = user;
    const articleData:any   = [];

    // @ts-ignore ---source--data--- 
    const contractorRef:any = firestore
      .collection   ( "users" )
      .doc          ( user );
  
      contractorRef
      .get    ( { source: 'server' } )
      .then   ( ( doc: any ) => {
        if    ( doc.exists ) {
 
        // Add document data into Array
        articleData.push( doc.data() ); // console.log('articleData', articleData);

        // Dispatch Data into Redux State
        store.dispatch( user_ID                   ( articleData[0].id ) );
        // store.dispatch( user_contract             ( articleData[0].publishContractor ) );
        store.dispatch( user_Info                 ( articleData[0].contractorInfo ) );
        store.dispatch( user_Website              ( articleData[0].contractorWebsite ) );
        store.dispatch( user_Name                 ( articleData[0].contractorName ) );
        store.dispatch( user_Photo                ( articleData[0].contractorPhoto ) );
        // return articleData

      }
    
      }).catch( (error: any) => { console.log("Error getting user data:", error); }); //CLOSE -- Promise document data from article/settings.
    
  };
