//Unit tests for utilities module
var expect = require('expect.js');
var sut = require('../../app/services/utilities');

describe("utilities", function() {
	
	describe("format()", function() {
		it("'{name} {surname}' should replace", function() {
			expect(sut.format('{name} {surname}', { 
					name: 'Alice', 
				  	surname: 'Smith'
				})).eql('Alice Smith');
		});	
		it("'{name} {name}' should replace twice", function() {
			expect(sut.format('{name} {name}', { 
					name: 'Alice', 
				  	surname: 'Smith'
				})).eql('Alice Alice');
		});	
	});	

	describe("startsWith()", function() {
		it("Abc, A -> true", function() {
			expect(sut.startsWith('Abc','A')).eql(true);
		});	
		it("Abc, B -> false", function() {
			expect(sut.startsWith('Abc','B')).eql(false);
		});	
		it("null, B -> false", function() {
			expect(sut.startsWith(null,'B')).eql(false);
		});	
		it("Abc, null -> false", function() {
			expect(sut.startsWith('Abc', null)).eql(false);
		});	
	});	
	
	describe("endsWith()", function() {
		it("Abc, c -> true", function() {
			expect(sut.endsWith('Abc','c')).eql(true);
		});	
		it("Abc, B -> false", function() {
			expect(sut.endsWith('Abc','B')).eql(false);
		});	
		it("null, B -> false", function() {
			expect(sut.endsWith(null,'B')).eql(false);
		});	
		it("Abc, null -> false", function() {
			expect(sut.endsWith('Abc', null)).eql(false);
		});	
	});	
	
	describe("isEmptyObject()", function() {
		it("{} -> true", function() {
			expect(sut.isEmptyObject({})).eql(true);
		});	
		it("null -> true", function() {
			expect(sut.isEmptyObject(null)).eql(true);
		});	
		it("[] -> true", function() {
			expect(sut.isEmptyObject([])).eql(true);
		});	
		it("[1] -> false", function() {
			expect(sut.isEmptyObject([1])).eql(false);
		});	
		it("{ name: 1 } -> false", function() {
			expect(sut.isEmptyObject({name: 1})).eql(false);
		});	
	});	
	
	describe("toPascal()", function() {
		it("helloWorld -> HelloWorld", function() {
			expect(sut.toPascal('helloWorld')).eql('HelloWorld');
		});	
		it("hello -> Hello", function() {
			expect(sut.toPascal('hello')).eql('Hello');
		});	
		it("h -> H", function() {
			expect(sut.toPascal('h')).eql('H');
		});	
		it("'' -> ''", function() {
			expect(sut.toPascal('')).eql('');
		});	
		it("null -> null", function() {
			expect(sut.toPascal(null)).eql(null);
		});	
	});
	
	describe("toCamel()", function() {
		it("HelloWorld -> helloWorld", function() {
			expect(sut.toCamel('HelloWorld')).eql('helloWorld');
		});	
		it("Hello -> hello", function() {
			expect(sut.toCamel('Hello')).eql('hello');
		});	
		it("H -> h", function() {
			expect(sut.toCamel('H')).eql('h');
		});	
		it("'' -> ''", function() {
			expect(sut.toCamel('')).eql('');
		});	
		it("null -> null", function() {
			expect(sut.toCamel(null)).eql(null);
		});	
	});
	
	describe("isAllCaps()", function() {
		it("HelloWorld -> false", function() {
			expect(sut.isAllCaps('HelloWorld')).eql(false);
		});	
		it("HELLO -> true", function() {
			expect(sut.isAllCaps('TRUE')).eql(true);
		});	
	});
	
	describe("clone()", function() {
		it("HelloWorld", function() {
			expect(sut.clone('HelloWorld')).eql('HelloWorld');
		});	
		it("{a: 1}", function() {
			expect(sut.clone({a: 1})).eql({a: 1});
		});	
		it("[]", function() {
			expect(sut.clone([])).eql([]);
		});	
		it("[1]", function() {
			expect(sut.clone([1])).eql([1]);
		});	
		it("[1, 2]", function() {
			expect(sut.clone([1, 2])).eql([1, 2]);
		});	
	});
	
	describe("notFoundException()", function() {
		it("invoice 123", function() {
			expect(sut.notFoundException('invoice', 123)).eql({
				type: 'NotFound',
				resource: 'invoice',
				id: 123
			});
		});	
	});
});