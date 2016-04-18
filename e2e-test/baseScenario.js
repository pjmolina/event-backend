'use strict';
//For Protactor API docs see: https://github.com/angular/protractor/blob/master/docs/tutorial.md

describe('End to end tests (e2e)', function() {

    browser.get('/');
    it('should automatically redirect to /login when location hash/fragment is empty', function() {
        expect(browser.getLocationAbsUrl()).toMatch("/login");
    });

    describe('login', function() {
	    beforeEach(function() {
	        browser.get('/');
	    });
	    it('should render login view', function() {
	        expect(element.all(by.css('h3.text-center')).first().getText()).
				toMatch(/Login/);
	    });
	});

	describe('log-in', function() {
		beforeEach(function() {
		    browser.get('/');
		    element.all(by.id('user')).first().sendKeys('admin');
		    element.all(by.id('password')).first().sendKeys('icinetic');
			element.all(by.id('login')).first().click();
		});
	    it('should be inside dashboard page', function() {
	    	expect(browser.getLocationAbsUrl()).toMatch("/");
	        expect(element.all(by.css('h1')).first().getText()).
	        toMatch(/SampleBackend/);
	    });
    });

});