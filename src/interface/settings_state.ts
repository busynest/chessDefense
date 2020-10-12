
import { ActionCreator, Reducer, Action }   from 'redux';
import { ThunkAction }                      from 'redux-thunk';
import { RootAction, RootState }            from '../store';

// APPLICATION
export const CURRENT_USER         = 'CURRENT_USER';             // SIGNED IN STATE
export const CURRENT_FEEDBACK     = "CURRENT_FEEDBACK";         // FEEDBACK POSTS
export const CURRENT_TOPIC        = "CURRENT_TOPIC";            // FEEDBACK POSTS

// ACCOUNT
export const SETTINGS_PAGE        = 'SETTINGS_PAGE';
export const ACC_VERIFIED         = 'ACC_VERIFIED';
export const ACC_ANON             = "ACC_ANON";

// INDIVIDUAL
export const INDIVIDUAL_CONTRACT  = 'INDIVIDUAL_CONTRACT';      // PUBLISH INDIVIDUAL
export const INDIVIDUAL_DIR       = 'INDIVIDUAL_DIR';           // LIST OF PROFILES
export const INDIVIDUAL_PAGE      = 'INDIVIDUAL_PAGE';          // LIST OF SAVED PROFILES
export const INDIVIDUAL_SIZE      = 'INDIVIDUAL_SIZE';          // NUMBER OF PROFILES
export const INDIVIDUAL_ID        = 'INDIVIDUAL_ID';            // IDENTIFICATION
export const INDIVIDUAL_NICKNAME  = 'INDIVIDUAL_NICKNAME';      // MY NICKNAME
export const INDIVIDUAL_IMAGE     = 'INDIVIDUAL_IMAGE';         // MY PHOTO
export const INDIVIDUAL_NAME      = 'INDIVIDUAL_NAME';          // MY NAME
export const INDIVIDUAL_PHONE     = 'INDIVIDUAL_PHONE';         // MY PHONE
export const INDIVIDUAL_EMAIL     = 'INDIVIDUAL_EMAIL';         // My EMAIL
export const INDIVIDUAL_INFO      = "INDIVIDUAL_INFO";          // MY INFO
export const INDIVIDUAL_WEBSITE   = 'INDIVIDUAL_WEBSITE';       // MY WEBSITE

export interface profileState {
  // APPLICATION
  currentUser:                      boolean,
  feedback:                         object,
  topic:                            string,

  // ACCOUNT
  page:             string,
  verified:         boolean,
  anon:             boolean,

  // INDIVIDUAL
  public_profile_object:            object,
  individual_nickname:              string,
  individual_contract:              boolean,
  individual_id:                    string,
  individual_photo:                 string,
  individual_name:                  string,
  individual_phone:                 string,
  individual_email:                 string,
  individual_info:                  string,
  individual_website:               string
}

// APPLICATION
export interface _user_                 extends Action<'CURRENT_USER'>            { currentUser:                  boolean };
export interface _feedback_             extends Action<'CURRENT_FEEDBACK'>        { feedback:                     object  };
export interface _topic_                extends Action<'CURRENT_TOPIC'>           { topic:                        string  };

// ACCOUNT
export interface navigateX        extends Action<'SETTINGS_PAGE'>   { page:         string };
export interface accVerified      extends Action<'ACC_VERIFIED'>    { verified:     boolean };
export interface accAnon          extends Action<'ACC_ANON'>        { anon:         boolean };

// INDIVIDUAL
export interface _individual_contract_  extends Action<'INDIVIDUAL_CONTRACT'>     { individual_contract:          boolean };
export interface _individual_dir_       extends Action<'INDIVIDUAL_DIR'>          { search_individual:            object };
export interface _individual_page_      extends Action<'INDIVIDUAL_PAGE'>         { search_individual_page:       number };
export interface _individual_size_      extends Action<'INDIVIDUAL_SIZE'>         { search_individual_size:       number  };
export interface _individual_ID_        extends Action<'INDIVIDUAL_ID'>           { individual_id:                string }; 
export interface _individual_Image_     extends Action<'INDIVIDUAL_IMAGE'>        { individual_image:             string };
export interface _individual_Phone_     extends Action<'INDIVIDUAL_PHONE'>        { individual_phone:             string };
export interface _individual_Email_     extends Action<'INDIVIDUAL_EMAIL'>        { individual_email:             string };
export interface _individual_Info_      extends Action<'INDIVIDUAL_INFO'>         { individual_info:              string };
export interface _individual_Name_      extends Action<'INDIVIDUAL_NAME'>         { individual_name:              string };
export interface _individual_Website_   extends Action<'INDIVIDUAL_WEBSITE'>      { individual_website:           string };

export type profileAction =

// APPLICATION
_user_
| _feedback_
| _topic_

// INDIVIDUAL
| _individual_contract_
| _individual_dir_
| _individual_page_
| _individual_size_
| _individual_ID_
| _individual_Image_
| _individual_Phone_
| _individual_Email_ 
| _individual_Info_   
| _individual_Name_  
| _individual_Website_
| accAnon
| navigateX
| accVerified
;

