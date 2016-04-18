var fixtures = require('./fixtures');

describe('Sponsor relationships', function () {
    before(fixtures.fakeserver.init);
    after(fixtures.fakeserver.deinit);
    beforeEach(fixtures.testData.createSponsorTestData);
    beforeEach(fixtures.testData.setSponsorIds);

});
