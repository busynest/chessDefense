export const CURRENT_USER = 'CURRENT_USER';
export const CURRENT_FEEDBACK = "CURRENT_FEEDBACK";
export const CURRENT_TOPIC = "CURRENT_TOPIC";
export const SETTINGS_PAGE = 'SETTINGS_PAGE';
export const ACC_VERIFIED = 'ACC_VERIFIED';
export const ACC_ANON = "ACC_ANON";
export const INDIVIDUAL_CONTRACT = 'INDIVIDUAL_CONTRACT';
export const INDIVIDUAL_DIR = 'INDIVIDUAL_DIR';
export const INDIVIDUAL_PAGE = 'INDIVIDUAL_PAGE';
export const INDIVIDUAL_SIZE = 'INDIVIDUAL_SIZE';
export const INDIVIDUAL_ID = 'INDIVIDUAL_ID';
export const INDIVIDUAL_NICKNAME = 'INDIVIDUAL_NICKNAME';
export const INDIVIDUAL_IMAGE = 'INDIVIDUAL_IMAGE';
export const INDIVIDUAL_NAME = 'INDIVIDUAL_NAME';
export const INDIVIDUAL_PHONE = 'INDIVIDUAL_PHONE';
export const INDIVIDUAL_EMAIL = 'INDIVIDUAL_EMAIL';
export const INDIVIDUAL_INFO = "INDIVIDUAL_INFO";
export const INDIVIDUAL_WEBSITE = 'INDIVIDUAL_WEBSITE';
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
;
;
;
;
;
const start = {
    currentUser: false,
    feedback: [],
    topic: 'individual',
    page: 'profile',
    verified: false,
    anon: false,
    public_profile_object: [],
    individual_nickname: '',
    individual_contract: false,
    individual_id: '',
    individual_photo: '',
    individual_name: '',
    individual_phone: '',
    individual_email: '',
    individual_info: '',
    individual_website: '',
};
export const settings = (state = start, action) => {
    switch (action.type) {
        case CURRENT_FEEDBACK: return Object.assign(Object.assign({}, state), { getFeedback: action.feedback });
        case CURRENT_USER: return Object.assign(Object.assign({}, state), { currentUser: action.currentUser });
        case CURRENT_TOPIC: return Object.assign(Object.assign({}, state), { topic: action.topic });
        case ACC_VERIFIED: return Object.assign(Object.assign({}, state), { verified: action.verified });
        case ACC_ANON: return Object.assign(Object.assign({}, state), { anon: action.anon });
        case INDIVIDUAL_CONTRACT: return Object.assign(Object.assign({}, state), { individual_contract: action.individual_contract });
        case INDIVIDUAL_DIR: return Object.assign(Object.assign({}, state), { search_individual: action.search_individual });
        case INDIVIDUAL_PAGE: return Object.assign(Object.assign({}, state), { search_individual_page: action.search_individual_page });
        case INDIVIDUAL_SIZE: return Object.assign(Object.assign({}, state), { search_individual_size: action.search_individual_size });
        case INDIVIDUAL_ID: return Object.assign(Object.assign({}, state), { individual_id: action.individual_id });
        case INDIVIDUAL_IMAGE: return Object.assign(Object.assign({}, state), { individual_photoURL: action.individual_image });
        case INDIVIDUAL_NAME: return Object.assign(Object.assign({}, state), { individual_name: action.individual_name });
        case INDIVIDUAL_PHONE: return Object.assign(Object.assign({}, state), { individual_phone: action.individual_phone });
        case INDIVIDUAL_EMAIL: return Object.assign(Object.assign({}, state), { individual_email: action.individual_email });
        case INDIVIDUAL_INFO: return Object.assign(Object.assign({}, state), { individual_info: action.individual_info });
        case INDIVIDUAL_WEBSITE: return Object.assign(Object.assign({}, state), { individual_website: action.individual_website });
        default: return state;
    }
};
export const current_User = (currentUser) => { return { type: CURRENT_USER, currentUser }; };
export const articleFeedback = (feedback) => { return { type: CURRENT_FEEDBACK, feedback }; };
export const changeTopic = (topic) => { return { type: CURRENT_TOPIC, topic }; };
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
export const accountAnon = (anon) => { return { type: ACC_ANON, anon }; };
export const user_Contract = (individual_contract) => { return { type: INDIVIDUAL_CONTRACT, individual_contract }; };
export const user_ID = (individual_id) => { return { type: INDIVIDUAL_ID, individual_id }; };
export const user_Name = (individual_name) => { return { type: INDIVIDUAL_NAME, individual_name }; };
export const user_Photo = (individual_image) => { return { type: INDIVIDUAL_IMAGE, individual_image }; };
export const user_Email = (individual_email) => { return { type: INDIVIDUAL_EMAIL, individual_email }; };
export const user_Phone = (individual_phone) => { return { type: INDIVIDUAL_PHONE, individual_phone }; };
export const user_Info = (individual_info) => { return { type: INDIVIDUAL_INFO, individual_info }; };
export const user_Website = (individual_website) => { return { type: INDIVIDUAL_WEBSITE, individual_website }; };
