export const SETTINGS_PAGE = 'SETTINGS_PAGE';
export const ACC_VERIFIED = 'ACC_VERIFIED';
export const ACC_TOGGLE = 'ACC_TOGGLE';
export const ACC_USER = "ACC_USER";
export const ACC_NAME = "ACC_NAME";
export const ACC_EMAIL = "ACC_EMAIL";
export const ACC_IMAGE = "ACC_IMAGE";
export const ACC_ANON = "ACC_ANON";
export const ACC_PHONE = "ACC_PHONE";
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
    page: 'profile',
    verified: false,
    editSettings: false,
    anon: false,
    user: '',
    name: '',
    email: '',
    image: '',
    phone: ''
};
export const account = (state = start, action) => {
    switch (action.type) {
        case SETTINGS_PAGE: return Object.assign(Object.assign({}, state), { page: action.page });
        case ACC_VERIFIED: return Object.assign(Object.assign({}, state), { verified: action.verified });
        case ACC_TOGGLE: return Object.assign(Object.assign({}, state), { editSettings: action.editSettings });
        case ACC_USER: return Object.assign(Object.assign({}, state), { user: action.user });
        case ACC_NAME: return Object.assign(Object.assign({}, state), { name: action.name });
        case ACC_PHONE: return Object.assign(Object.assign({}, state), { phone: action.phone });
        case ACC_EMAIL: return Object.assign(Object.assign({}, state), { email: action.email });
        case ACC_IMAGE: return Object.assign(Object.assign({}, state), { image: action.image });
        case ACC_ANON: return Object.assign(Object.assign({}, state), { anon: action.anon });
        default: return state;
    }
};
export const navigate = (page) => {
    switch (page) {
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
    return { type: SETTINGS_PAGE, page };
};
export const accountEmailVerify = (verified) => { return { type: ACC_VERIFIED, verified }; };
export const accountToggle = (editSettings) => { return { type: ACC_TOGGLE, editSettings }; };
export const accountUser = (user) => { return { type: ACC_USER, user }; };
export const accountName = (name) => { return { type: ACC_NAME, name }; };
export const accountPhone = (phone) => { return { type: ACC_PHONE, phone }; };
export const accountEmail = (email) => { return { type: ACC_EMAIL, email }; };
export const accountImage = (image) => { return { type: ACC_IMAGE, image }; };
export const accountAnon = (anon) => { return { type: ACC_ANON, anon }; };
