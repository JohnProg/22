import { combineReducers } from 'redux';
import { reducer as taskReducer} from '../actions/tasks_decl'
import { reducer as taskLogReducer} from '../actions/tasklog_decl'
import { reducer as globalReducer} from '../actions/global_decl'
import { reducer as configReducer} from '../actions/config_decl'
import { reducer as userReducer} from '../actions/user_decl'


const rootReducer = combineReducers({
	tasks: taskReducer
	, tasklog: taskLogReducer
	, global: globalReducer
	, config: configReducer
	, user: userReducer
});

export default rootReducer;