
import { ActionCreator, Reducer, Action }  from 'redux';
import { RootAction, RootState } from '../store';
import { ThunkAction } from 'redux-thunk';

// INDIVIDUAL
export const PUBLIC_CONTRACT        = 'PUBLIC_CONTRACT';             
export const PUBLIC_ID              = 'PUBLIC_ID';             // PUBLIC ID
export const PUBLIC_PHOTO           = 'PUBLIC_PHOTO';          // MY PUBLIC PHOTO
export const PUBLIC_NAME            = 'PUBLIC_NAME';           // MY PUBLIC NAME
export const PUBLIC_PHONE           = 'PUBLIC_PHONE';          // MY PUBLIC PHONE
export const PUBLIC_EMAIL           = 'PUBLIC_EMAIL';          // MY PUBLIC EMAIL
export const PUBLIC_INFO            = 'PUBLIC_INFO';           // MY PUBLIC INFO
export const PUBLIC_WEBSITE         = 'PUBLIC_WEBSITE';        // MY PUBLIC WEBSITE

export const P_CON_BUSINESS         = 'P_CON_BUSINESS';

export interface publicState {

// INDIVIDUAL

  public_profile_object:        object,

  public_contract:              boolean,
  public_id:                    string,
  public_photo:                 string,
  public_name:                  string,
  public_phone:                 string,
  public_email:                 string,
  public_info:                  string,
  public_nickname:              string,
  public_website:               string

}

// INDIVIDUAL

export interface _public_Contract_   extends Action<'PUBLIC_CONTRACT'>        { public_contract:     boolean };
export interface _public_ID_         extends Action<'PUBLIC_ID'>              { public_id:           string };
export interface _public_Profile_    extends Action<'PUBLIC_PROFILE'>         { public_profile:      string };
export interface _public_Location_   extends Action<'PUBLIC_LOCATION'>        { public_location:     string };
export interface _public_Area_ID_    extends Action<'PUBLIC_AREA_ID'>         { public_area_id:      string };
export interface _public_Trade_      extends Action<'PUBLIC_TRADE'>           { public_occupation:   string }; 
export interface _public_Photo_      extends Action<'PUBLIC_PHOTO'>           { public_photo:        string };
export interface _public_Phone_      extends Action<'PUBLIC_PHONE'>           { public_phone:        string };
export interface _public_Email_      extends Action<'PUBLIC_EMAIL'>           { public_email:        string };
export interface _public_Info_       extends Action<'PUBLIC_INFO'>            { public_info:         string };
export interface _public_Name_       extends Action<'PUBLIC_NAME'>            { public_name:         string };
export interface _public_Website_    extends Action<'PUBLIC_WEBSITE'>         { public_website:      string };

export type publicAction =

_public_Contract_
| _public_ID_
| _public_Profile_
| _public_Location_
| _public_Area_ID_
| _public_Trade_
| _public_Name_
| _public_Photo_
| _public_ID_
| _public_Phone_
| _public_Email_
| _public_Info_
| _public_Website_

;

export type profileResult = ThunkAction<void, RootState, undefined, publicAction>;


// Reducer

const start: publicState = {

// INDIVIDUAL

  public_profile_object:    [],

  public_contract:          false,
  public_id:                '',
  public_photo:             '',
  public_name:              '',
  public_phone:             '',
  public_email:             '',
  public_info:              '',
  public_nickname:          '',
  public_website:           ''

};

// Reducer

export const mutual: Reducer<publicState, RootAction> = ( state = start, action ) => {
  switch ( action.type ) {
    
    case PUBLIC_CONTRACT:       return { ...state, public_contract:        action.public_contract };
    case PUBLIC_ID:             return { ...state, public_id:              action.public_id };
    case PUBLIC_PHOTO:          return { ...state, public_photo:           action.public_photo };
    case PUBLIC_NAME:           return { ...state, public_name:            action.public_name };
    case PUBLIC_PHONE:          return { ...state, public_phone:           action.public_phone };
    case PUBLIC_EMAIL:          return { ...state, public_email:           action.public_email };
    case PUBLIC_INFO:           return { ...state, public_info:            action.public_info };
    case PUBLIC_WEBSITE:        return { ...state, public_website:         action.public_website };

  default: return state;

  }
}

// Actions

export const p_publishContractor:       ActionCreator<_public_Contract_>    = ( public_contract:   boolean ) => { return { type: PUBLIC_CONTRACT,     public_contract }; };

export const p_contractorUser:          ActionCreator<_public_ID_>          = ( public_id:           string )  => { return { type: PUBLIC_ID,         public_id }; };
export const p_contractorName:          ActionCreator<_public_Name_>        = ( public_name:         string )  => { return { type: PUBLIC_NAME,       public_name }; };
export const p_contractorPhoto:         ActionCreator<_public_Photo_>       = ( public_photo:        string )  => { return { type: PUBLIC_PHOTO,      public_photo }; };
export const p_contractorPhone:         ActionCreator<_public_Phone_>       = ( public_phone:        string )  => { return { type: PUBLIC_PHONE,      public_phone } };
export const p_contractorInfo:          ActionCreator<_public_Info_>        = ( public_info:         string )  => { return { type: PUBLIC_INFO,       public_info }; };
export const p_contractorWebsite:       ActionCreator<_public_Website_>     = ( public_website:      string )  => { return { type: PUBLIC_WEBSITE,    public_website }; };