export type profileResult = ThunkAction<void, RootState, undefined, profileAction>;


// Reducer START

const start: profileState = {
  // APPLICATION
  currentUser:                    false,
  feedback:                       [],
  topic:                          'individual',

  // ACCOUNT
  page:             'profile',
  verified:         false,
  anon:             false,

  // INDIVIDUAL
  public_profile_object:          [],
  individual_nickname:            '',
  individual_contract:            false,
  individual_id:                  '',
  individual_photo:               '',
  individual_name:                '',
  individual_phone:               '',
  individual_email:               '',
  individual_info:                '',
  individual_website:             '',
};

export const settings: Reducer<profileState, RootAction> = ( state = start, action ) => {
  switch ( action.type ) {

    case CURRENT_FEEDBACK:        return { ...state, getFeedback:                   action.feedback };
    case CURRENT_USER:            return { ...state, currentUser:                   action.currentUser };
    case CURRENT_TOPIC:           return { ...state, topic:                         action.topic };
    case ACC_VERIFIED:    return { ...state, verified:        action.verified };
    case ACC_ANON:        return { ...state, anon:            action.anon };
    case INDIVIDUAL_CONTRACT:     return { ...state, individual_contract:           action.individual_contract };
    case INDIVIDUAL_DIR:          return { ...state, search_individual:             action.search_individual };
    case INDIVIDUAL_PAGE:         return { ...state, search_individual_page:        action.search_individual_page };
    case INDIVIDUAL_SIZE:         return { ...state, search_individual_size:        action.search_individual_size };
    case INDIVIDUAL_ID:           return { ...state, individual_id:                 action.individual_id };
    case INDIVIDUAL_IMAGE:        return { ...state, individual_photoURL:           action.individual_image };
    case INDIVIDUAL_NAME:         return { ...state, individual_name:               action.individual_name };
    case INDIVIDUAL_PHONE:        return { ...state, individual_phone:              action.individual_phone };
    case INDIVIDUAL_EMAIL:        return { ...state, individual_email:              action.individual_email };
    case INDIVIDUAL_INFO:         return { ...state, individual_info:               action.individual_info };
    case INDIVIDUAL_WEBSITE:      return { ...state, individual_website:            action.individual_website }; 

  default: return state;

  }
}

// Reducer END

// REDUX Actions

// APPLAICATION
export const current_User:        ActionCreator<_user_>                   = ( currentUser:  boolean ) => { return { type: CURRENT_USER,           currentUser }; };
export const articleFeedback:     ActionCreator<_feedback_>               = ( feedback:     object  ) => { return { type: CURRENT_FEEDBACK,       feedback } };
export const changeTopic:         ActionCreator<_topic_>                  = ( topic:        string  ) => { return { type: CURRENT_TOPIC,          topic } };

// ACCOUNT

// NAVIGATION
export const navigate: ActionCreator<navigateX> = ( page: string ) => {
  switch(page) {

    case 'profile':
      break;
    case 'email':
      break;
    case 'password':
      break;
    case 'delete':
      break;
  
    default: page = 'profile';
  
    }
  return { type: SETTINGS_PAGE, page }
}

export const accountEmailVerify:    ActionCreator<accVerified>    = ( verified: boolean )       => { return { type: ACC_VERIFIED,  verified }; };
export const accountAnon:           ActionCreator<accAnon>        = ( anon:  boolean )          => { return { type: ACC_ANON,     anon }; };


// INDIVIDUAL
export const user_Contract:       ActionCreator<_individual_contract_>    = ( individual_contract:          boolean ) => { return { type: INDIVIDUAL_CONTRACT,    individual_contract }; };
export const user_ID:             ActionCreator<_individual_ID_>          = ( individual_id:                string )  => { return { type: INDIVIDUAL_ID,          individual_id }; };
export const user_Name:           ActionCreator<_individual_Name_>        = ( individual_name:              string )  => { return { type: INDIVIDUAL_NAME,        individual_name }; };
export const user_Photo:          ActionCreator<_individual_Image_>       = ( individual_image:             string )  => { return { type: INDIVIDUAL_IMAGE,       individual_image }; };
export const user_Email:          ActionCreator<_individual_Email_>       = ( individual_email:             string )  => { return { type: INDIVIDUAL_EMAIL,       individual_email }; };
export const user_Phone:          ActionCreator<_individual_Phone_>       = ( individual_phone:             string )  => { return { type: INDIVIDUAL_PHONE,       individual_phone } };
export const user_Info:           ActionCreator<_individual_Info_>        = ( individual_info:              string )  => { return { type: INDIVIDUAL_INFO,        individual_info }; };
export const user_Website:        ActionCreator<_individual_Website_>     = ( individual_website:           string )  => { return { type: INDIVIDUAL_WEBSITE,     individual_website }; };
