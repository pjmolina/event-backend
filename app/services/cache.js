//Cache services to extend controllers--------------------
function apply(controller) {
	//apply cache to controller 
	controller.query('get', addCache60mins);
}
function addCache60mins(req, res, next) {	
	addCache(req, res, 3600); //60 min	
	next();
}
function addCache(req, res, seconds) {
    res.append('Cache-Control', 'public, max-age=' + seconds);
}

module.exports.apply = apply;