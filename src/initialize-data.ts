
import {store} from './store';

import {
  current_User,
  // user_contract,
  user_ID,
  user_Name,
  user_Email,
  user_Photo,
  user_Info,
  user_Website,
  accountAnon
} from './interface/settings_state';

import { closeDrawer } from './interface/drawer_state';

// Initiate Bookmarks data.
const _demoData = () => {

  // ID
  store.dispatch( user_ID       ( 'guest' ) );
  // Authentication State
  store.dispatch( current_User  ( false ) );
  // Contact Name
  store.dispatch( user_Name     ( 'John Doe' ) );
  // Contact Email
  store.dispatch( user_Email    ( 'email@domain.com' ) );
  // Article Image
  store.dispatch( user_Photo    ( '/images/manifest/logo-48.png' ) );

}

// Initiate profile document data.
export const _initializeData = () => {

    // Initiate Article Data Object.
    const articleData:any = [];

    // @ts-ignore
    return firebase
      .auth()
      .onAuthStateChanged( (user:any) => {

        // if user is logged in.
        if (user) {

          // User Information
          store.dispatch( closeDrawer   ( false ) );            // Close drawer, when drawer is used to login
          store.dispatch( current_User  ( true ) );             // Update Login state.
          store.dispatch( user_ID       ( user.uid ) );         // Update User ID.
          store.dispatch( accountAnon   ( user.isAnonymous) );  // Update Anonymous state
          
          // store.dispatch( accountUser   ( user.uid) );          // Update User ID.
          // store.dispatch( accountName   ( user.displayName) );  // Update Name
          // store.dispatch( accountEmail  ( user.email) );        // Update Email
          // store.dispatch( accountPhone  ( user.phone) );        // Update Phone
          // store.dispatch( accountImage  ( user.photoURL) );     // Update Photo

          // @ts-ignore - Reference GLOBAL user document
          const userDocument:any = usersCollection.doc( user.uid );

          userDocument
            .get  ( { source: 'server' })
            .then ( (doc: any) => {

              // If doument exists
              if (doc.exists) {

                // Download Saved Data
                articleData.push( doc.data() ); console.log('articleData', articleData);
                
                // ID
                store.dispatch( user_ID                   ( articleData[0].userID ) );

                // Saved Contractor Information
                // store.dispatch( user_contract             ( articleData[0].publishContractor ) );
                store.dispatch( user_Name                 ( articleData[0].contractorName ) );
                store.dispatch( user_Photo                ( articleData[0].contractorPhoto ) );
                store.dispatch( user_Info                 ( articleData[0].contractorInfo ) );
                store.dispatch( user_Website              ( articleData[0].contractorWebsite ) );
                
                return articleData
      
            // If document does not exist - Create Master Document
            } else {
              

                  // New Master Object.
                  const newDocument:any = {

                    // @ts-ignore
                    timestamp:                firebase.firestore.FieldValue.serverTimestamp(),
                    userID:                   user.uid,
                    inital:                   'introduction',
                    action:                   '',
                    lat:                      '',
                    lng:                      '',
                    location:                 window.location.host,
                    timeZone:                 '',

                    /** Contractor */
                    publishContractor:        true,
                    displayName:              user.displayName,
                    photoURL:                 '',
                    user_FullName:            '',
                    user_Info:                '',
                    user_Website:             '',
                    user_Photo:               user.photoURL,
                    user_Email:               user.email,
                    user_Phone:               user.phoneNumber

                  }

                // Save Master Document
                userDocument
                  .set(newDocument);

                // Master Document State
                store.dispatch( user_ID                 ( newDocument.userID ) );
                // store.dispatch( user_contract           ( newDocument.publishContractor ) );
                store.dispatch( user_Info               ( newDocument.contractorInfo ) );
                store.dispatch( user_Website            ( newDocument.contractorWebsite ) );
                store.dispatch( user_Name               ( newDocument.contractorName ) );
                store.dispatch( user_Photo              ( newDocument.contractorPhoto ) );

                console.log('Initial Search Results: ', articleData[0]);
                return articleData.push( newDocument ); // return new article data

              }

            }).catch( (error: any) => { console.log("Error getting user data:", error); }); //CLOSE -- Promise document data from article/settings.
      
          // logged out 
          } else { _demoData(); store.dispatch( closeDrawer(false) ); }

        });

      };

