const rsa = require('../auth/rsa_auth');
const USERNAME_REGEX = /^[a-zA-Z0-9_]*$/;


const validate = async (user, collection=false) => {
	let errors = [];

	if (user.username.match(USERNAME_REGEX) === null)
		errors.push('Username can only contain letters, numbers, and underscores');

	if (user.username.length < 3 || user.username.length > 15)
		errors.push('Username must be 3-15 characters');

	if (errors.length === 0 && collection && await collection.findOne({login_name: user.login_name}))
		errors.push('That username is already in use');

	if (user.confirm_password && user.confirm_password !== user.password)
		errors.push('Passwords did not match');

	if (user.password.length < 3 || user.password.length > 30)
		errors.push('Password must be 3-30 characters');

	if (errors.length === 0) {
		user.password = rsa.encrypt(user.password);
		delete user.confirm_password;
		return user;
	}
	else throw errors;
};

const new_user_params = params => {
	const username = rsa.decrypt(params.username);
	return {
		username: username,
		login_name: username.toLowerCase(),

		password: rsa.decrypt(params.password),
		confirm_password: rsa.decrypt(params.confirm_password),

		completed: {},
		backlog: {},
		favorites: {}
	};
};

const create = req => {
	const users_collection = req.app.locals.users;
	const newUser = new_user_params(req.body);
	return validate(newUser, users_collection).then(user => users_collection.insertOne(newUser));
};

const serialize = user => ({
	username: user.username,
	completed: user.completed,
	backlog: user.backlog,
	favorites: user.favorites
});

module.exports = {
	create,
	serialize
};
