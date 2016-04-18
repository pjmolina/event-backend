var fixtures = require('./fixtures');

describe('Place relationships', function () {
    before(fixtures.fakeserver.init);
    after(fixtures.fakeserver.deinit);
    beforeEach(fixtures.testData.createPlaceTestData);
    beforeEach(fixtures.testData.setPlaceIds);

});
