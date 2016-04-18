//Unit tests for utilities module
var expect = require('expect.js');
var sut = require('../app/metamodel');

describe("metamodel", function() {
	it("has classes", function() {
		expect(sut.classes).to.be.an(Array);
		var cl0 = sut.classes[0];
		if (cl0) {
			expect(sut.classes[0]).to.have.property('name');
		}		
	});	
	it("classes has properties", function() {
		var cl0 = sut.classes[0];
		if (cl0) {
			expect(sut.classes[0]).to.have.property('attributes');
			expect(sut.classes[0].attributes).to.be.an(Array);			
		}		
	});	
	it("classes has operations", function() {
		var cl0 = sut.classes[0];
		if (cl0) {
			expect(sut.classes[0]).to.have.property('operations');
			expect(sut.classes[0].operations).to.be.an(Array);			
		}
	});	
	it("has associations", function() {
		expect(sut.associations).to.be.an(Array);
	});	
});	