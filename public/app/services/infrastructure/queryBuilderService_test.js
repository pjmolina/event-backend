describe('QueryBuilderService', function(){
  	var sut, rootScope;
  	beforeEach(angular.mock.module("myApp"));

	beforeEach(function() {
		inject(function(QueryBuilderService, $rootScope, $httpBackend) {
			sut = QueryBuilderService;
			rootScope = $rootScope;
			$httpBackend.whenGET(/i18n\/literals.en-US.json/).respond({});
			$httpBackend.whenGET(/https\:\/\/maps.googleapis.com\/maps\/api\/geocode\/json\?address=Seville/)
			.respond({
				data: {
					results: [{
						geometry: {
							location: {
								lat: -7.67,
								lng: -8.90
							}
						}
					}],
					status: 'OK'
				}
			});
		});
	});

	function ngAsync(done, promise) {
		var result = null;

		promise.then(function (res) {
			result = res; 
			done();
		}, function(error){
	        fail("error: " + error);
	    });

		rootScope.$digest();

		return result;
	}
	function ngAsyncExpect(done, promise) {
		var result = ngAsync(done, promise);
		return expect(result);
	}


	describe('buildBaucisQuery', function() {
		it('buildBaucisQuery build page=0 & pageSize=3', function(done) { 
			ngAsyncExpect(done, sut.buildBaucisQuery({ page: 0, pageSize: 3})).toEqual('?limit=3');
		});
	
		it('buildBaucisQuery build page=3 & pageSize=4',  function(done) { 
			ngAsyncExpect(done, sut.buildBaucisQuery({ page: 3, pageSize: 4})).toEqual('?skip=8&limit=4');
		});
		it('buildBaucisQuery build sort=id -a', function(done) { 
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					sort: {
						id : true,
						a  : false
					},
					paginate: false
				}))
			)).toEqual('?sort=id -a');
		});
		it('buildBaucisQuery build conditions={a:b}', function(done) { 
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					criteria: "{a:b}",
					paginate: false
				}))
			)).toEqual('?conditions={a:b}');
		});
		it('buildBaucisQuery build select=a b', function(done) { 
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					select: "a b",
					paginate: false
				}))
			)).toEqual('?select=a b');
		});
		it('buildBaucisQuery build count', function(done) { 
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ count: true}))
			)).toEqual('?count=true');
		});
	});

	describe('andBuild', function() {
		it('andBuild empty list',  function() { 
			expect(sut.andBuild([])).toEqual(null);
		});
		it('andBuild 1 item', function() { 
			expect(sut.andBuild(['clause1'])).toEqual('clause1');
		});
		it('andBuild 2 items', function() { 
			expect(sut.andBuild(['a', 'b'])).toEqual('{"$and":[a,b]}');
		});
		it('andBuild 3 items', function() { 
			expect(sut.andBuild(['a', 'b', 'c'])).toEqual('{"$and":[a,b,c]}');
		});
		it('andBuild 5 items, 2 nulls', function() { 
			expect(sut.andBuild(['a', null, 'b', null, 'c'])).toEqual('{"$and":[a,b,c]}');
		});
	});

	describe('orBuild', function() {
		it('orBuild empty list', function() { 
			expect(sut.orBuild([])).toEqual(null);
		});
		it('orBuild 1 item', function() {
			expect(sut.orBuild(['clause1'])).toEqual('clause1');
		});
		it('orBuild 2 items', function() {
			expect(sut.orBuild(['a', 'b'])).toEqual('{"$or":[a,b]}');
		});
		it('orBuild 3 items', function() {
			expect(sut.orBuild(['a', 'b', 'c'])).toEqual('{"$or":[a,b,c]}');
		});
		it('orBuild 5 items, 2 nulls', function() {
			expect(sut.orBuild(['a', null, 'b', null, 'c'])).toEqual('{"$or":[a,b,c]}');
		});
	});

	describe('buildStringExactMatch', function() {
		it('buildStringExactMatch prop1 = text2', function() {
			expect(sut.buildStringExactMatch('prop1', 'text2')).toEqual('{"prop1":"text2"}');
		});
	});

	describe('buildExactMatch', function() {
		it('buildExactMatch prop1 = 12', function() { 
			expect(sut.buildExactMatch('prop1', 12)).toEqual('{"prop1":12}');
		});
		it('buildExactMatch prop1 = true', function() {
			expect(sut.buildExactMatch('prop1', true)).toEqual('{"prop1":true}');
		});
		it('buildExactMatch prop1 = null', function() {
			expect(sut.buildExactMatch('prop1', null)).toEqual('{"prop1":null}');
		});
	});

	describe('buildBaucisQuery-like', function() {
		it('buildBaucisQuery abc no-fields', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "abc",
					paginate: false 
				}))
			)).toEqual('');
		});
		it('buildBaucisQuery 1 field string abc', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "abc",
					fields: [
						{ name: "t1", type: "string" }
					],
					paginate: false
				}))
			)).toEqual('?conditions={"t1":{"$regex":"abc","$options":"i"}}');
		});
		it('buildBaucisQuery 1 field string 15', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "15",
					fields: [
						{ name: "t1", type: "string" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"t1":{"$regex":"15","$options":"i"}}');
		});
		it('buildBaucisQuery 1 field string true', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "true",
					fields: [
						{ name: "t1", type: "string" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"t1":{"$regex":"true","$options":"i"}}');
		});
		it('buildBaucisQuery n1 field int abc', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "12",
					fields: [
						{ name: "n1", type: "int" }
					],
					paginate: false
				}))
			)).toEqual('?conditions={"n1":12}');
		});
		it('buildBaucisQuery n1 field decimal abc', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "12.3",
					fields: [
						{ name: "n1", type: "decimal" }
					],
					paginate: false
				}))
			)).toEqual('?conditions={"n1":12.3}');
		});
		it('buildBaucisQuery 1 field bool 12', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "12",
					fields: [
						{ name: "b1", type: "bool" }
					],
					paginate: false
				}))
			)).toEqual('');
		});
		it('buildBaucisQuery 1 field bool true', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "true",
					fields: [
						{ name: "b1", type: "bool" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"b1":true}');
		});
		it('buildBaucisQuery 1 field date 25/11/2001 day precision', function(done) {
			
			var dateTxt1 = '25/11/2001';
			var date1 = new Date(2001, 10, 25);
			var date2 = new Date(2001, 10, 26);
			var dateIso1 = date1.toISOString();
			var dateIso2 = date2.toISOString();
			
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: dateTxt1,
					fields: [
						{ name: "d1", type: "date" }
					],
					paginate: false 
				}))
			//).toEqual('?conditions={"d1":{"$gte":"2001-11-24T23:00:00.000Z","$lt":"2001-11-25T23:00:00.000Z"}}');
			)).toEqual('?conditions={"d1":{"$gte":"'+ dateIso1 +'","$lt":"'+ dateIso2 +'"}}');
		});
		it('buildBaucisQuery 1 field datetime 2001-11-25 21:00 hour precision', function(done) {
			
			var dateTxt1 = '25/11/2001 21:00';
			var date1 = new Date(2001, 10, 25, 21, 0);
			var date2 = new Date(2001, 10, 25, 22, 0);
			var dateIso1 = date1.toISOString();
			var dateIso2 = date2.toISOString();

			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: dateTxt1,
					fields: [
						{ name: "d1", type: "datetime" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"d1":{"$gte":"'+ dateIso1 +'","$lt":"'+ dateIso2 +'"}}');
		});
		it('buildBaucisQuery 1 field datetime 2001-11-25 21:38 minute precision', function(done) {
			
			var dateTxt1 = '25/11/2001 21:38';
			var date1 = new Date(2001, 10, 25, 21, 38);
			var date2 = new Date(2001, 10, 25, 21, 39);
			var dateIso1 = date1.toISOString();
			var dateIso2 = date2.toISOString();

			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: dateTxt1,
					fields: [
						{ name: "d1", type: "datetime" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"d1":{"$gte":"'+ dateIso1 +'","$lt":"'+ dateIso2 +'"}}');
		});
		
		it('buildBaucisQuery 2 fields string abc', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "abc",
					fields: [
						{ name: "t1", type: "string" },
						{ name: "t2", type: "string" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"$or":[{"t1":{"$regex":"abc","$options":"i"}},{"t2":{"$regex":"abc","$options":"i"}}]}');
		});

		it('buildBaucisQuery fieldQuery t1=abc',  function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "t1=abc",
					fields: [
						{ name: "t1", type: "string" },
						{ name: "d2", type: "date" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"t1":{"$regex":"abc","$options":"i"}}');
		});

		it('buildBaucisQuery fieldQuery t1=abc t2=3', function(done) { 
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "t1=abc t2=3",
					fields: [
						{ name: "t1", type: "string" },
						{ name: "t2", type: "number" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"$and":[{"t1":{"$regex":"abc","$options":"i"}},{"t2":3}]}');
		});
	});

	describe('geoQueries', function() {

		it('location near [1.3,2.5]', function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "location near [1.3,2.5]",
					fields: [
						{ name: "location", type: "geopoint" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"location":{"$near":{"$geometry":{"type":"Point","coordinates":[2.5,1.3]}}}}');
		});
		it('location near [-1.2,-3.4]',  function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "location near [-1.2,-3.4]",
					fields: [
						{ name: "location", type: "geopoint" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"location":{"$near":{"$geometry":{"type":"Point","coordinates":[-3.4,-1.2]}}}}');
		});
		it('invalid type point',  function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "location near Seville",
					fields: [
						{ name: "location", type: "point" }
					],
					paginate: false 
				}))
			)).toEqual(null); //point is not a valid type
		});


		//pending test: mocking geoService???
		xit('location near Seville',  function(done) {
			expect(sut.uriDecode(
				ngAsync(done, sut.buildBaucisQuery({ 
					searchText: "location near Seville",
					fields: [
						{ name: "location", type: "geopoint" }
					],
					paginate: false 
				}))
			)).toEqual('?conditions={"location":{"$geometry":{"$near":{"type":"Point","coordinates":[1,1]}}}}');
		});

	});
});