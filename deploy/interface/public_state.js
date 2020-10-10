export const PUBLIC_CONTRACT = 'PUBLIC_CONTRACT';
export const PUBLIC_ID = 'PUBLIC_ID';
export const PUBLIC_PHOTO = 'PUBLIC_PHOTO';
export const PUBLIC_NAME = 'PUBLIC_NAME';
export const PUBLIC_PHONE = 'PUBLIC_PHONE';
export const PUBLIC_EMAIL = 'PUBLIC_EMAIL';
export const PUBLIC_INFO = 'PUBLIC_INFO';
export const PUBLIC_WEBSITE = 'PUBLIC_WEBSITE';
export const P_CON_BUSINESS = 'P_CON_BUSINESS';
;
;
;
;
;
;
;
;
;
;
;
;
const start = {
    public_profile_object: [],
    public_contract: false,
    public_id: '',
    public_photo: '',
    public_name: '',
    public_phone: '',
    public_email: '',
    public_info: '',
    public_nickname: '',
    public_website: ''
};
export const mutual = (state = start, action) => {
    switch (action.type) {
        case PUBLIC_CONTRACT: return Object.assign(Object.assign({}, state), { public_contract: action.public_contract });
        case PUBLIC_ID: return Object.assign(Object.assign({}, state), { public_id: action.public_id });
        case PUBLIC_PHOTO: return Object.assign(Object.assign({}, state), { public_photo: action.public_photo });
        case PUBLIC_NAME: return Object.assign(Object.assign({}, state), { public_name: action.public_name });
        case PUBLIC_PHONE: return Object.assign(Object.assign({}, state), { public_phone: action.public_phone });
        case PUBLIC_EMAIL: return Object.assign(Object.assign({}, state), { public_email: action.public_email });
        case PUBLIC_INFO: return Object.assign(Object.assign({}, state), { public_info: action.public_info });
        case PUBLIC_WEBSITE: return Object.assign(Object.assign({}, state), { public_website: action.public_website });
        default: return state;
    }
};
export const p_publishContractor = (public_contract) => { return { type: PUBLIC_CONTRACT, public_contract }; };
export const p_contractorUser = (public_id) => { return { type: PUBLIC_ID, public_id }; };
export const p_contractorName = (public_name) => { return { type: PUBLIC_NAME, public_name }; };
export const p_contractorPhoto = (public_photo) => { return { type: PUBLIC_PHOTO, public_photo }; };
export const p_contractorPhone = (public_phone) => { return { type: PUBLIC_PHONE, public_phone }; };
export const p_contractorInfo = (public_info) => { return { type: PUBLIC_INFO, public_info }; };
export const p_contractorWebsite = (public_website) => { return { type: PUBLIC_WEBSITE, public_website }; };
