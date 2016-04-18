angular.module('myApp').service('Session', [ function() {

	this.create = function (sessionId, userId, userRole) {
		this.id = sessionId;
		this.userId = userId;
		this.userRole = userRole;
	};
	this.destroy = function () {
		this.id = null;
		this.userId = null;
		this.userRole = null;
	};
	this.userHasRole = function(role) {
		return (this.userRole === role);
	};

	return this;
}]);
