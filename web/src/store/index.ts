import defaultSettings from '../settings.json';
export interface GlobalState {
  settings?: typeof defaultSettings;
  userInfo?: {
    name?: string;
    avatar?: string;
    username?: string;
    password?: string;
    admin?: string;
    role?: string;
    path?: string,
    key?: string,
    permissions?: string,
  };
  userLoading?: boolean;
}

// 全局state的初始化
const initialState: GlobalState = {
  settings: defaultSettings,
  userInfo: {
    //头像地址
    avatar: "",
    permissions:"",
    username: "",
    password: "",
    path: "",
    key: "",
  }
};

export default function indexstore(state = initialState, action) {
  switch (action.type) {
    case 'update-settings': {
      const { settings } = action.payload;
      return {
        ...state,
        settings,
      };
    }
    case 'update-userInfo': {
      const { userInfo, userLoading } = action.payload;
      return {
        ...state,
        userInfo: {
          ...state.userInfo,
          ...userInfo,
        },
        userLoading,
      };
    }
    default:
      return state;
  }
}
