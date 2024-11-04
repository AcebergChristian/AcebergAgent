import { combineReducers } from 'redux';


// 定义初始状态
const initialState = {
  path: '',
  key: '',
};

// 创建 reducer
const usrinfoReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_PATH':
      return {
        ...state,
        path: action.payload,
      };
    case 'SET_KEY':
      return {
        ...state,
        key: action.payload,
      };
    default:
      return state;
  }
};


const combineReducer = combineReducers({
  usrinfo: usrinfoReducer,
});


export default combineReducer;